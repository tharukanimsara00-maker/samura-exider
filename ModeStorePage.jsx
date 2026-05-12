// Developer: AKARSHANA
// src/pages/portal/ModeStorePage.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { subscribeAllPackages, createOrder, subscribeSiteContent } from "../../firebase/firestore";
import { useToast } from "../../context/ToastContext";
import {
  HiShoppingCart, HiCheck, HiX, HiStar,
  HiCreditCard, HiPhone, HiClipboardCopy,
  HiExclamation, HiTrash,
} from "react-icons/hi";
import { SiWhatsapp } from "react-icons/si";

/* ── ENV fallback constants (overridden by Firestore siteContent/store) ── */
const ENV_WA_NUM    = import.meta.env.VITE_WHATSAPP_NUMBER || "94XXXXXXXXX";
const ENV_BANK_NAME = import.meta.env.VITE_BANK_NAME       || "Commercial Bank";
const ENV_BANK_ACC  = import.meta.env.VITE_BANK_ACCOUNT    || "XXXX-XXXX-XXXX";
const ENV_BANK_HOLD = import.meta.env.VITE_BANK_HOLDER     || "Your Name";
const ENV_EZ_NUM    = import.meta.env.VITE_EZCASH_NUMBER   || "07XXXXXXXX";

/* ── Default packages (shown if Firestore fetch fails) ────── */
const DEFAULT_PACKAGES = [
  {
    id: "weekly",
    name: "WEEKLY PASS",
    duration: "1 Week",
    price: 500,
    features: ["1 Device slot", "All premium tools", "Basic support", "Software updates"],
    isPopular: false,
  },
  {
    id: "monthly",
    name: "MONTHLY PRO",
    duration: "1 Month",
    price: 1000,
    features: ["2 Device slots", "All premium tools", "Priority support", "Software updates", "Early access features"],
    isPopular: true,
  },
  {
    id: "bimonthly",
    name: "BI-MONTHLY",
    duration: "2 Months",
    price: 2000,
    features: ["2 Device slots", "All premium tools", "Priority support", "Software updates", "Early access features"],
    isPopular: false,
  },
  {
    id: "quarterly",
    name: "QUARTERLY PRO",
    duration: "3 Months",
    price: 3000,
    features: ["3 Device slots", "All premium tools", "Priority support", "Software updates", "Early access features"],
    isPopular: false,
  },
  {
    id: "halfyear",
    name: "HALF-YEAR ELITE",
    duration: "6 Months",
    price: 5000,
    features: ["3 Device slots", "All premium tools", "24/7 VIP support", "Software updates", "Early access features", "Beta program access"],
    isPopular: false,
  },
];

/* ── One-time services ──────────────────────────────────────── */
const ONE_TIME_SERVICES = [
  {
    id: "pc-optimize",
    name: "PC PAID OPTIMIZE",
    price: 1500,
    // BUG FIX: duration was missing — createOrder and waMessage used p.duration which
    // would be undefined, showing "(undefined)" in WhatsApp messages and blank in orders.
    duration: "One-time",
    description: "Full system performance tuning & optimization",
    features: ["Deep system cleanup", "Startup & service optimization", "FPS & latency boost", "One-time service – no subscription"],
  },
];

