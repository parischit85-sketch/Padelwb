// =============================================
// FILE: src/services/auth.jsx
// =============================================
import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Listener auth
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ---- Login con provider ----
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Aggiungi scopes per ottenere informazioni aggiuntive
  provider.addScope('email');
  provider.addScope('profile');
  
  // Forza la selezione dell'account
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  const result = await signInWithPopup(auth, provider);
  
  // Dopo il login, crea/aggiorna automaticamente il profilo base
  if (result.user) {
    const existingProfile = await getUserProfile(result.user.uid);
    
    // Se il profilo non esiste o mancano dati, crealo/aggiornalo con i dati di Google
    if (!existingProfile.email || !existingProfile.firstName) {
      const names = (result.user.displayName || '').split(' ');
      const profileData = {
        email: result.user.email,
        firstName: existingProfile.firstName || names[0] || '',
        lastName: existingProfile.lastName || names.slice(1).join(' ') || '',
        phone: existingProfile.phone || '',
        avatar: result.user.photoURL || '',
        provider: 'google',
        ...existingProfile, // mantieni i dati esistenti
      };
      
      await saveUserProfile(result.user.uid, profileData);
    }
  }
  
  return result;
}

export async function loginWithFacebook() {
  const provider = new FacebookAuthProvider();
  
  // Aggiungi permessi per ottenere email e profilo
  provider.addScope('email');
  provider.addScope('public_profile');
  
  const result = await signInWithPopup(auth, provider);
  
  // Dopo il login, crea/aggiorna automaticamente il profilo base
  if (result.user) {
    const existingProfile = await getUserProfile(result.user.uid);
    
    // Se il profilo non esiste o mancano dati, crealo/aggiornalo con i dati di Facebook
    if (!existingProfile.email || !existingProfile.firstName) {
      const names = (result.user.displayName || '').split(' ');
      const profileData = {
        email: result.user.email,
        firstName: existingProfile.firstName || names[0] || '',
        lastName: existingProfile.lastName || names.slice(1).join(' ') || '',
        phone: existingProfile.phone || '',
        avatar: result.user.photoURL || '',
        provider: 'facebook',
        ...existingProfile, // mantieni i dati esistenti
      };
      
      await saveUserProfile(result.user.uid, profileData);
    }
  }
  
  return result;
}

// ---- Magic link (email link) ----
const ACTION_CODE_SETTINGS = {
  url: `${window.location.origin}/`, // ritorna alla home dell’app
  handleCodeInApp: true,
};

export async function sendMagicLink(email) {
  await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
  try { localStorage.setItem('ml-magic-email', email); } catch {}
}

// Da chiamare all’avvio della pagina per completare l’accesso via link
export async function completeMagicLinkIfPresent() {
  try {
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return null;

    let email = null;
    try { email = localStorage.getItem('ml-magic-email'); } catch {}
    if (!email) {
      email = window.prompt('Per completare l’accesso, inserisci la tua email:') || '';
    }
    const res = await signInWithEmailLink(auth, email, href);
    try { localStorage.removeItem('ml-magic-email'); } catch {}
    // pulizia URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Dopo il login via magic link, crea il profilo base se non esiste
    if (res.user) {
      const existingProfile = await getUserProfile(res.user.uid);
      
      if (!existingProfile.email) {
        const profileData = {
          email: res.user.email,
          firstName: '',
          lastName: '',
          phone: '',
          provider: 'email',
          ...existingProfile, // mantieni i dati esistenti
        };
        
        await saveUserProfile(res.user.uid, profileData);
      }
    }
    
    return res;
  } catch (e) {
    console.warn('completeMagicLinkIfPresent error:', e);
    throw e;
  }
}

// Logout
export async function logout() {
  await signOut(auth);
}

// ====== PROFILO UTENTE (Firestore: profiles/{uid}) ======
export async function getUserProfile(uid) {
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export async function saveUserProfile(uid, data) {
  const ref = doc(db, 'profiles', uid);
  await setDoc(ref, { ...data, _updatedAt: Date.now() }, { merge: true });
}

export async function setDisplayName(user, name) {
  await updateProfile(user, { displayName: name });
}

// (opzionale) esponi auth se serve in UI
export { auth };
