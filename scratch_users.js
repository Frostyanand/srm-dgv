const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function dump() {
  const snapshot = await db.collection('workflows').get();
  const workflows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("WORKFLOWS:", JSON.stringify(workflows, null, 2));

  const uSnapshot = await db.collection('users').get();
  const users = uSnapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email, role: doc.data().role, name: doc.data().name }));
  console.log("USERS:", JSON.stringify(users, null, 2));
}

dump().catch(console.error);
