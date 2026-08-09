const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace(
  "import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, signInWithRedirect } from 'firebase/auth';",
  "import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, signInWithRedirect, signInWithCredential } from 'firebase/auth';"
);
code = code.replace(
  "export { ",
  "export { signInWithCredential, GoogleAuthProvider as GoogleAuthProviderClass, "
);
fs.writeFileSync('src/lib/firebase.ts', code);
