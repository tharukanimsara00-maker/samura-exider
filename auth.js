// Developer: AKARSHANA
// src/firebase/auth.js — with single-session enforcement
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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
  await updateDoc(doc(db, "users", uid), {
    sessionToken: token,
    lastLoginAt:  serverTimestamp(),
  });
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
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await createUserDoc(cred.user);
  await setSessionToken(cred.user.uid);
  return cred.user;
}

// ─── Sign Out ───────────────────────────────────────────────
export async function logout(uid) {
  if (uid) localStorage.removeItem("_st_" + uid);
  await signOut(auth);
}
