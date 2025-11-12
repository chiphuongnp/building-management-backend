import admin from 'firebase-admin';
import serviceAccount from '../configs/firebaseConfig.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}
const db = admin.firestore();

export { db, admin };
