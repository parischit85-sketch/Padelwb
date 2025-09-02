// src/cloud.js

import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// TUO CONFIG (marsica-padel)
const firebaseConfig = {
  apiKey: 'AIzaSyDtKZV6_QhkvyFKMFZklbp-5IO_-Da1-c0',
  authDomain: 'marsica-padel.firebaseapp.com',
  projectId: 'marsica-padel',
  storageBucket: 'marsica-padel.firebasestorage.app',
  messagingSenderId: '626616551949',
  appId: '1:626616551949:web:cad93c91cc1558ac0e2344',
  measurementId: 'G-W0B9MECRM4',
};

// Inizializza una sola volta
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- API usate da App.jsx ----------
export async function loadLeague(leagueId) {
  try {
    const ref = doc(db, 'leagues', leagueId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('loadLeague error:', e);
    return null;
  }
}

export async function saveLeague(leagueId, state) {
  try {
    const ref = doc(db, 'leagues', leagueId);
    await setDoc(ref, state, { merge: true });
  } catch (e) {
    console.warn('saveLeague error:', e);
  }
}

export function subscribeLeague(leagueId, callback) {
  // 🔔 realtime: chiama callback con lo stato (o null se il doc non esiste)
  const ref = doc(db, 'leagues', leagueId);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? snap.data() : null),
    (err) => console.warn('subscribeLeague error:', err)
  );
}

// ---------- diagnostica usata in Extra ----------
export async function testWritePing() {
  try {
    await setDoc(doc(db, 'diagnostics', 'ping'), { t: Date.now() }, { merge: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function testReadPing() {
  try {
    const snap = await getDoc(doc(db, 'diagnostics', 'ping'));
    return { ok: snap.exists(), data: snap.data() || null };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}
