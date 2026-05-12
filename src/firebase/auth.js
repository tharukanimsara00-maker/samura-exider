// Developer: AKARSHANA
// src/firebase/auth.js — with single-session enforcement + mobile Google fix
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Detect mobile/tablet — popups get blocked on mobile browsers
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

// ─── Generate a unique session token ────────────────────────
function generateSessionToken() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

// ─── Store session token locally & in Firestore ─────────────
async function setSessionToken(uid) {
  const token = generateSessionToken();
  localStorage.setItem("_st_" + uid, token);
  await setDoc(doc(db, "users", uid), {
    sessionToken: token,
    lastLoginAt:  serverTimestamp(),
  }, { merge: true });
  return token;
}

// ─── Create user document in Firestore ─────────────────────
async function createUserDoc(user, extraData = {}) {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:          user.uid,
      displayName:  user.displayName || extraData.displayName || "Xiter User",
      email:        user.email,
      photoURL:     user.photoURL || null,
      plan:         "free",
      licenseExpiry: null,
      activeDevices: 0,
      maxDevices:   1,
      sessionToken: null,
      createdAt:    serverTimestamp(),
      ...extraData,
    });
  }
}

// ─── Email / Password Register ──────────────────────────────
export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserDoc(cred.user, { displayName });
  await setSessionToken(cred.user.uid);
  return cred.user;
}

// ─── Email / Password Login ─────────────────────────────────
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await setSessionToken(cred.user.uid);
  return cred.user;
}

// ─── Google Sign-In ─────────────────────────────────────────
// Mobile → signInWithRedirect (popups are blocked on mobile browsers)
// Desktop → signInWithPopup (instant, no full-page reload)
export async function loginWithGoogle() {
  if (isMobileDevice()) {
    await signInWithRedirect(auth, googleProvider);
    return null; // page will reload; result handled by handleGoogleRedirect()
  }
  const cred = await signInWithPopup(auth, googleProvider);
  await createUserDoc(cred.user);
  await setSessionToken(cred.user.uid);
  return cred.user;
}

// ─── Handle Google Redirect Result (called on AuthPage mount) ─
export async function handleGoogleRedirect() {
  const cred = await getRedirectResult(auth);
  if (cred) {
    await createUserDoc(cred.user);
    await setSessionToken(cred.user.uid);
    return cred.user;
  }
  return null;
}

// ─── Sign Out ───────────────────────────────────────────────
export async function logout(uid) {
  if (uid) localStorage.removeItem("_st_" + uid);
  await signOut(auth);
}
