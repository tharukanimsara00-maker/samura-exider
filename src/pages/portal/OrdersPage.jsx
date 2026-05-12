// Developer: AKARSHANA
// src/pages/portal/OrdersPage.jsx — User order history
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeUserOrders } from "../../firebase/firestore";
import {
  HiShoppingBag, HiClock, HiCheckCircle, HiXCircle,
  HiExclamationCircle, HiChevronDown, HiChevronUp,
  HiRefresh,
} from "react-icons/hi";
import { SiWhatsapp } from "react-icons/si";

// BUG FIX: was hardcoded to "94000000000". Now reads from env (same source as ModeStorePage).
const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER || "94XXXXXXXXX";

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CFG = {
  pending:   {
    Icon:   HiClock,
    color:  "text-yellow-400",
    border: "border-yellow-400/30",
    bg:     "bg-yellow-400/5",
    label:  "PENDING",
    note:   "⏳ Waiting for payment confirmation. Message us on WhatsApp after transfer.",
  },
  confirmed: {
    Icon:   HiCheckCircle,
    color:  "text-green-400",
    border: "border-green-400/30",
    bg:     "bg-green-400/5",
    label:  "CONFIRMED",
    note:   "✅ Payment confirmed — your license has been activated.",
  },
  rejected:  {
    Icon:   HiXCircle,
    color:  "text-red-400",
    border: "border-red-400/30",
    bg:     "bg-red-400/5",
    label:  "REJECTED",
    note:   "❌ Order rejected. Contact support for assistance.",
  },
};

/* ── Order Card ──────────────────────────────────────────── */
function OrderCard({ order, delay }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[order.status] || {
    Icon: HiExclamationCircle,
    color: "text-white/40", border: "border-white/10", bg: "",
    label: "UNKNOWN", note: "",
  };
  const { Icon } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card border ${cfg.border} overflow-hidden`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded-lg border ${cfg.border} ${cfg.bg}
                           flex items-center justify-center ${cfg.color} shrink-0`}>
            <Icon size={16} />
          </div>
          <div>
            <div className="font-orbitron text-xs text-white">
              ORDER #{order.id.slice(-6).toUpperCase()}
            </div>
            <div className="text-xs text-white/35 font-mono mt-0.5">
              {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className={`font-orbitron text-[10px] font-bold tracking-widest ${cfg.color}`}>
              {cfg.label}
            </div>
            <div className="font-mono text-sm text-cyan mt-0.5">
              Rs. {(order.total || 0).toLocaleString()}
            </div>
          </div>
          {expanded
            ? <HiChevronUp className="text-white/30" size={16} />
            : <HiChevronDown className="text-white/30" size={16} />
          }
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 py-4 space-y-3">

              {/* Items */}
              <div>
                <div className="text-[10px] font-orbitron text-white/30 tracking-widest mb-2">
                  ITEMS ORDERED
                </div>
                <div className="space-y-2">
                  {(order.items || []).map((item, i) => (
                    <div key={item.id || item.name || i}
                      className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="text-sm text-white font-rajdhani">{item.name}</span>
                        {item.duration && (
                          <span className="text-xs text-white/40 ml-2">({item.duration})</span>
                        )}
                      </div>
                      <span className="font-mono text-cyan text-sm">
                        Rs. {(item.price || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status note */}
              {cfg.note && (
                <p className={`text-xs ${cfg.color} opacity-80 font-rajdhani`}>
                  {cfg.note}
                </p>
              )}

              {/* WhatsApp CTA for pending */}
              {order.status === "pending" && (
                <a
                  href={`https://wa.me/${WA_NUM}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-orbitron text-green-400 hover:text-green-300 transition-colors tracking-widest"
                >
                  <SiWhatsapp size={14} />
                  CONFIRM PAYMENT ON WHATSAPP
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Status Badge Legend ──────────────────────────────────── */
function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs font-orbitron tracking-widest">
      {Object.entries(STATUS_CFG).map(([key, { color, label }]) => (
        <span key={key} className={`flex items-center gap-1.5 ${color} opacity-70`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserOrders(currentUser.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const pending   = orders.filter((o) => o.status === "pending").length;
  const confirmed = orders.filter((o) => o.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-dark pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-cyan rounded-full" />
            <span className="text-xs font-mono text-cyan/60 tracking-widest">
              ORDER HISTORY
            </span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white">
                MY <span className="neon-text">ORDERS</span>
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {loading ? "Loading..." : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400/80 font-mono">LIVE SYNC</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: "TOTAL",     value: orders.length,   color: "text-white"       },
              { label: "PENDING",   value: pending,         color: "text-yellow-400"  },
              { label: "CONFIRMED", value: confirmed,       color: "text-green-400"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className={`font-orbitron text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-white/30 tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Legend */}
        {!loading && orders.length > 0 && (
          <div className="mb-5">
            <Legend />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-cyan/60 text-xs tracking-widest">LOADING ORDERS...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <HiShoppingBag className="text-white/10 mx-auto mb-4" size={48} />
            <p className="text-white/30 font-rajdhani mb-2">No orders yet.</p>
            <p className="text-white/20 text-xs mb-6">
              Visit the store and choose a package to get started.
            </p>
            <Link
              to="/portal/store"
              className="btn-cyber text-xs px-6 py-2.5"
            >
              VISIT STORE
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <OrderCard key={order.id} order={order} delay={i * 0.05} />
            ))}
          </div>
        )}

        {/* Footer info */}
        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass-card p-4 flex items-center gap-3"
          >
            <HiRefresh className="text-cyan/40 shrink-0" size={16} />
            <p className="text-xs text-white/30">
              Order status updates in real-time. Contact support on WhatsApp for any issues.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
