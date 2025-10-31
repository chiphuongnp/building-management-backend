import { db, convertTimestamps } from './index';

const getAllDocs = async (collectionName: string) => {
  const snapshot = await db.collection(collectionName).get();
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  }));

  return data;
};

const getDoc = async (collectionName: string, id: string) => {
  const snapshot = await db.collection(collectionName).doc(id).get();
  return {
    id: snapshot.id,
    ...convertTimestamps(snapshot.data()),
  };
};

const createDoc = async (collectionName: string, data: Record<string, any>) => {
  return await db.collection(collectionName).add({
    ...data,
    created_at: new Date(),
  });
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

const deleteDoc = async (collectionName: string, id: string) => {
  return await db.collection(collectionName).doc(id).delete();
};

export { getAllDocs, getDoc, createDoc, updateDoc, deleteDoc };
