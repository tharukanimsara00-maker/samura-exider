// Developer: AKARSHANA
// src/firebase/firestore.js
import {
  doc, getDoc, collection, getDocs, query,
  where, orderBy, onSnapshot, addDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── Get single user data ────────────────────────────────────
export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── Real-time user data listener ────────────────────────────
export function subscribeUserData(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ─── Real-time ALL users listener (admin only) ───────────────
export function subscribeUsers(callback) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Real-time downloads listener ────────────────────────────
// BUG FIX (PERF): when activeOnly=true, add isActive filter to the server query
// instead of fetching all docs and filtering client-side.
export function subscribeDownloads(premiumOnly, callback, activeOnly = true) {
  const col = collection(db, "downloads");
  const constraints = [where("isPremium", "==", premiumOnly)];
  if (activeOnly) constraints.push(where("isActive", "==", true));
  constraints.push(orderBy("updatedAt", "desc"));
  const q = query(col, ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Get packages (PUBLIC — active only) ─────────────────────
export async function getPackages() {
  const snap = await getDocs(collection(db, "packages"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((d) => d.isActive !== false);
}

// ─── Real-time packages listener (ADMIN — all including inactive) ─
export function subscribeAllPackages(callback) {
  const q = query(collection(db, "packages"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Real-time orders listener (ADMIN) ───────────────────────
export function subscribeOrders(callback, statusFilter = null) {
  let q;
  if (statusFilter) {
    q = query(
      collection(db, "orders"),
      where("status", "==", statusFilter),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Real-time orders for a specific user (portal) ───────────
// FIX: Added this missing function — needed for OrdersPage
export function subscribeUserOrders(uid, callback) {
  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Create order (from store checkout) ──────────────────────
export async function createOrder(uid, displayName, email, cart, total) {
  return await addDoc(collection(db, "orders"), {
    uid,
    displayName,
    email,
    items: cart.map((p) => ({
      id:       p.id,
      name:     p.name,
      price:    p.price || 0,
      duration: p.duration || "",
    })),
    total,
    status:    "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─── Admin overview stats (real-time) ────────────────────────
export function subscribeAdminStats(callback) {
  let stats = { users: 0, packages: 0, downloads: 0, premiumUsers: 0, pendingOrders: 0 };
  let resolved = { users: false, packages: false, downloads: false, orders: false };

  const tryEmit = () => {
    if (resolved.users && resolved.packages && resolved.downloads && resolved.orders) {
      callback({ ...stats });
    }
  };

  const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
    stats.users = snap.size;
    stats.premiumUsers = snap.docs.filter((d) => {
      const data = d.data();
      if (!data.plan || data.plan === "free") return false;
      try {
        if (data.licenseExpiry) {
          const exp = data.licenseExpiry.toDate
            ? data.licenseExpiry.toDate()
            : new Date(data.licenseExpiry);
          if (isNaN(exp.getTime()) || exp < new Date()) return false;
        }
      } catch { return false; }
      return true;
    }).length;
    resolved.users = true;
    tryEmit();
  });

  const unsubPkgs = onSnapshot(collection(db, "packages"), (snap) => {
    stats.packages = snap.size;
    resolved.packages = true;
    tryEmit();
  });

  const unsubDl = onSnapshot(collection(db, "downloads"), (snap) => {
    stats.downloads = snap.size;
    resolved.downloads = true;
    tryEmit();
  });

  const unsubOrders = onSnapshot(
    query(collection(db, "orders"), where("status", "==", "pending")),
    (snap) => {
      stats.pendingOrders = snap.size;
      resolved.orders = true;
      tryEmit();
    }
  );

  return () => { unsubUsers(); unsubPkgs(); unsubDl(); unsubOrders(); };
}

// ─── Real-time site content listener ─────────────────────────
export function subscribeSiteContent(pageId, callback) {
  return onSnapshot(doc(db, "siteContent", pageId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// ─── Real-time ALL announcements listener (admin) ─────────────
export function subscribeAllAnnouncements(callback) {
  const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── Real-time active announcements (public) ─────────────────
// BUG FIX: was fetching ALL announcements and filtering client-side.
// Now uses a server-side where() clause — cheaper reads and faster load.
export function subscribeAnnouncements(callback) {
  const q = query(
    collection(db, "announcements"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
