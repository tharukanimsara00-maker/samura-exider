// Developer: AKARSHANA
// src/pages/portal/SecureDownloadsPage.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { subscribeDownloads } from "../../firebase/firestore";
import { Link } from "react-router-dom";
import {
  HiDownload, HiRefresh, HiShieldCheck, HiLockClosed,
  HiClock, HiCode, HiChip, HiDocumentText, HiSearch,
} from "react-icons/hi";

/* ── Category icon map ──────────────────────────────────── */
const ICONS = {
  software: HiChip,
  tool:     HiCode,
  doc:      HiDocumentText,
  default:  HiDownload,
};

/* ── Download Card ──────────────────────────────────────── */
function DownloadCard({ item, isPremium, delay }) {
  const [downloading, setDownloading] = useState(false);
  const Icon = ICONS[item.category] || ICONS.default;

  const handleDownload = () => {
    if (!isPremium) return;
    setDownloading(true);
    setTimeout(() => {
      window.open(item.url, "_blank");
      setDownloading(false);
    }, 800);
  };

  const ts = item.updatedAt?.toDate?.() || new Date();
  const timeAgo = (() => {
    const diff = Date.now() - ts.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7)  return `${days} days ago`;
    return ts.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ delay }}
      className={`glass-card p-5 flex items-start gap-4 group transition-all duration-300
        ${!isPremium ? "opacity-60 cursor-not-allowed" : "hover:border-cyan/30"}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all
        ${isPremium
          ? "border-cyan/20 text-cyan/70 group-hover:border-cyan/50 group-hover:text-cyan group-hover:shadow-neon-sm"
          : "border-white/10 text-white/20"
        }`}
      >
        <Icon size={22} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-orbitron text-sm font-semibold text-white truncate">{item.name}</h3>
          {item.version && (
            <span className="badge-cyan shrink-0">{item.version}</span>
          )}
        </div>
        <p className="text-xs text-white/40 mb-3 leading-relaxed line-clamp-2">
          {item.description || "Premium software file"}
        </p>
        <div className="flex items-center gap-3 text-xs text-white/25 font-mono">
          <span className="flex items-center gap-1">
            <HiClock size={11} /> {timeAgo}
          </span>
          {item.size && <span>{item.size}</span>}
        </div>
      </div>

      {/* Download Button */}
      <div className="shrink-0">
        {isPremium ? (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-10 h-10 border border-cyan/30 rounded-lg flex items-center justify-center
                       text-cyan/60 hover:text-cyan hover:border-cyan hover:shadow-neon-sm
                       transition-all disabled:opacity-50"
          >
            {downloading
              ? <div className="w-4 h-4 border border-cyan border-t-transparent rounded-full animate-spin" />
              : <HiDownload size={16} />
            }
          </button>
        ) : (
          <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center text-white/20">
            <HiLockClosed size={16} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────── */
export default function SecureDownloadsPage() {
  const { isPremium } = useAuth();
  const [files,    setFiles]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const unsub = subscribeDownloads(true, (data) => {
      setFiles(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ["all", ...new Set(files.map((f) => f.category).filter(Boolean))];

  const filtered = files.filter((f) => {
    const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase()) ||
                        f.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "all" || f.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-dark pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-cyan rounded-full" />
            <span className="text-xs font-mono text-cyan/60 tracking-widest">SECURE VAULT</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="section-title text-2xl md:text-3xl text-white">
                PREMIUM <span className="neon-text">DOWNLOADS</span>
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {loading ? "Loading..." : `${files.length} file${files.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400/80 font-mono">LIVE SYNC</span>
            </div>
          </div>
        </motion.div>

        {/* Premium Lock Banner */}
        <AnimatePresence>
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-5 mb-6 border-yellow-400/20 bg-yellow-400/5 flex items-start gap-3"
            >
              <HiShieldCheck className="text-yellow-400 shrink-0 mt-0.5" size={20} />
              <div>
                <div className="font-orbitron text-sm font-bold text-yellow-400 mb-1">
                  PREMIUM ACCESS REQUIRED
                </div>
                <p className="text-xs text-white/50">
                  You need an active premium plan to download these files.
                  Files are listed for preview — upgrade to unlock all downloads.
                </p>
                <Link to="/portal/store" className="inline-block mt-2 text-xs font-orbitron text-cyan hover:underline tracking-widest">
                  VIEW PACKAGES →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cyber-input pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded text-xs font-orbitron tracking-widest transition-all ${
                  category === cat
                    ? "bg-cyan text-dark font-bold"
                    : "border border-white/10 text-white/40 hover:border-cyan/30 hover:text-cyan"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-cyan/60 text-xs tracking-widest">SYNCING VAULT...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <HiDownload className="text-white/10 mx-auto mb-4" size={48} />
            <p className="text-white/30 font-rajdhani">
              {search ? "No files match your search." : "No files available yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => (
              <DownloadCard
                key={item.id}
                item={item}
                isPremium={isPremium}
                delay={i * 0.05}
              />
            ))}
          </div>
        )}

        {/* Info footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-card p-4 flex items-center gap-3"
        >
          <HiRefresh className="text-cyan/40 shrink-0" size={16} />
          <p className="text-xs text-white/30">
            Downloads are synced in real-time from our secure database.
            New software updates appear here automatically — no page reload needed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