/* ── Package Card ───────────────────────────────────────── */
function PackageCard({ pkg, cart, onToggle }) {
  const inCart = cart.some((c) => c.id === pkg.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass-card p-6 flex flex-col transition-all duration-300
        ${inCart ? "border-cyan/50 shadow-neon" : "hover:border-cyan/20"}
        ${pkg.isPopular ? "lg:scale-105" : ""}
      `}
    >
      {/* Popular badge */}
      {pkg.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-cyan text-dark font-orbitron text-[10px] font-bold px-4 py-1 rounded-full
                           flex items-center gap-1 shadow-neon-sm whitespace-nowrap">
            <HiStar size={10} /> MOST POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="badge-cyan mb-3">{pkg.duration}</div>
        <h3 className="font-orbitron text-lg font-bold text-white">{pkg.name}</h3>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span className="font-orbitron text-4xl font-black text-cyan">
          Rs. {Number(pkg.price || 0).toLocaleString()}
        </span>
        <span className="text-white/40 text-sm ml-2">/ {pkg.duration}</span>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
            <HiCheck className="text-cyan/70 shrink-0" size={14} />
            {f}
          </li>
        ))}
      </ul>

      {/* Action */}
      <button
        onClick={() => onToggle(pkg)}
        className={`w-full py-3 font-orbitron text-xs tracking-widest transition-all duration-300 rounded
          ${inCart
            ? "bg-cyan/10 border border-cyan/40 text-cyan"
            : "btn-cyber-filled"
          }`}
        style={{ clipPath: "none" }}
      >
        {inCart ? (
          <span className="flex items-center justify-center gap-2">
            <HiCheck size={14} /> IN CART
          </span>
        ) : (
          "ADD TO CART"
        )}
      </button>
    </motion.div>
  );
}

/* ── Payment Modal ──────────────────────────────────────── */
// BUG FIX: paymentConfig prop added — WA_NUM/BANK_NAME etc. were previously
// referenced as free variables but they live inside ModeStorePage's scope,
// causing "not defined" errors at runtime. They are now passed explicitly.
// BUG FIX 2: orderAlreadyCreated + onOrderCreated prevent duplicate Firestore
// orders when the modal is closed and reopened with the same cart.
function CheckoutModal({ cart, total, onClose, userName, currentUser, paymentConfig, onOrderSaved, orderAlreadyCreated, onOrderCreated }) {
  const { WA_NUM, BANK_NAME, BANK_ACC, BANK_HOLD, EZ_NUM } = paymentConfig;
  useEffect(() => {
    if (currentUser && cart.length > 0 && !orderAlreadyCreated) {
      onOrderCreated(); // mark as created BEFORE the async call to block re-entry
      createOrder(currentUser.uid, userName, currentUser.email, cart, total)
        .then(() => { if (onOrderSaved) onOrderSaved(); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [copied, setCopied] = useState("");

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  };

  const itemsList = cart.map((p) => `• ${p.name} (${p.duration}) - Rs. ${p.price}`).join("
");
  const waMessage = encodeURIComponent(
    `🎮 *SAMURA XITER — PAYMENT CONFIRMATION*

` +
    `👤 Name: ${userName}

` +
    `📦 *Packages Ordered:*
${itemsList}

` +
    `💰 *Total: Rs. ${total.toLocaleString()}*

` +
    `I have completed the payment. Please activate my license. 🙏`
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="w-full max-w-lg glass-card relative overflow-hidden"
      >
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <HiCreditCard className="text-cyan" size={18} />
              PAYMENT DETAILS
            </h2>
            <p className="text-xs text-white/40 mt-0.5">Complete payment & confirm via WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
            aria-label="Close modal"
          >
            <HiX size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Warning notice */}
          <div className="flex items-start gap-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4">
            <HiExclamation className="text-yellow-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-white/60 leading-relaxed">
              We do <strong className="text-white">NOT</strong> use automatic payment gateways.
              Complete manual transfer, then message us on WhatsApp to activate your license.
            </p>
          </div>

          {/* Order Summary */}
          <div>
            <div className="text-xs font-orbitron text-white/50 mb-3 tracking-widest">ORDER SUMMARY</div>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <span className="text-sm text-white">{item.name}</span>
                    <span className="text-xs text-white/40 ml-2">({item.duration})</span>
                  </div>
                  <span className="font-mono text-cyan text-sm">Rs. {Number(item.price || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="font-orbitron text-sm text-white">TOTAL</span>
                <span className="font-orbitron text-xl font-bold text-cyan">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <div className="text-xs font-orbitron text-white/50 mb-3 tracking-widest">PAYMENT METHODS</div>

            {/* Bank Transfer */}
            <div className="glass-card p-4 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <HiCreditCard className="text-cyan" size={16} />
                <span className="font-orbitron text-xs text-white">BANK TRANSFER</span>
              </div>
              {[
                { label: "Bank",    val: BANK_NAME },
                { label: "Account", val: BANK_ACC  },
                { label: "Name",    val: BANK_HOLD },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/40">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">{val}</span>
                    <button
                      onClick={() => copyToClipboard(val, label)}
                      className="text-white/30 hover:text-cyan transition-colors"
                      aria-label={`Copy ${label}`}
                    >
                      {copied === label
                        ? <HiCheck size={13} className="text-green-400" />
                        : <HiClipboardCopy size={13} />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* EZ Cash */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiPhone className="text-cyan" size={16} />
                <span className="font-orbitron text-xs text-white">EZ CASH / mCASH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">{EZ_NUM}</span>
                  <button
                    onClick={() => copyToClipboard(EZ_NUM, "ezcash")}
                    className="text-white/30 hover:text-cyan transition-colors"
                    aria-label="Copy EZ Cash number"
                  >
                    {copied === "ezcash"
                      ? <HiCheck size={13} className="text-green-400" />
                      : <HiClipboardCopy size={13} />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Confirm Button */}
        <div className="px-6 pb-6">
          <a
            href={`https://wa.me/${WA_NUM}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg
                       bg-green-500 hover:bg-green-400 text-white font-orbitron text-sm
                       font-bold tracking-widest transition-all duration-200
                       hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]"
          >
            <SiWhatsapp size={20} />
            CONFIRM & MESSAGE WHATSAPP
          </a>
          <p className="text-center text-xs text-white/25 mt-3">
            After payment, send your receipt screenshot via WhatsApp for instant activation.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Service Card (one-time) ────────────────────────────── */
function ServiceCard({ svc, cart, onToggle }) {
  const inCart = cart.some((c) => c.id === svc.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300
        ${inCart ? "border-cyan/50 shadow-neon" : "hover:border-cyan/20"}
      `}
    >
      <div className="flex-1">
        <div className="badge-cyan mb-3">ONE-TIME SERVICE</div>
        <h3 className="font-orbitron text-lg font-bold text-white mb-1">{svc.name}</h3>
        <p className="text-sm text-white/40 mb-4">{svc.description}</p>
        <ul className="space-y-2">
          {svc.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
              <HiCheck className="text-cyan/70 shrink-0" size={14} />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
        <div>
          <span className="font-orbitron text-4xl font-black text-cyan">
            Rs. {Number(svc.price || 0).toLocaleString()}
          </span>
          <div className="text-white/40 text-xs mt-1 text-right">One-time</div>
        </div>
        <button
          onClick={() => onToggle(svc)}
          className={`px-8 py-3 font-orbitron text-xs tracking-widest transition-all duration-300 rounded
            ${inCart
              ? "bg-cyan/10 border border-cyan/40 text-cyan"
              : "btn-cyber-filled"
            }`}
          style={{ clipPath: "none" }}
        >
          {inCart ? (
            <span className="flex items-center justify-center gap-2">
              <HiCheck size={14} /> IN CART
            </span>
          ) : (
            "ADD TO CART"
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Store Page ────────────────────────────────────── */
export default function ModeStorePage() {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [packages,    setPackages]    = useState(DEFAULT_PACKAGES);
  const [cart,        setCart]        = useState([]);
  const [modal,       setModal]       = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [storeCfg,    setStoreCfg]    = useState({});
  // BUG FIX: Track whether an order was already created for the current cart.
  // Without this, re-opening the checkout modal creates a duplicate Firestore order.
  const orderCreatedRef = useRef(false);


  useEffect(() => {
    const unsub = subscribeAllPackages((all) => {
      const active = all.filter((p) => p.isActive !== false);
      if (active.length) setPackages(active);
      setLoading(false);
    });
    const unsubCfg = subscribeSiteContent("store", (data) => setStoreCfg(data || {}));
    return () => { unsub(); unsubCfg(); };
  }, []);

  // Payment details: Firestore values override ENV
  const WA_NUM    = storeCfg.whatsappNumber || ENV_WA_NUM;
  const BANK_NAME = storeCfg.bankName       || ENV_BANK_NAME;
  const BANK_ACC  = storeCfg.bankAccount    || ENV_BANK_ACC;
  const BANK_HOLD = storeCfg.bankHolder     || ENV_BANK_HOLD;
  const EZ_NUM    = storeCfg.ezCashNumber   || ENV_EZ_NUM;

  const toggleCart = (pkg) =>
    setCart((prev) => {
      const next = prev.some((c) => c.id === pkg.id)
        ? prev.filter((c) => c.id !== pkg.id)
        : [...prev, pkg];
      // BUG FIX: reset order-created flag so a fresh cart triggers a new order
      orderCreatedRef.current = false;
      return next;
    });

  const total    = cart.reduce((s, p) => s + (p.price || 0), 0);
  const userName = userData?.displayName || currentUser?.displayName || currentUser?.email || "Client";

  return (
    <div className="min-h-screen bg-dark pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-6 bg-cyan rounded-full" />
            <span className="text-xs font-mono text-cyan/60 tracking-widest">MODE STORE</span>
            <div className="w-1 h-6 bg-cyan rounded-full" />
          </div>
          <h1 className="section-title text-3xl md:text-4xl text-white mb-3">
            CHOOSE YOUR <span className="neon-text">PACKAGE</span>
          </h1>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Select a plan below. After checkout, complete manual payment and confirm via WhatsApp.
          </p>
        </motion.div>

        {/* Package Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Row 1 - first 3 plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {packages.slice(0, 3).map((pkg, i) => (
                <motion.div key={pkg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <PackageCard pkg={pkg} cart={cart} onToggle={toggleCart} />
                </motion.div>
              ))}
            </div>

            {/* Row 2 - remaining plans */}
            {packages.length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {packages.slice(3).map((pkg, i) => (
                  <motion.div key={pkg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (i + 3) * 0.1 }}>
                    <PackageCard pkg={pkg} cart={cart} onToggle={toggleCart} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-10 opacity-40">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
              <span className="font-orbitron text-[10px] tracking-[4px] text-cyan whitespace-nowrap">ONE-TIME SERVICE</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
            </div>

            {/* Services */}
            <div className="space-y-6 mb-12">
              {ONE_TIME_SERVICES.map((svc, i) => (
                <motion.div key={svc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <ServiceCard svc={svc} cart={cart} onToggle={toggleCart} />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Cart Bar */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-40"
            >
              <div className="glass-card px-5 py-4 flex items-center justify-between
                              border-cyan/30 shadow-neon">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan/10 border border-cyan/30 rounded-lg
                                  flex items-center justify-center text-cyan">
                    <HiShoppingCart size={18} />
                  </div>
                  <div>
                    <div className="font-orbitron text-sm font-bold text-white">
                      {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
                    </div>
                    <div className="text-xs text-white/40 font-mono">
                      Total: Rs. {total.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCart([])}
                    className="text-white/30 hover:text-red-400 transition-colors p-2"
                    title="Clear cart"
                    aria-label="Clear cart"
                  >
                    <HiTrash size={16} />
                  </button>
                  <button
                    onClick={() => setModal(true)}
                    className="btn-cyber-filled text-xs px-6 py-2.5"
                    style={{ clipPath: "none", borderRadius: "8px" }}
                  >
                    CHECKOUT
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Modal — AnimatePresence here so exit animation works correctly */}
        <AnimatePresence>
          {modal && (
            <CheckoutModal
              cart={cart}
              total={total}
              userName={userName}
              onClose={() => setModal(false)}
              currentUser={currentUser}
              paymentConfig={{ WA_NUM, BANK_NAME, BANK_ACC, BANK_HOLD, EZ_NUM }}
              orderAlreadyCreated={orderCreatedRef.current}
              onOrderCreated={() => { orderCreatedRef.current = true; }}
              onOrderSaved={() => {
                toast("✅ Order saved! Complete payment via WhatsApp.", "success", 5000);
                setCart([]);
                setModal(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
