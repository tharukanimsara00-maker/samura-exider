// Developer: AKARSHANA
// src/pages/admin/AdminPage.jsx — FULL ADMIN PANEL
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeAllPackages, subscribeDownloads,
  subscribeUsers, subscribeAdminStats, subscribeOrders,
  subscribeAllAnnouncements, subscribeSiteContent,
} from "../../firebase/firestore";
import {
  addPackage, updatePackage, deletePackage,
  addDownload, updateDownload, deleteDownload,
  updateUser, updateOrderStatus, deleteOrder,
  addAnnouncement, updateAnnouncement, deleteAnnouncement,
  updateSiteContent,
} from "../../firebase/admin";
import {
  HiShieldCheck, HiCube, HiDownload, HiPlus,
  HiPencil, HiTrash, HiX, HiCheck, HiStar,
  HiUsers, HiChartBar, HiBadgeCheck,
  HiShoppingBag, HiCheckCircle, HiXCircle,
  HiRefresh, HiSpeakerphone, HiHome, HiInformationCircle,
  HiPhone, HiDocumentText, HiViewGrid, HiColorSwatch,
  HiSave,
} from "react-icons/hi";

// ─── Spinner ───────────────────────────────────────────────────
const Spinner = ({ size = 8 }) => (
  <div className={`w-${size} h-${size} border-2 border-cyan border-t-transparent rounded-full animate-spin`} />
);

// ─── Reusable Modal ────────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-[#0d0d0d] border border-cyan/20 rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} p-6 shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-orbitron text-cyan text-sm tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <HiX size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────
function Field({ label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 font-mono tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-white/25 font-mono">{hint}</span>}
      </div>
      {props.as === "textarea" ? (
        <textarea
          {...props}
          as={undefined}
          rows={props.rows || 3}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:border-cyan/50 resize-none font-rajdhani"
        />
      ) : (
        <input
          {...props}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:border-cyan/50 font-rajdhani"
        />
      )}
    </div>
  );
}

// ─── Select Field ──────────────────────────────────────────────
function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/50 font-mono tracking-wider">{label}</label>
      <select value={value} onChange={onChange}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan/50">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "cyan", badge }) {
  const colors = {
    cyan:   "text-cyan border-cyan/20 bg-cyan/5",
    green:  "text-green-400 border-green-400/20 bg-green-400/5",
    yellow: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
    purple: "text-purple-400 border-purple-400/20 bg-purple-400/5",
    orange: "text-orange-400 border-orange-400/20 bg-orange-400/5",
  };
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4 relative">
      {badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="font-orbitron text-2xl font-bold text-white">{value ?? "—"}</div>
      <div className="text-xs text-white/40 mt-1 font-rajdhani">{label}</div>
    </div>
  );
}

// ─── Section Block ─────────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div className="bg-white/2 border border-white/8 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono text-white/30 tracking-widest">{title}</p>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Save Bar ──────────────────────────────────────────────────
function SaveBar({ onSave, saving, error, success, label = "SAVE CHANGES" }) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-white/8">
      {error && <p className="text-red-400 text-xs font-mono flex-1">{error}</p>}
      {success && <p className="text-green-400 text-xs font-mono flex-1">✓ Saved successfully</p>}
      {!error && !success && <div className="flex-1" />}
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-2 bg-cyan/20 border border-cyan/40 text-cyan text-sm font-mono rounded-lg hover:bg-cyan/30 transition-all disabled:opacity-40">
        {saving ? <Spinner size={4} /> : <><HiSave size={14} /> {label}</>}
      </button>
    </div>
  );
}

