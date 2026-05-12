// Developer: AKARSHANA
// src/pages/portal/ProfilePage.jsx — Account profile & settings
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  HiUser, HiMail, HiShieldCheck, HiCalendar,
  HiPencil, HiCheck, HiX, HiDesktopComputer,
  HiStar, HiLockClosed,
} from "react-icons/hi";

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return "—"; }
}

/* ── Editable Display Name ───────────────────────────────── */
function EditableName({ value, uid, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || "");
  const [saving,  setSaving]  = useState(false);
  const { toast } = useToast();

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await updateDoc(doc(db, "users", uid), { displayName: trimmed });
      onSaved(trimmed);
      toast("Display name updated!", "success");
      setEditing(false);
    } catch {
      toast("Could not update name. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value || ""); setEditing(false); };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          maxLength={40}
          autoFocus
          className="cyber-input text-sm flex-1 min-w-0"
        />
        <button
          onClick={save}
          disabled={saving}
          title="Save"
          className="w-8 h-8 flex items-center justify-center border border-cyan/30 text-cyan
                     hover:bg-cyan/10 rounded transition-all disabled:opacity-50"
        >
          {saving
            ? <div className="w-3 h-3 border border-cyan border-t-transparent rounded-full animate-spin" />
            : <HiCheck size={14} />
          }
        </button>
        <button
          onClick={cancel}
          title="Cancel"
          className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40
                     hover:text-red-400 rounded transition-all"
        >
          <HiX size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-orbitron text-lg font-bold text-white">{value || "—"}</span>
      <button
        onClick={() => { setDraft(value || ""); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-cyan transition-all"
        title="Edit name"
      >
        <HiPencil size={13} />
      </button>
    </div>
  );
}

/* ── Info Row ─────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, color = "text-white" }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg border border-cyan/15 flex items-center justify-center text-cyan/50 shrink-0 mt-0.5">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-orbitron text-white/30 tracking-widest mb-1">{label}</div>
        <div className={`text-sm font-mono ${color} break-all`}>{value}</div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function ProfilePage() {
  const { currentUser, userData, isPremium } = useAuth();
  const [localName, setLocalName] = useState(null); // optimistic update

  const displayName = localName ?? userData?.displayName ?? currentUser?.displayName ?? "User";
  const plan        = (userData?.plan || "free").toUpperCase();
  const devicePct   = userData
    ? Math.round(((userData.activeDevices || 0) / (userData.maxDevices || 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-dark pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-cyan rounded-full" />
            <span className="text-xs font-mono text-cyan/60 tracking-widest">ACCOUNT</span>
          </div>
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white">
            MY <span className="neon-text">PROFILE</span>
          </h1>
        </motion.div>

        {/* Avatar & Name Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-5 flex items-center gap-5"
        >
          {/* Avatar */}
          <div className="w-16 h-16 rounded-xl border border-cyan/30 flex items-center justify-center
                          bg-cyan/5 text-cyan shrink-0 overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <HiUser size={30} />
            )}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <EditableName
              value={displayName}
              uid={currentUser?.uid}
              onSaved={setLocalName}
            />
            <p className="text-xs text-white/40 mt-1 font-mono truncate">
              {currentUser?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge-cyan text-[10px] ${isPremium ? "" : "opacity-60"}`}>
                {plan}
              </span>
              {isPremium && (
                <HiStar className="text-cyan/60" size={12} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 mb-5"
        >
          <div className="font-orbitron text-xs text-white/50 tracking-widest mb-2">
            ACCOUNT DETAILS
          </div>
          <InfoRow icon={HiMail}        label="Email"         value={currentUser?.email || "—"} />
          <InfoRow icon={HiShieldCheck} label="Current Plan"  value={plan}
            color={isPremium ? "text-cyan" : "text-white/50"} />
          <InfoRow icon={HiCalendar}    label="Member Since"  value={formatDate(userData?.createdAt)} />
          <InfoRow icon={HiCalendar}    label="License Until" value={formatDate(userData?.licenseExpiry)}
            color={isPremium ? "text-green-400" : "text-red-400/70"} />
        </motion.div>

        {/* Device Usage */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiDesktopComputer className="text-cyan/50" size={14} />
              <span className="font-orbitron text-xs text-white/50 tracking-widest">DEVICE SLOTS</span>
            </div>
            <span className="text-xs font-mono text-cyan/60">
              {userData?.activeDevices ?? 0} / {userData?.maxDevices ?? 1}
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(devicePct, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {devicePct >= 100 && (
            <p className="text-red-400 text-xs mt-2 font-mono">⚠ All device slots in use</p>
          )}
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 mb-5 flex items-start gap-3"
        >
          <HiLockClosed className="text-cyan/40 shrink-0 mt-0.5" size={16} />
          <div>
            <div className="font-orbitron text-xs text-white/50 tracking-widest mb-1">
              SESSION SECURITY
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Single-device session enforcement is active. Signing in from a new device
              automatically terminates your current session.
            </p>
          </div>
        </motion.div>

        {/* Upgrade CTA */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-6 border-cyan/20 text-center"
          >
            <HiStar className="text-cyan/60 mx-auto mb-3" size={28} />
            <div className="font-orbitron text-sm text-cyan mb-1">UNLOCK PREMIUM</div>
            <p className="text-xs text-white/40 mb-5">
              Upgrade your plan to access premium downloads and all features.
            </p>
            <Link
              to="/portal/store"
              className="btn-cyber-filled text-xs px-8 py-2.5"
              style={{ clipPath: "none", borderRadius: "8px" }}
            >
              VIEW PACKAGES
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
