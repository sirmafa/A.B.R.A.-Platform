export const mockApi = {
  requestPat: (user, companyId) => new Promise((resolve) => {
    setTimeout(() => {
      const token = 'PAT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiry = Date.now() + 900000;
      resolve({ token, expiry, message: 'PAT issued via JIT Access Gate. Hash anchored on DLT.' });
    }, 1500);
  }),

  anchorProof: (hash) => new Promise((resolve, reject) => {
    if (hash.length !== 64) {
      reject(new Error("Invalid hash format. Must be SHA-256."));
      return;
    }
    setTimeout(() => {
      resolve({ success: true, message: 'Backup Proof successfully anchored to DLT.', hash });
    }, 2000);
  }),

  verifyProof: (currentHash) => new Promise((resolve) => {
    setTimeout(() => {
      const DLT_ANCHOR = 'CLEAN_BACKUP_HASH_987654321ABCDEF0123456789ABCDEF0123456789';
      const isMatch = currentHash === DLT_ANCHOR;
      const status = isMatch ? 'VERIFIED-CLEAN' : 'COMPROMISED';
      resolve({ isMatch, status, anchoredHash: DLT_ANCHOR });
    }, 2500);
  }),
};