// Developer: AKARSHANA
// src/pages/portal/DashboardPage.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  HiShieldCheck, HiDesktopComputer, HiCalendar,
  HiShoppingBag, HiDownload, HiClock, HiCheckCircle,
  HiExclamationCircle, HiChevronRight,
} from "react-icons/hi";

/* ── Helpers ──────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return "N/A";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function daysRemaining(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.ceil((d - new Date()) / 86400000);
  return diff;
}

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = "cyan", delay = 0 }) {
  const colors = {
    cyan:   "text-cyan   border-cyan/20   bg-cyan/5",
    green:  "text-green-400 border-green-400/20 bg-green-400/5",
    yellow: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
    red:    "text-red-400 border-red-400/20 bg-red-400/5",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ delay }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {sub && <span className="text-xs font-mono text-white/30">{sub}</span>}
      </div>
      <div className="font-orbitron text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/40 font-rajdhani">{label}</div>
    </motion.div>
  );
}

/* ── Log Entry ─────────────────────────────────────────── */
function LogEntry({ time, action, status }) {
  const isOk = status === "success";
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isOk ? "bg-green-400" : "bg-red-400"}`} />
        <span className="text-sm text-white/70 font-rajdhani">{action}</span>
      </div>
      <div className="flex items-center gap-3">
        {isOk
          ? <HiCheckCircle className="text-green-400/60" size={14} />
          : <HiExclamationCircle className="text-red-400/60" size={14} />
        }
        <span className="text-xs text-white/25 font-mono">{time}</span>
      </div>
    </div>
  );
}

/* ── Quick Action Card ─────────────────────────────────── */
function QuickAction({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="glass-card p-5 flex items-center gap-4 group hover:border-cyan/30 transition-all">
      <div className="w-10 h-10 border border-cyan/20 rounded-lg flex items-center justify-center
                      text-cyan/60 group-hover:text-cyan group-hover:border-cyan/50 group-hover:shadow-neon-sm transition-all">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-orbitron text-xs font-semibold text-white mb-0.5">{title}</div>
        <div className="text-xs text-white/40 truncate">{desc}</div>
      </div>
      <HiChevronRight className="text-white/20 group-hover:text-cyan transition-colors shrink-0" size={16} />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { currentUser, userData } = useAuth();

  const days    = useMemo(() => daysRemaining(userData?.licenseExpiry), [userData]);
  const expired = days !== null && days <= 0;
  const expColor = expired ? "red" : days !== null && days <= 7 ? "yellow" : "green";

  const devicePct = userData
    ? Math.round((userData.activeDevices / (userData.maxDevices || 1)) * 100)
    : 0;

  /* Mock recent logs (replace with real Firestore logs collection) */
  const logs = [
    { time: "Today, 10:32",   action: "Login — Chrome / Windows",   status: "success" },
    { time: "Today, 10:30",   action: "Portal access",               status: "success" },
    { time: "Yesterday",      action: "Software downloaded",         status: "success" },
    { time: "3 days ago",     action: "Failed login attempt",        status: "error"   },
    { time: "5 days ago",     action: "License renewed",             status: "success" },
  ];

  const greetHour = new Date().getHours();
  const greeting  = greetHour < 12 ? "Good Morning" : greetHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-dark pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Page Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-cyan rounded-full" />
            <span className="text-xs font-mono text-cyan/60 tracking-widest">CLIENT PORTAL</span>
          </div>
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white">
            {greeting}, <span className="neon-text">
              {userData?.displayName || currentUser?.displayName || "Operator"}
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-1 font-rajdhani">
            Welcome back to your Samura Xiter dashboard.
          </p>
        </motion.div>

        {/* ── Stats Grid ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={HiShieldCheck}
            label="Current Plan"
            value={(userData?.plan || "FREE").toUpperCase()}
            color="cyan"
            delay={0.1}
          />
          <StatCard
            icon={HiCalendar}
            label="License Expires"
            value={expired ? "EXPIRED" : days !== null ? `${days}d` : "—"}
            sub={formatDate(userData?.licenseExpiry)}
            color={expColor}
            delay={0.2}
          />
          <StatCard
            icon={HiDesktopComputer}
            label="Active Devices"
            value={`${userData?.activeDevices ?? 0}/${userData?.maxDevices ?? 1}`}
            color={devicePct >= 100 ? "red" : "cyan"}
            delay={0.3}
          />
          <StatCard
            icon={HiClock}
            label="Member Since"
            value={userData?.createdAt ? formatDate(userData.createdAt) : "—"}
            color="cyan"
            delay={0.4}
          />
        </div>

        {/* ── Device Usage Bar ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-5 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-orbitron text-white/80">DEVICE USAGE</span>
            <span className="text-xs font-mono text-cyan/60">
              {userData?.activeDevices ?? 0} / {userData?.maxDevices ?? 1} SLOTS USED
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(devicePct, 100)}%` }}
              transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            />
          </div>
          {devicePct >= 100 && (
            <p className="text-red-400 text-xs mt-2 font-mono">
              ⚠ Maximum device limit reached
            </p>
          )}
        </motion.div>

        {/* ── Two-Column: Logs + Quick Actions ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* System Logs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-orbitron text-sm font-semibold text-white">SYSTEM LOGS</h2>
              <span className="badge-cyan">LIVE</span>
            </div>
            <div className="scan-overlay">
              {logs.map((log, i) => (
                <LogEntry key={i} {...log} />
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card p-5">
              <h2 className="font-orbitron text-sm font-semibold text-white mb-4">QUICK ACTIONS</h2>
              <div className="flex flex-col gap-3">
                <QuickAction
                  to="/portal/store"
                  icon={HiShoppingBag}
                  title="MODE STORE"
                  desc="Browse and purchase premium packages"
                />
                <QuickAction
                  to="/portal/downloads"
                  icon={HiDownload}
                  title="SECURE DOWNLOADS"
                  desc="Access premium software files"
                />
              </div>
            </div>

            {/* License Warning */}
            {(expired || (days !== null && days <= 7 && days > 0)) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`glass-card p-5 border ${
                  expired ? "border-red-500/30" : "border-yellow-500/30"
                }`}
              >
                <div className={`flex items-start gap-3 ${expired ? "text-red-400" : "text-yellow-400"}`}>
                  <HiExclamationCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <div className="font-orbitron text-xs font-bold mb-1">
                      {expired ? "LICENSE EXPIRED" : "LICENSE EXPIRING SOON"}
                    </div>
                    <p className="text-xs text-white/50">
                      {expired
                        ? "Your license has expired. Visit the Mode Store to renew."
                        : `Your license expires in ${days} day${days !== 1 ? "s" : ""}. Renew now to avoid interruption.`}
                    </p>
                    <Link
                      to="/portal/store"
                      className="inline-block mt-3 text-xs font-orbitron text-cyan hover:underline tracking-widest"
                    >
                      RENEW NOW →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
