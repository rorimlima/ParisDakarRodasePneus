import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function main() {
  console.log('⚡ Starting Firestore products activation script...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const snap = await getDocs(collection(db, 'products'));
  console.log(`📦 Found ${snap.docs.length} total products in Firestore.`);

  let activatedCount = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const document of snap.docs) {
    const data = document.data();
    const quantidade = Number(data.quantidade || 0);

    if (quantidade > 0 && (!data.ativo || !data.ativoManual)) {
      batch.update(doc(db, 'products', document.id), {
        ativo: true,
        ativoManual: true,
        motivoInativacao: null,
        atualizadoEm: new Date().toISOString()
      });
      activatedCount++;
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        console.log(`   Committed batch of ${batchCount} updates...`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   Committed final batch of ${batchCount} updates.`);
  }

  console.log(`✅ Finished! Activated ${activatedCount} products in Firestore.`);
}

main().catch((err) => {
  console.error('❌ Error activating products:', err);
  process.exit(1);
});
