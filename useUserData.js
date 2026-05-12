// Developer: AKARSHANA
// src/hooks/useUserData.js
import { useAuth } from "../context/AuthContext";

/**
 * useUserData — Convenience hook that returns the current user's
 * Firestore document data along with common derived values.
 *
 * Returns:
 *   userData      — raw Firestore user document
 *   currentUser   — Firebase Auth user object
 *   isPremium     — boolean: plan !== "free"
 *   isExpired     — boolean: licenseExpiry is past
 *   daysRemaining — number | null
 *   loading       — boolean
 */
export function useUserData() {
  const { currentUser, userData, loading } = useAuth();

  const daysRemaining = (() => {
    if (!userData?.licenseExpiry) return null;
    try {
      const expiry = userData.licenseExpiry.toDate
        ? userData.licenseExpiry.toDate()
        : new Date(userData.licenseExpiry);
      if (isNaN(expiry.getTime())) return 0; // Treat malformed date as expired
      return Math.ceil((expiry - new Date()) / 86_400_000);
    } catch {
      return 0; // Malformed timestamp — treat as expired
    }
  })();

  const isExpired  = daysRemaining !== null && daysRemaining <= 0;
  const isPremium  = !!(userData?.plan && userData.plan !== "free") && !isExpired;

  return {
    userData,
    currentUser,
    isPremium,
    isExpired,
    daysRemaining,
    loading,
  };
}
