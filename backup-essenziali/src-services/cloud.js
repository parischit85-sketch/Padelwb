// =============================================
// FILE: src/services/cloud.js
// =============================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function loadLeague(leagueId) {
  const snap = await getDoc(doc(db, 'leagues', leagueId));
  return snap.exists() ? snap.data() : null;
}

export async function saveLeague(leagueId, data) {
  // merge per non sovrascrivere tutto
  await setDoc(doc(db, 'leagues', leagueId), data, { merge: true });
}

export function subscribeLeague(leagueId, cb) {
  // ritorna l'unsubscribe usato già dal tuo App.jsx
  return onSnapshot(doc(db, 'leagues', leagueId), (snap) => {
    if (snap.exists()) cb(snap.data());
  });
}
