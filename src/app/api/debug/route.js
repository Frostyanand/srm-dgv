import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request) {
  try {
    const docsSnapshot = await adminDb.collection('documents').get();
    const documents = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const versions = [];
    for (const doc of documents) {
      const vSnap = await adminDb.collection('documents').doc(doc.id).collection('versions').get();
      vSnap.forEach(v => versions.push({ id: v.id, ...v.data() }));
    }
    
    return NextResponse.json({ documents, versions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
