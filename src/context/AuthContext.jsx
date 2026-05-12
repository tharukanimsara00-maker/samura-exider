// Developer: AKARSHANA
// src/context/AuthContext.jsx — with single-session enforcement
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { subscribeUserData } from "../firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sessionKicked, setSessionKicked] = useState(false);
  const uidRef = useRef(null);

  useEffect(() => {
    let unsubData = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      uidRef.current = user?.uid || null;

      if (unsubData) { unsubData(); unsubData = null; }

      if (user) {
        let firstSnapshot = true;
        unsubData = subscribeUserData(user.uid, async (data) => {
          // ── Single-session check ─────────────────────────────
          if (data?.sessionToken) {
            const localToken = localStorage.getItem("_st_" + user.uid);
            if (localToken && localToken !== data.sessionToken) {
              // Another device logged in — kick this session
              localStorage.removeItem("_st_" + user.uid);
              setSessionKicked(true);
              await signOut(auth); // BUG FIX: was not awaited — race condition
              return;
            }
          }
          // ────────────────────────────────────────────────────

          setUserData(data);
          if (firstSnapshot) {
            firstSnapshot = false;
            setLoading(false);
          }
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubData) unsubData();
    };
  }, []);

  const isPremium = useMemo(() => {
    if (!userData?.plan || userData.plan === "free") return false;
    try {
      if (userData.licenseExpiry) {
        const expiry = userData.licenseExpiry.toDate
          ? userData.licenseExpiry.toDate()
          : new Date(userData.licenseExpiry);
        if (isNaN(expiry.getTime()) || expiry < new Date()) return false;
      }
    } catch {
      return false;
    }
    return true;
  }, [userData]);

  return (
    <AuthContext.Provider value={{
      currentUser, userData, loading, isPremium, sessionKicked,
      // BUG FIX: was uidRef.current — refs don't trigger re-renders so the
      // value could be stale. Derive uid from currentUser instead.
      uid: currentUser?.uid || null,
    }}>
      {/* Session kicked banner */}
      {/* BUG FIX: added pointer-events-none on the backdrop but keep the inner card
          clickable. Without this, the overlay is visible but clicks still pass through
          to the underlying page (e.g. clicking Navbar links while kicked). */}
      {sessionKicked && !loading && !currentUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 pointer-events-auto">
          <div className="bg-[#0d0d0d] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-orbitron text-red-400 text-sm tracking-widest mb-3">SESSION TERMINATED</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Your account was signed in from another device.<br />
              You have been logged out automatically.
            </p>
            <button
              onClick={() => { setSessionKicked(false); window.location.href = "/auth"; }}
              className="w-full py-3 bg-cyan/10 border border-cyan/30 text-cyan font-orbitron text-xs tracking-widest rounded-lg hover:bg-cyan/20 transition-all"
            >
              SIGN IN AGAIN
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
