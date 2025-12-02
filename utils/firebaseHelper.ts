import { db, convertTimestamps } from './index';

const getAllDocs = async (collectionName: string) => {
  const snapshot = await db.collection(collectionName).get();
  const data = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    }))
    .filter((item) => !item.deleted_at);

  return data;
};

const getDocById = async (collectionName: string, id: string) => {
  const docSnap = await db.collection(collectionName).doc(id).get();
  if (!docSnap.exists) {
    return null;
  }

  const data = convertTimestamps(docSnap.data());
  if (data?.deleted_at) {
    return null;
  }

  return { id: docSnap.id, ...data };
};

const getDocByField = async (collectionName: string, field: string, value: any) => {
  const snapshot = await db.collection(collectionName).where(field, '==', value).get();
  const data = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    }))
    .filter((item) => !item.deleted_at);

  return data;
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

  const snapshot = await query.get();
  const data = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    }))
    .filter((item) => !item.deleted_at);

  return data;
};

const createDoc = async (
  collectionName: string,
  data: Record<string, any>,
): Promise<FirebaseFirestore.DocumentReference> => {
  const { id, ...cleanData } = data;
  const docData = {
    ...cleanData,
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
      ...data,
      updated_at: new Date(),
    });
};

const createBatchDocs = async (collectionName: string, dataArray: Record<string, any>[]) => {
  const batch = db.batch();
  dataArray.forEach((data) => {
    const { id, ...cleanData } = data;
    const docRef = id ? db.collection(collectionName).doc(id) : db.collection(collectionName).doc();
    batch.set(docRef, {
      ...convertTimestamps(cleanData),
      created_at: new Date(),
    });
  });

  return await batch.commit();
};

const runTransaction = async <T>(
  transactionFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
): Promise<T> => {
  return db.runTransaction(transactionFn);
};

const getTransaction = async (
  collectionPath: string,
  id: string,
  transaction: FirebaseFirestore.Transaction,
) => {
  const ref = db.collection(collectionPath).doc(id);
  const snapshot = await transaction.get(ref);
  if (!snapshot.exists) return null;

  const data = convertTimestamps(snapshot.data());
  if (data.deleted_at) return null;

  return { id: snapshot.id, ...data };
};

const setTransaction = (
  collectionPath: string,
  data: Record<string, any>,
  transaction: FirebaseFirestore.Transaction,
) => {
  const { id, ...cleanData } = data;
  const ref = id ? db.collection(collectionPath).doc(id) : db.collection(collectionPath).doc();
  const docData = { ...cleanData, created_at: new Date() };

  transaction.set(ref, docData);
  return { id: ref.id, ...docData };
};

const updateTransaction = async (
  collectionName: string,
  id: string,
  data: Record<string, any>,
  transaction: FirebaseFirestore.Transaction,
): Promise<void> => {
  const ref = db.collection(collectionName).doc(id);
  transaction.update(ref, {
    ...data,
    updated_at: new Date(),
  });
};

export {
  getAllDocs,
  getDocById,
  getDocByField,
  createDoc,
  updateDoc,
  getDocsByFields,
  createBatchDocs,
  runTransaction,
  getTransaction,
  setTransaction,
  updateTransaction,
};
