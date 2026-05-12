// Developer: AKARSHANA
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Wraps routes that require authentication.
 * Redirects unauthenticated users to /auth.
 *
 * Usage:
 *   <Route path="/portal" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan rounded-full border-t-transparent animate-spin" />
          <span className="font-mono text-cyan/70 text-xs tracking-widest">
            INITIALIZING...
          </span>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/auth" replace />;
}
