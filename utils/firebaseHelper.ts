import { db, convertTimestamps } from './index';

const getAllDocs = async (collectionName: string) => {
  const snapshot = await db.collection(collectionName).get();
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  }));
  return data;
};

const getDocById = async (collectionName: string, id: string) => {
  const docSnap = await db.collection(collectionName).doc(id).get();
  if (!docSnap.exists) {
    return null;
  }

  return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
};

const getDocByField = async (collectionName: string, field: string, value: string) => {
  return await db.collection(collectionName).where(field, '==', value).get();
};

const getDocsByFields = async (
  collectionPath: string,
  conditions: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }[],
  limit?: number,
) => {
  let query: FirebaseFirestore.Query = db.collection(collectionPath);

  for (const condition of conditions) {
    query = query.where(condition.field, condition.operator, condition.value);
  }

  if (limit) {
    query = query.limit(limit);
  }

  return await query.get();
};

const createDoc = async (
  collectionName: string,
  data: Record<string, any>,
): Promise<FirebaseFirestore.DocumentReference> => {
  const { id, ...cleanData } = data;
  const docData = {
    ...convertTimestamps(cleanData),
    created_at: new Date(),
  };
  if (id) {
    const docRef = db.collection(collectionName).doc(id);
    await docRef.set(docData);
    return docRef;
  }

  return await db.collection(collectionName).add(docData);
};

const updateDoc = async (collectionName: string, id: string, data: Record<string, any>) => {
  return await db
    .collection(collectionName)
    .doc(id)
    .update({
      ...convertTimestamps(data),
      updated_at: new Date(),
    });
};

export { getAllDocs, getDocById, getDocByField, createDoc, updateDoc, getDocsByFields };
