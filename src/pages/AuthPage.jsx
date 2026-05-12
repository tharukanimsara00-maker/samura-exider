// Developer: AKARSHANA
// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { registerWithEmail, loginWithEmail, loginWithGoogle } from "../firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { FcGoogle } from "react-icons/fc";
import { HiEye, HiEyeOff, HiUser, HiMail, HiLockClosed, HiExclamation, HiArrowLeft } from "react-icons/hi";

// Maps Firebase error codes → user-friendly messages
const AUTH_ERRORS = {
  "auth/email-already-in-use":  "This email is already registered.",
  "auth/user-not-found":        "No account found with this email.",
  "auth/wrong-password":        "Incorrect password. Try again.",
  "auth/invalid-credential":    "Invalid email or password. Try again.",  // newer Firebase SDK
  "auth/invalid-email":         "Please enter a valid email address.",
  "auth/too-many-requests":     "Too many attempts. Please try later.",
  "auth/weak-password":         "Password must be at least 6 characters.",
  "auth/popup-closed-by-user":  "Sign-in popup was closed. Please try again.",
  "auth/network-request-failed":"Network error. Check your connection.",
};

export default function AuthPage() {
  const [mode,     setMode]     = useState("login");   // "login" | "register" | "forgot"
  const [form,     setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect already-logged-in users straight to portal.
  // Wait until auth state is resolved (authLoading=false) to avoid a
  // brief flash of the login form for users who are already signed in.
  useEffect(() => {
    if (!authLoading && currentUser) navigate("/portal", { replace: true });
  }, [currentUser, authLoading, navigate]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && form.password !== form.confirm) {
      return setError("Passwords do not match.");
    }
    // BUG FIX: Only enforce min-length on REGISTER — login should never
    // block a user who already has a <6-char legacy password.
    if (mode === "register" && form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(form.email, form.password, form.name);
      } else {
        await loginWithEmail(form.email, form.password);
      }
      navigate("/portal");
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email) return setError("Please enter your email address.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
      toast("Reset email sent! Check your inbox.", "success");
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/portal");
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // While Firebase is resolving auth state, show nothing (ProtectedRoute handles the spinner)
  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 bg-grid bg-dark relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[600px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1,  y: 0  }}
          className="text-center mb-8"
        >
          <Link to="/">
            <span className="font-orbitron text-2xl">
              <span className="brand-samura">SAMURA </span>
              <span className="brand-xiter">XITER</span>
            </span>
          </Link>
          <p className="text-white/30 text-sm mt-1 font-mono tracking-widest">CLIENT PORTAL ACCESS</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ delay: 0.15 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />

          {/* ── Forgot Password Mode ── */}
          {mode === "forgot" ? (
            <div>
              <button
                onClick={() => { setMode("login"); setError(""); setResetSent(false); }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-cyan mb-6 font-orbitron tracking-widest transition-colors"
              >
                <HiArrowLeft size={14} /> BACK TO LOGIN
              </button>

              <h2 className="font-orbitron text-sm text-white mb-1">RESET PASSWORD</h2>
              <p className="text-xs text-white/40 mb-6">
                Enter your account email and we'll send a reset link.
              </p>

              {resetSent ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">📧</div>
                  <div className="font-orbitron text-cyan text-sm mb-2">EMAIL SENT!</div>
                  <p className="text-xs text-white/40">
                    Check your inbox for the password reset link.
                  </p>
                  <button
                    onClick={() => { setMode("login"); setResetSent(false); setError(""); }}
                    className="mt-6 text-xs font-orbitron text-cyan hover:underline tracking-widest"
                  >
                    BACK TO LOGIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                      <HiExclamation className="text-red-400 shrink-0" size={16} />
                      <span className="text-xs text-red-300">{error}</span>
                    </div>
                  )}
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={update("email")}
                      required
                      className="cyber-input pl-10 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-cyber-filled py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ clipPath: "none", borderRadius: "8px" }}
                  >
                    {loading ? "SENDING..." : "SEND RESET LINK"}
                  </button>
                </form>
              )}
            </div>
          ) : (
          <>
          {/* Mode toggle */}
          <div className="flex bg-black/40 rounded-lg p-1 mb-8">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setShowPwd(false); setForm({ name: "", email: "", password: "", confirm: "" }); }}
                className={`flex-1 py-2.5 rounded-md text-xs font-orbitron tracking-widest transition-all duration-300 ${
                  mode === m
                    ? "bg-cyan text-dark font-bold shadow-neon-sm"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {m === "login" ? "SIGN IN" : "REGISTER"}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10
                       rounded-lg text-sm font-rajdhani tracking-widest hover:bg-white/10 hover:border-white/20
                       transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle size={20} />
            CONTINUE WITH GOOGLE
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 font-mono text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "register" && (
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan/50" size={16} />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={form.name}
                    onChange={update("name")}
                    required
                    className="cyber-input pl-10"
                  />
                </div>
              )}

              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan/50" size={16} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={update("email")}
                  required
                  className="cyber-input pl-10"
                />
              </div>

              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan/50" size={16} />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={update("password")}
                  required
                  className="cyber-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-cyan transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <HiEyeOff size={16} /> : <HiEye size={16} />}
                </button>
              </div>

              {mode === "register" && (
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan/50" size={16} />
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.confirm}
                    onChange={update("confirm")}
                    required
                    className="cyber-input pl-10"
                  />
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3"
                  >
                    <HiExclamation className="text-red-400 shrink-0" size={16} />
                    <span className="text-red-400 text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-cyber-filled py-3.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ clipPath: "none", borderRadius: "8px" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  mode === "login" ? "ACCESS PORTAL" : "CREATE ACCOUNT"
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Terms */}
          {mode === "register" && (
            <p className="text-white/25 text-xs text-center mt-4">
              By registering you agree to our terms of service and privacy policy.
            </p>
          )}

          {/* Forgot password link */}
          {mode === "login" && (
            <div className="text-center mt-4">
              <button
                onClick={() => { setMode("forgot"); setError(""); }}
                className="text-xs text-white/30 hover:text-cyan transition-colors font-mono tracking-widest"
              >
                FORGOT PASSWORD?
              </button>
            </div>
          )}
          </>
          )} {/* end forgot/login-register conditional */}
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-white/30 text-sm hover:text-cyan transition-colors font-mono">
            ← BACK TO MAIN SITE
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
