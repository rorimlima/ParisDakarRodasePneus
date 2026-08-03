import { firebaseAuth } from '../config/firebase.js';

/**
 * Utilitário CLI para definir Custom Claim de 'admin' em um usuário do Firebase Auth.
 * Uso: npx ts-node src/scripts/setAdminClaim.ts <UID_DO_USUARIO>
 */
const setAdminClaim = async (uid: string) => {
  if (!uid) {
    console.error('❌ Erro: Forneça o UID do usuário. Exemplo: npx ts-node src/scripts/setAdminClaim.ts USER_UID_HERE');
    process.exit(1);
  }

  try {
    const user = await firebaseAuth.getUser(uid);
    await firebaseAuth.setCustomUserClaims(uid, { role: 'admin' });
    console.log(`✅ Sucesso! O usuário ${user.email} (UID: ${uid}) agora possui a role 'admin'.`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao atribuir claim de admin:', error.message);
    process.exit(1);
  }
};

const targetUid = process.argv[2];
setAdminClaim(targetUid);