// ─── Modal Actions ─────────────────────────────────────────────
function ModalActions({ onCancel, onSave, saving, disabled }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-white/10 text-white/40 text-sm hover:text-white transition-colors">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving || disabled}
        className="flex-1 py-2 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan text-sm hover:bg-cyan/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
        {saving ? <Spinner size={4} /> : <><HiCheck size={15} /> SAVE</>}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════
function OverviewTab({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { const u = subscribeAdminStats(setStats); return () => u(); }, []);

  return (
    <div>
      <p className="text-white/40 text-sm mb-6">Real-time system overview</p>
      {!stats ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Users"     value={stats.users}        icon={HiUsers}      color="cyan"   />
          <StatCard label="Premium Users"   value={stats.premiumUsers} icon={HiBadgeCheck} color="green"  />
          <StatCard label="Total Packages"  value={stats.packages}     icon={HiCube}       color="yellow" />
          <StatCard label="Total Downloads" value={stats.downloads}    icon={HiDownload}   color="purple" />
          <StatCard label="Pending Orders"  value={stats.pendingOrders} icon={HiShoppingBag} color="orange" badge={stats.pendingOrders} />
        </div>
      )}
      {stats?.pendingOrders > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-3 bg-orange-400/5 border border-orange-400/20 rounded-xl p-4 cursor-pointer hover:bg-orange-400/10 transition-all"
          onClick={() => setActiveTab("orders")}>
          <HiShoppingBag className="text-orange-400 shrink-0" size={18} />
          <p className="text-sm text-white/70">
            <span className="text-orange-400 font-orbitron">{stats.pendingOrders}</span> order{stats.pendingOrders !== 1 ? "s" : ""} waiting for confirmation →
          </p>
        </motion.div>
      )}
      <div className="mt-6 bg-white/3 border border-white/8 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> All counts sync in real-time from Firestore
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PACKAGES TAB
// ═══════════════════════════════════════════════════════════
function PackagesTab() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const emptyForm = { name: "", description: "", price: "", duration: "", features: "", isPopular: false, isActive: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { const u = subscribeAllPackages((d) => { setPackages(d); setLoading(false); }); return () => u(); }, []);

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setSaveError(""); setModal("form"); };
  const openEdit = (pkg) => {
    setForm({ name: pkg.name || "", description: pkg.description || "", price: pkg.price ?? "", duration: pkg.duration || "", features: (pkg.features || []).join("\n"), isPopular: pkg.isPopular || false, isActive: pkg.isActive ?? true });
    setEditing(pkg); setSaveError(""); setModal("form");
  };
  const handleSave = async () => {
    if (!form.name || form.price === "") return;
    setSaving(true); setSaveError("");
    try {
      const payload = { ...form, features: form.features.split("\n").map(f => f.trim()).filter(Boolean) };
      if (editing) await updatePackage(editing.id, payload); else await addPackage(payload);
      setModal(null);
    } catch (err) { setSaveError(err?.message || "Failed to save."); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this package permanently?")) return;
    try { await deletePackage(id); } catch (err) { alert("Delete failed: " + err?.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/40 text-sm">{packages.length} package{packages.length !== 1 ? "s" : ""} <span className="text-xs text-white/20">(incl. hidden)</span></p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 px-4 py-2 rounded-lg text-sm font-mono transition-all"><HiPlus size={16} /> ADD PACKAGE</button>
      </div>
      <div className="space-y-3">
        {packages.map(pkg => (
          <motion.div key={pkg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {pkg.isPopular && <HiStar className="text-yellow-400 shrink-0" size={16} />}
              <div className="min-w-0">
                <div className="font-orbitron text-sm text-white">{pkg.name}</div>
                <div className="text-xs text-white/40 mt-0.5">Rs. {Number(pkg.price || 0).toLocaleString()} · {pkg.duration}{!pkg.isActive && <span className="ml-2 text-red-400 font-mono">[Hidden]</span>}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(pkg)} className="p-2 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={15} /></button>
              <button onClick={() => handleDelete(pkg.id)} className="p-2 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={15} /></button>
            </div>
          </motion.div>
        ))}
        {packages.length === 0 && <div className="text-center py-16 text-white/20 font-rajdhani">No packages yet. Add one above.</div>}
      </div>
      <AnimatePresence>
        {modal === "form" && (
          <Modal title={editing ? "EDIT PACKAGE" : "ADD PACKAGE"} onClose={() => setModal(null)}>
            <div className="space-y-3">
              <Field label="Package Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Monthly" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (Rs.) *" type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 1500" />
                <Field label="Duration" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 1 Month" />
              </div>
              <Field label="Description" as="textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description..." />
              <Field label="Features (one per line)" as="textarea" value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} placeholder={"Unlimited downloads\nPriority support\nAll modes"} />
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={form.isPopular} onChange={e => setForm(p => ({ ...p, isPopular: e.target.checked }))} className="accent-cyan" />Mark as Popular</label>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-cyan" />Visible to users</label>
              </div>
              <ModalActions onCancel={() => setModal(null)} onSave={handleSave} saving={saving} disabled={!form.name || form.price === ""} />
              {saveError && <p className="text-red-400 text-xs text-center font-mono">{saveError}</p>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DOWNLOADS TAB
// ═══════════════════════════════════════════════════════════
function DownloadsTab() {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");
  const [tab, setTab]         = useState("free");
  const emptyForm = { name: "", description: "", version: "", url: "", size: "", category: "software", isPremium: false, isActive: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const isPremium = tab === "premium";
    setLoading(true); setFiles([]);
    const u = subscribeDownloads(isPremium, (d) => { setFiles(d); setLoading(false); }, false);
    return () => u();
  }, [tab]);

  const openAdd = () => { setForm({ ...emptyForm, isPremium: tab === "premium" }); setEditing(null); setSaveError(""); setModal("form"); };
  const openEdit = (file) => {
    setForm({ name: file.name || "", description: file.description || "", version: file.version || "", url: file.url || "", size: file.size || "", category: file.category || "software", isPremium: file.isPremium ?? false, isActive: file.isActive ?? true });
    setEditing(file); setSaveError(""); setModal("form");
  };
  const handleSave = async () => {
    if (!form.name || !form.url) return;
    setSaving(true); setSaveError("");
    try {
      if (editing) await updateDownload(editing.id, form); else await addDownload(form);
      setModal(null);
    } catch (err) { setSaveError(err?.message || "Failed to save."); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this file permanently?")) return;
    try { await deleteDownload(id); } catch (err) { alert("Delete failed: " + err?.message); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["free", "premium"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-widest transition-all ${tab === t ? "bg-cyan/20 border border-cyan/40 text-cyan" : "border border-white/10 text-white/30 hover:text-white/60"}`}>{t.toUpperCase()} FILES</button>
        ))}
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 px-4 py-1.5 rounded-lg text-sm font-mono transition-all"><HiPlus size={15} /> ADD FILE</button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="space-y-3">
          {files.map(file => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-orbitron text-sm text-white">{file.name}</div>
                <div className="text-xs text-white/40 mt-0.5 flex items-center gap-3">
                  <span>{file.category}</span>{file.version && <span>v{file.version}</span>}{!file.isActive && <span className="text-red-400 font-mono">[Hidden]</span>}
                </div>
                <div className="text-xs text-white/20 mt-0.5 truncate font-mono">{file.url}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(file)} className="p-2 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={15} /></button>
                <button onClick={() => handleDelete(file.id)} className="p-2 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={15} /></button>
              </div>
            </motion.div>
          ))}
          {files.length === 0 && <div className="text-center py-16 text-white/20 font-rajdhani">No files yet. Add one above.</div>}
        </div>
      )}
      <AnimatePresence>
        {modal === "form" && (
          <Modal title={editing ? "EDIT FILE" : "ADD FILE"} onClose={() => setModal(null)}>
            <div className="space-y-3">
              <Field label="File Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Samura Mode v2.1" />
              <Field label="Download URL *" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://drive.google.com/..." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Version" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} placeholder="e.g. 2.1.0" />
                {/* BUG FIX: size field was missing — portal showed blank file size */}
                <Field label="File Size" value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} placeholder="e.g. 24 MB" />
              </div>
              <SelectField label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  options={[{ value: "software", label: "Software" }, { value: "tool", label: "Tool" }, { value: "doc", label: "Document" }, { value: "game", label: "Game" }, { value: "mod", label: "Mod" }]} />
              <Field label="Description" as="textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description..." />
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={form.isPremium} onChange={e => setForm(p => ({ ...p, isPremium: e.target.checked }))} className="accent-cyan" />Premium only</label>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-cyan" />Visible to users</label>
              </div>
              <ModalActions onCancel={() => setModal(null)} onSave={handleSave} saving={saving} disabled={!form.name || !form.url} />
              {saveError && <p className="text-red-400 text-xs text-center font-mono">{saveError}</p>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════
function OrdersTab() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("pending");
  const [saving, setSaving]   = useState({});

  useEffect(() => {
    setLoading(true); setOrders([]);
    const u = subscribeOrders((d) => { setOrders(d); setLoading(false); }, filter === "all" ? null : filter);
    return () => u();
  }, [filter]);

  const formatDate = (ts) => {
    if (!ts) return "—";
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
  };
  const handleStatus = async (orderId, status) => {
    setSaving(p => ({ ...p, [orderId]: true }));
    try { await updateOrderStatus(orderId, status); } catch (err) { alert("Failed: " + err?.message); } finally { setSaving(p => ({ ...p, [orderId]: false })); }
  };
  const handleDelete = async (orderId) => {
    if (!confirm("Delete this order permanently?")) return;
    try { await deleteOrder(orderId); } catch (err) { alert("Failed: " + err?.message); }
  };
  const statusBadge = (status) => {
    if (status === "confirmed") return "bg-green-400/10 text-green-400 border-green-400/30";
    if (status === "rejected")  return "bg-red-400/10 text-red-400 border-red-400/30";
    return "bg-orange-400/10 text-orange-400 border-orange-400/30";
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "confirmed", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-widest transition-all ${filter === f ? "bg-cyan/20 border border-cyan/40 text-cyan" : "border border-white/10 text-white/30 hover:text-white/60"}`}>{f.toUpperCase()}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="space-y-4">
          {orders.map(order => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-orbitron text-sm text-white">{order.displayName || "—"}</div>
                  <div className="text-xs text-white/40 mt-0.5">{order.email}</div>
                  <div className="text-xs text-white/20 font-mono mt-0.5">{formatDate(order.createdAt)}</div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge(order.status)}`}>{(order.status || "pending").toUpperCase()}</span>
              </div>
              <div className="space-y-1 mb-3">
                {(order.items || []).map((item, i) => (
                  <div key={item.id || item.name || i} className="flex justify-between text-xs">
                    <span className="text-white/60">{item.name} <span className="text-white/30">({item.duration})</span></span>
                    <span className="text-cyan font-mono">Rs. {Number(item.price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="font-orbitron text-sm text-white">Total: <span className="text-cyan">Rs. {Number(order.total || 0).toLocaleString()}</span></div>
                <div className="flex items-center gap-2">
                  {order.status === "pending" && (
                    <>
                      <button onClick={() => handleStatus(order.id, "confirmed")} disabled={saving[order.id]} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-400/10 border border-green-400/30 text-green-400 text-xs rounded-lg hover:bg-green-400/20 transition-all disabled:opacity-40"><HiCheckCircle size={13} /> CONFIRM</button>
                      <button onClick={() => handleStatus(order.id, "rejected")} disabled={saving[order.id]} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 border border-red-400/30 text-red-400 text-xs rounded-lg hover:bg-red-400/20 transition-all disabled:opacity-40"><HiXCircle size={13} /> REJECT</button>
                    </>
                  )}
                  {order.status !== "pending" && (
                    <button onClick={() => handleStatus(order.id, "pending")} disabled={saving[order.id]} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/40 text-xs rounded-lg hover:text-white/70 transition-all disabled:opacity-40"><HiRefresh size={13} /> RESET</button>
                  )}
                  <button onClick={() => handleDelete(order.id)} className="p-1.5 text-white/30 hover:text-red-400 border border-white/8 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={13} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {orders.length === 0 && <div className="text-center py-16 text-white/20 font-rajdhani">No {filter === "all" ? "" : filter} orders.</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════════════════════════
function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { const u = subscribeUsers((d) => { setUsers(d); setLoading(false); }); return () => u(); }, []);

  const openEdit = (user) => {
    let expiryStr = "";
    if (user.licenseExpiry) {
      try { const d = user.licenseExpiry.toDate ? user.licenseExpiry.toDate() : new Date(user.licenseExpiry); if (!isNaN(d.getTime())) expiryStr = d.toISOString().split("T")[0]; } catch { }
    }
    setForm({ plan: user.plan || "free", maxDevices: user.maxDevices ?? 1, licenseExpiry: expiryStr, role: user.role || "" });
    setEditUser(user); setSaveError("");
  };
  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true); setSaveError("");
    try { await updateUser(editUser.id, { plan: form.plan, maxDevices: Number(form.maxDevices) || 1, licenseExpiry: form.licenseExpiry || "", role: form.role || "" }); setEditUser(null); }
    catch (err) { setSaveError(err?.message || "Failed to save."); } finally { setSaving(false); }
  };
  const formatDate = (ts) => {
    if (!ts) return "—";
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); } catch { return "—"; }
  };
  const isPremiumActive = (user) => {
    if (!user.plan || user.plan === "free") return false;
    try { if (user.licenseExpiry) { const exp = user.licenseExpiry.toDate ? user.licenseExpiry.toDate() : new Date(user.licenseExpiry); if (isNaN(exp.getTime()) || exp < new Date()) return false; } } catch { return false; }
    return true;
  };
  const filtered = users.filter(u => (u.displayName || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-sm">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2 text-xs text-white/20 font-mono"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</div>
      </div>
      <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan/50 font-rajdhani mb-4" />
      <div className="space-y-2">
        {filtered.map(user => {
          const premium = isPremiumActive(user);
          return (
            <motion.div key={user.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-orbitron text-sm text-white truncate">{user.displayName || "—"}</span>
                  {user.role === "admin" && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan/15 text-cyan border border-cyan/30">ADMIN</span>}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${premium ? "bg-green-400/10 text-green-400 border-green-400/30" : "bg-white/5 text-white/30 border-white/10"}`}>{(user.plan || "free").toUpperCase()}</span>
                </div>
                <div className="text-xs text-white/30 mt-0.5 truncate">{user.email}</div>
                <div className="text-xs text-white/20 mt-0.5 font-mono">Joined: {formatDate(user.createdAt)}{user.licenseExpiry && <span className="ml-3">Expires: {formatDate(user.licenseExpiry)}</span>}</div>
              </div>
              <button onClick={() => openEdit(user)} className="shrink-0 p-2 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={15} /></button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-16 text-white/20 font-rajdhani">{search ? "No users match your search." : "No users yet."}</div>}
      </div>
      <AnimatePresence>
        {editUser && (
          <Modal title="EDIT USER" onClose={() => setEditUser(null)}>
            <div className="mb-4 p-3 bg-white/3 rounded-lg border border-white/8">
              <div className="font-orbitron text-sm text-white">{editUser.displayName || "—"}</div>
              <div className="text-xs text-white/40 mt-0.5">{editUser.email}</div>
            </div>
            <div className="space-y-3">
              <SelectField label="Plan" value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                options={[{ value: "free", label: "Free" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "bimonthly", label: "Bi-Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "halfyear", label: "Half-Year" }, { value: "lifetime", label: "Lifetime" }]} />
              <Field label="License Expiry Date (blank = no expiry)" type="date" value={form.licenseExpiry} onChange={e => setForm(p => ({ ...p, licenseExpiry: e.target.value }))} />
              <Field label="Max Devices Allowed" type="number" min="1" max="10" value={form.maxDevices} onChange={e => setForm(p => ({ ...p, maxDevices: e.target.value }))} />
              <SelectField label="Role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                options={[{ value: "", label: "User (default)" }, { value: "admin", label: "Admin" }]} />
              <ModalActions onCancel={() => setEditUser(null)} onSave={handleSave} saving={saving} disabled={false} />
              {saveError && <p className="text-red-400 text-xs text-center font-mono">{saveError}</p>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS TAB
// ═══════════════════════════════════════════════════════════
function AnnouncementsTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const emptyForm = { title: "", message: "", type: "info", link: "", linkLabel: "", isActive: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { const u = subscribeAllAnnouncements((d) => { setItems(d); setLoading(false); }); return () => u(); }, []);

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setSaveError(""); setModal("form"); };
  const openEdit = (item) => {
    setForm({ title: item.title || "", message: item.message || "", type: item.type || "info", link: item.link || "", linkLabel: item.linkLabel || "", isActive: item.isActive ?? true });
    setEditing(item); setSaveError(""); setModal("form");
  };
  const handleSave = async () => {
    if (!form.title || !form.message) return;
    setSaving(true); setSaveError("");
    try {
      if (editing) await updateAnnouncement(editing.id, form); else await addAnnouncement(form);
      setModal(null);
    } catch (err) { setSaveError(err?.message || "Failed to save."); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try { await deleteAnnouncement(id); } catch (err) { alert("Delete failed: " + err?.message); }
  };
  const typeColors = { info: "text-cyan border-cyan/30 bg-cyan/10", warning: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", success: "text-green-400 border-green-400/30 bg-green-400/10", danger: "text-red-400 border-red-400/30 bg-red-400/10" };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/40 text-sm">{items.length} announcement{items.length !== 1 ? "s" : ""} <span className="text-xs text-white/20">— shown on Dashboard & pages</span></p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 px-4 py-2 rounded-lg text-sm font-mono transition-all"><HiPlus size={16} /> ADD ANNOUNCEMENT</button>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 mt-0.5 ${typeColors[item.type] || typeColors.info}`}>{(item.type || "info").toUpperCase()}</span>
              <div className="min-w-0">
                <div className="font-orbitron text-sm text-white">{item.title}</div>
                <div className="text-xs text-white/40 mt-0.5 line-clamp-2">{item.message}</div>
                {!item.isActive && <span className="text-[10px] text-red-400 font-mono mt-1 block">[Hidden]</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(item)} className="p-2 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={15} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={15} /></button>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && <div className="text-center py-16 text-white/20 font-rajdhani">No announcements yet. Add one above.</div>}
      </div>
      <AnimatePresence>
        {modal === "form" && (
          <Modal title={editing ? "EDIT ANNOUNCEMENT" : "ADD ANNOUNCEMENT"} onClose={() => setModal(null)}>
            <div className="space-y-3">
              <Field label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. New update available" />
              <Field label="Message *" as="textarea" rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Announcement body text..." />
              <SelectField label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                options={[{ value: "info", label: "ℹ Info (cyan)" }, { value: "warning", label: "⚠ Warning (yellow)" }, { value: "success", label: "✓ Success (green)" }, { value: "danger", label: "✕ Danger (red)" }]} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Link URL (optional)" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                <Field label="Link Label" value={form.linkLabel} onChange={e => setForm(p => ({ ...p, linkLabel: e.target.value }))} placeholder="Read more" />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-cyan" />Visible to users</label>
              <ModalActions onCancel={() => setModal(null)} onSave={handleSave} saving={saving} disabled={!form.title || !form.message} />
              {saveError && <p className="text-red-400 text-xs text-center font-mono">{saveError}</p>}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGES TAB
// ═══════════════════════════════════════════════════════════
function PagesTab() {
  const [activePage, setActivePage] = useState("home");
  const pages = [
    { id: "home",      label: "HOME",      icon: HiHome },
    { id: "about",     label: "ABOUT",     icon: HiInformationCircle },
    { id: "contact",   label: "CONTACT",   icon: HiPhone },
    { id: "dashboard", label: "DASHBOARD", icon: HiViewGrid },
    { id: "store",     label: "STORE",     icon: HiColorSwatch },
  ];
  return (
    <div>
      <p className="text-white/40 text-sm mb-5">Edit page content — saved to Firestore, read by each page component</p>
      <div className="flex gap-2 mb-6 flex-wrap">
        {pages.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActivePage(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono tracking-widest transition-all ${activePage === id ? "bg-cyan/15 border border-cyan/40 text-cyan" : "border border-white/10 text-white/30 hover:text-white/60"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activePage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {activePage === "home"      && <HomePageEditor />}
          {activePage === "about"     && <AboutPageEditor />}
          {activePage === "contact"   && <ContactPageEditor />}
          {activePage === "dashboard" && <DashboardPageEditor />}
          {activePage === "store"     && <StorePageEditor />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Home Page Editor ──────────────────────────────────────────
function HomePageEditor() {
  const [c, setC] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [ok, setOk]         = useState(false);
  const f = (k) => c?.[k] ?? "";
  const s = (k) => (e) => setC(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = subscribeSiteContent("home", (data) => setC(data || {
      heroTitle: "SAMURA", heroSubtitle: "XITER", heroTagline: "Premium Gaming & Software Portal",
      heroBadge: "v2.5 ONLINE", ctaText: "⚡ ENTER CLIENT AREA",
      stat1Val: "500+", stat1Label: "ACTIVE CLIENTS", stat2Val: "99.9%", stat2Label: "UPTIME", stat3Val: "24/7", stat3Label: "SUPPORT",
      feature1Title: "SECURE PLATFORM", feature1Desc: "Military-grade encryption with Firebase security rules protecting every session and download.",
      feature2Title: "INSTANT ACCESS",  feature2Desc: "License activated immediately after manual payment confirmation via WhatsApp.",
      feature3Title: "AUTO UPDATES",    feature3Desc: "All premium software updates pushed directly to your portal — no manual downloads needed.",
      feature4Title: "PREMIUM SUPPORT", feature4Desc: "Direct WhatsApp support line with 24h response guarantee for all premium clients.",
      sectionBadge: "CAPABILITIES", sectionTitle: "WHY CHOOSE XITER",
      sectionDesc: "Professional gaming tools and software delivered through a secure, modern client portal.",
      ctaBannerTitle: "READY TO LEVEL UP?", ctaBannerDesc: "Join hundreds of clients with access to premium tools, instant updates, and priority support.",
    }));
    return () => u();
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setOk(false);
    try { await updateSiteContent("home", c); setOk(true); setTimeout(() => setOk(false), 3000); }
    catch (e) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  if (!c) return <div className="flex justify-center py-12"><Spinner /></div>;
  return (
    <div className="space-y-5">
      <Section title="HERO SECTION">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hero Title (brand 1)" value={f("heroTitle")} onChange={s("heroTitle")} placeholder="SAMURA" />
          <Field label="Hero Subtitle (neon glow)" value={f("heroSubtitle")} onChange={s("heroSubtitle")} placeholder="XITER" />
        </div>
        <Field label="Tagline Text" value={f("heroTagline")} onChange={s("heroTagline")} placeholder="Premium Gaming & Software Portal" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status Badge" value={f("heroBadge")} onChange={s("heroBadge")} placeholder="v2.5 ONLINE" />
          <Field label="CTA Button Text" value={f("ctaText")} onChange={s("ctaText")} placeholder="⚡ ENTER CLIENT AREA" />
        </div>
      </Section>
      <Section title="HERO STATS ROW">
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(n => (
            <div key={n} className="space-y-2">
              <Field label={`Stat ${n} Value`} value={f(`stat${n}Val`)} onChange={s(`stat${n}Val`)} placeholder="500+" />
              <Field label={`Stat ${n} Label`} value={f(`stat${n}Label`)} onChange={s(`stat${n}Label`)} placeholder="ACTIVE CLIENTS" />
            </div>
          ))}
        </div>
      </Section>
      <Section title="FEATURE CARDS (4 cards)">
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(n => (
            <div key={n} className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-mono text-white/30">CARD {n}</p>
              <Field label="Title" value={f(`feature${n}Title`)} onChange={s(`feature${n}Title`)} placeholder={`Feature ${n}`} />
              <Field label="Description" as="textarea" rows={2} value={f(`feature${n}Desc`)} onChange={s(`feature${n}Desc`)} placeholder="Description..." />
            </div>
          ))}
        </div>
      </Section>
      <Section title="CAPABILITIES SECTION HEADER">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Badge Label" value={f("sectionBadge")} onChange={s("sectionBadge")} placeholder="CAPABILITIES" />
          <Field label="Section Title" value={f("sectionTitle")} onChange={s("sectionTitle")} placeholder="WHY CHOOSE XITER" />
        </div>
        <Field label="Section Description" as="textarea" rows={2} value={f("sectionDesc")} onChange={s("sectionDesc")} placeholder="Description..." />
      </Section>
      <Section title="BOTTOM CTA BANNER">
        <Field label="Banner Title" value={f("ctaBannerTitle")} onChange={s("ctaBannerTitle")} placeholder="READY TO LEVEL UP?" />
        <Field label="Banner Description" as="textarea" rows={2} value={f("ctaBannerDesc")} onChange={s("ctaBannerDesc")} placeholder="Join hundreds of clients..." />
      </Section>
      <SaveBar onSave={save} saving={saving} error={error} success={ok} />
    </div>
  );
}

// ── About Page Editor ─────────────────────────────────────────
function AboutPageEditor() {
  const [c, setC]             = useState(null);
  const [services, setServices] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [ok, setOk]           = useState(false);
  const [svcModal, setSvcModal] = useState(false);
  const [editIdx, setEditIdx]   = useState(null);
  const [svcForm, setSvcForm]   = useState({ title: "", desc: "" });
  const f = (k) => c?.[k] ?? "";
  const sc = (k) => (e) => setC(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = subscribeSiteContent("about", (data) => {
      setC(data || { pageTitle: "OUR SERVICES", pageDesc: "Samura Xiter delivers premium gaming tools and software solutions through a secure, modern client portal.", quote: '"Built for operators who demand precision and reliability."', quoteAuthor: "— Samura Xiter Team" });
      setServices(data?.services || []);
    });
    return () => u();
  }, []);

  const openAdd  = () => { setSvcForm({ title: "", desc: "" }); setEditIdx(null); setSvcModal(true); };
  const openEdit = (i) => { setSvcForm({ title: services[i].title || "", desc: services[i].desc || "" }); setEditIdx(i); setSvcModal(true); };
  const saveSvc  = () => {
    if (!svcForm.title) return;
    const updated = [...services];
    if (editIdx !== null) updated[editIdx] = svcForm; else updated.push(svcForm);
    setServices(updated); setSvcModal(false);
  };
  const deleteSvc = (i) => setServices(s => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true); setError(""); setOk(false);
    try { await updateSiteContent("about", { ...c, services }); setOk(true); setTimeout(() => setOk(false), 3000); }
    catch (e) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  if (!c) return <div className="flex justify-center py-12"><Spinner /></div>;
  return (
    <div className="space-y-5">
      <Section title="PAGE HEADER">
        <Field label="Page Title" value={f("pageTitle")} onChange={sc("pageTitle")} placeholder="OUR SERVICES" />
        <Field label="Page Description" as="textarea" rows={2} value={f("pageDesc")} onChange={sc("pageDesc")} placeholder="Description..." />
      </Section>
      <Section title="SERVICE / FEATURE CARDS" action={<button onClick={openAdd} className="flex items-center gap-1 text-xs text-cyan font-mono hover:text-cyan/70 transition-colors"><HiPlus size={14} />ADD CARD</button>}>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={s.title || i} className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl p-3 gap-3">
              <div className="min-w-0">
                <div className="font-orbitron text-xs text-white">{s.title}</div>
                <div className="text-xs text-white/40 mt-0.5 line-clamp-1">{s.desc}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(i)} className="p-1.5 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={13} /></button>
                <button onClick={() => deleteSvc(i)} className="p-1.5 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={13} /></button>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="text-center py-8 text-white/20 text-sm font-rajdhani">No service cards yet.</div>}
        </div>
      </Section>
      <Section title="MISSION QUOTE BLOCK">
        <Field label="Quote" as="textarea" rows={2} value={f("quote")} onChange={sc("quote")} placeholder={'"Built for operators who demand precision."'} />
        <Field label="Author" value={f("quoteAuthor")} onChange={sc("quoteAuthor")} placeholder="— Samura Xiter Team" />
      </Section>
      <SaveBar onSave={save} saving={saving} error={error} success={ok} />
      <AnimatePresence>
        {svcModal && (
          <Modal title={editIdx !== null ? "EDIT SERVICE CARD" : "ADD SERVICE CARD"} onClose={() => setSvcModal(false)}>
            <div className="space-y-3">
              <Field label="Title *" value={svcForm.title} onChange={e => setSvcForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. GAMING TOOLS" />
              <Field label="Description" as="textarea" rows={3} value={svcForm.desc} onChange={e => setSvcForm(p => ({ ...p, desc: e.target.value }))} placeholder="Service description..." />
              <ModalActions onCancel={() => setSvcModal(false)} onSave={saveSvc} saving={false} disabled={!svcForm.title} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Contact Page Editor ───────────────────────────────────────
function ContactPageEditor() {
  const [c, setC]           = useState(null);
  const [links, setLinks]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [ok, setOk]         = useState(false);
  const [lModal, setLModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [lForm, setLForm]   = useState({ label: "", sublabel: "", href: "", desc: "", color: "#00ffff", pulse: false });
  const f = (k) => c?.[k] ?? "";
  const sc = (k) => (e) => setC(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = subscribeSiteContent("contact", (data) => {
      setC(data || { pageTitle: "CONTACT SAMURA", pageDesc: "Pick your preferred platform — we're always online.", formEnabled: true });
      setLinks(data?.socialLinks || []);
    });
    return () => u();
  }, []);

  const openAddLink  = () => { setLForm({ label: "", sublabel: "", href: "", desc: "", color: "#00ffff", pulse: false }); setEditIdx(null); setLModal(true); };
  const openEditLink = (i) => { setLForm({ ...links[i] }); setEditIdx(i); setLModal(true); };
  const saveLink = () => {
    if (!lForm.label || !lForm.href) return;
    const updated = [...links];
    if (editIdx !== null) updated[editIdx] = lForm; else updated.push(lForm);
    setLinks(updated); setLModal(false);
  };
  const deleteLink = (i) => setLinks(l => l.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true); setError(""); setOk(false);
    try { await updateSiteContent("contact", { ...c, socialLinks: links }); setOk(true); setTimeout(() => setOk(false), 3000); }
    catch (e) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  if (!c) return <div className="flex justify-center py-12"><Spinner /></div>;
  return (
    <div className="space-y-5">
      <Section title="PAGE HEADER">
        <Field label="Page Title" value={f("pageTitle")} onChange={sc("pageTitle")} placeholder="CONTACT SAMURA" />
        <Field label="Description" as="textarea" rows={2} value={f("pageDesc")} onChange={sc("pageDesc")} placeholder="Description..." />
      </Section>
      <Section title="SOCIAL / CONTACT LINKS" action={<button onClick={openAddLink} className="flex items-center gap-1 text-xs text-cyan font-mono hover:text-cyan/70 transition-colors"><HiPlus size={14} />ADD LINK</button>}>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={link.href || link.label || i} className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl p-3 gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-orbitron text-xs text-white flex items-center gap-2">
                  {link.label}
                  {link.pulse && <span className="text-[9px] font-mono text-green-400 border border-green-400/30 px-1 rounded">LIVE</span>}
                </div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{link.href}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditLink(i)} className="p-1.5 text-white/40 hover:text-cyan border border-white/10 hover:border-cyan/30 rounded-lg transition-all"><HiPencil size={13} /></button>
                <button onClick={() => deleteLink(i)} className="p-1.5 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-all"><HiTrash size={13} /></button>
              </div>
            </div>
          ))}
          {links.length === 0 && <div className="text-center py-8 text-white/20 text-sm font-rajdhani">No contact links yet.</div>}
        </div>
      </Section>
      <Section title="FORM SETTINGS">
        <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" checked={c.formEnabled ?? true} onChange={e => setC(p => ({ ...p, formEnabled: e.target.checked }))} className="accent-cyan" />
          Show email contact form below social links
        </label>
      </Section>
      <SaveBar onSave={save} saving={saving} error={error} success={ok} />
      <AnimatePresence>
        {lModal && (
          <Modal title={editIdx !== null ? "EDIT LINK" : "ADD LINK"} onClose={() => setLModal(false)}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Label *" value={lForm.label} onChange={e => setLForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. WhatsApp" />
                <Field label="Sub-label" value={lForm.sublabel} onChange={e => setLForm(p => ({ ...p, sublabel: e.target.value }))} placeholder="e.g. Live Support" />
              </div>
              <Field label="URL *" value={lForm.href} onChange={e => setLForm(p => ({ ...p, href: e.target.value }))} placeholder="https://wa.me/..." />
              <Field label="Card Description" value={lForm.desc} onChange={e => setLForm(p => ({ ...p, desc: e.target.value }))} placeholder="Fastest reply – click to chat" />
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/50 font-mono tracking-wider">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={lForm.color} onChange={e => setLForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/10" />
                    <span className="text-xs font-mono text-white/40">{lForm.color}</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer pb-1">
                  <input type="checkbox" checked={lForm.pulse} onChange={e => setLForm(p => ({ ...p, pulse: e.target.checked }))} className="accent-cyan" />
                  Show ONLINE badge
                </label>
              </div>
              <ModalActions onCancel={() => setLModal(false)} onSave={saveLink} saving={false} disabled={!lForm.label || !lForm.href} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Dashboard Page Editor ────────────────────────────────────
function DashboardPageEditor() {
  const [c, setC]         = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk]       = useState(false);
  const f = (k) => c?.[k] ?? "";
  const sc = (k) => (e) => setC(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = subscribeSiteContent("dashboard", (data) => setC(data || {
      welcomeTitle: "WELCOME BACK", welcomeDesc: "Your secure client portal",
      quickAction1Title: "MODE STORE", quickAction1Desc: "Browse and purchase premium packages",
      quickAction2Title: "DOWNLOADS",  quickAction2Desc: "Access your premium files and software",
      supportLink: "https://wa.link/gqjni1", supportLabel: "WhatsApp Support",
      announcementEnabled: true,
    }));
    return () => u();
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setOk(false);
    try { await updateSiteContent("dashboard", c); setOk(true); setTimeout(() => setOk(false), 3000); }
    catch (e) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  if (!c) return <div className="flex justify-center py-12"><Spinner /></div>;
  return (
    <div className="space-y-5">
      <Section title="WELCOME HEADER">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Welcome Title" value={f("welcomeTitle")} onChange={sc("welcomeTitle")} placeholder="WELCOME BACK" />
          <Field label="Welcome Subtitle" value={f("welcomeDesc")} onChange={sc("welcomeDesc")} placeholder="Your secure client portal" />
        </div>
      </Section>
      <Section title="QUICK ACTION CARDS">
        <div className="grid grid-cols-2 gap-3">
          {[1,2].map(n => (
            <div key={n} className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-mono text-white/30">QUICK ACTION {n}</p>
              <Field label="Title" value={f(`quickAction${n}Title`)} onChange={sc(`quickAction${n}Title`)} placeholder="e.g. MODE STORE" />
              <Field label="Description" value={f(`quickAction${n}Desc`)} onChange={sc(`quickAction${n}Desc`)} placeholder="Short description..." />
            </div>
          ))}
        </div>
      </Section>
      <Section title="SUPPORT BUTTON">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Support URL" value={f("supportLink")} onChange={sc("supportLink")} placeholder="https://wa.link/..." />
          <Field label="Button Label" value={f("supportLabel")} onChange={sc("supportLabel")} placeholder="WhatsApp Support" />
        </div>
      </Section>
      <Section title="OPTIONS">
        <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" checked={c.announcementEnabled ?? true} onChange={e => setC(p => ({ ...p, announcementEnabled: e.target.checked }))} className="accent-cyan" />
          Show announcements banner on dashboard
        </label>
      </Section>
      <SaveBar onSave={save} saving={saving} error={error} success={ok} />
    </div>
  );
}

// ── Store Page Editor ─────────────────────────────────────────
function StorePageEditor() {
  const [c, setC]           = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [ok, setOk]         = useState(false);
  const f = (k) => c?.[k] ?? "";
  const sc = (k) => (e) => setC(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = subscribeSiteContent("store", (data) => setC(data || {
      pageTitle: "MODE STORE", pageDesc: "Select a package that suits your needs",
      bankName: "Commercial Bank", bankAccount: "XXXX-XXXX-XXXX",
      bankHolder: "Your Name", ezCashNumber: "07XXXXXXXX",
      whatsappNumber: "94XXXXXXXXX",
      paymentNote: "Send payment screenshot to WhatsApp after checkout",
      checkoutNote: "Payment confirmation may take up to 24 hours",
    }));
    return () => u();
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setOk(false);
    try { await updateSiteContent("store", c); setOk(true); setTimeout(() => setOk(false), 3000); }
    catch (e) { setError(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  if (!c) return <div className="flex justify-center py-12"><Spinner /></div>;
  return (
    <div className="space-y-5">
      <Section title="PAGE HEADER">
        <Field label="Page Title" value={f("pageTitle")} onChange={sc("pageTitle")} placeholder="MODE STORE" />
        <Field label="Description" as="textarea" rows={2} value={f("pageDesc")} onChange={sc("pageDesc")} placeholder="Select a package..." />
      </Section>
      <Section title="PAYMENT DETAILS (shown to users at checkout)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bank Name" value={f("bankName")} onChange={sc("bankName")} placeholder="Commercial Bank" />
          <Field label="Account Number" value={f("bankAccount")} onChange={sc("bankAccount")} placeholder="XXXX-XXXX-XXXX" />
          <Field label="Account Holder" value={f("bankHolder")} onChange={sc("bankHolder")} placeholder="Your Name" />
          <Field label="EzCash / Dialog Number" value={f("ezCashNumber")} onChange={sc("ezCashNumber")} placeholder="07XXXXXXXX" />
        </div>
        <Field label="WhatsApp Number" hint="94XXXXXXXXX format (no +)" value={f("whatsappNumber")} onChange={sc("whatsappNumber")} placeholder="94XXXXXXXXX" />
      </Section>
      <Section title="CHECKOUT MESSAGES">
        <Field label="Payment Instruction" as="textarea" rows={2} value={f("paymentNote")} onChange={sc("paymentNote")} placeholder="Send payment screenshot to WhatsApp..." />
        <Field label="Confirmation Message" as="textarea" rows={2} value={f("checkoutNote")} onChange={sc("checkoutNote")} placeholder="Confirmation may take up to 24 hours..." />
      </Section>
      <SaveBar onSave={save} saving={saving} error={error} success={ok} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═══════════════════════════════════════════════════════════
const TABS = [
  { id: "overview",      label: "OVERVIEW",   icon: HiChartBar    },
  { id: "orders",        label: "ORDERS",     icon: HiShoppingBag },
  { id: "packages",      label: "PACKAGES",   icon: HiCube        },
  { id: "downloads",     label: "DOWNLOADS",  icon: HiDownload    },
  { id: "users",         label: "USERS",      icon: HiUsers       },
  { id: "announcements", label: "BANNERS",    icon: HiSpeakerphone },
  { id: "pages",         label: "PAGES",      icon: HiDocumentText },
];

export default function AdminPage() {
  // BUG FIX: also destructure currentUser — userData Firestore doc is not guaranteed
  // to have the email field synced, but currentUser.email from Firebase Auth always does.
  const { userData, currentUser } = useAuth();
  const [activeTab, setActiveTab]       = useState("overview");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const u = subscribeOrders((d) => setPendingCount(d.length), "pending");
    return () => u();
  }, []);

  return (
    <div className="min-h-screen bg-dark pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl border border-cyan/30 flex items-center justify-center text-cyan">
            <HiShieldCheck size={22} />
          </div>
          <div>
            <h1 className="font-orbitron text-white text-lg tracking-widest">ADMIN PANEL</h1>
            <p className="text-white/30 text-xs font-mono">{currentUser?.email}</p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all relative
                ${activeTab === id ? "bg-cyan/15 border border-cyan/40 text-cyan" : "border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"}`}>
              <Icon size={15} /> {label}
              {id === "orders" && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/2 border border-white/8 rounded-2xl p-6">
          {activeTab === "overview"      && <OverviewTab setActiveTab={setActiveTab} />}
          {activeTab === "orders"        && <OrdersTab />}
          {activeTab === "packages"      && <PackagesTab />}
          {activeTab === "downloads"     && <DownloadsTab />}
          {activeTab === "users"         && <UsersTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "pages"         && <PagesTab />}
        </motion.div>

      </div>
    </div>
  );
}
