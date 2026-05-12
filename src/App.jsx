// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// PERF FIX: lazy-load every page — initial bundle is now tiny.
// AdminPage alone was 69 KB source; now only fetched when the admin visits.
const HomePage            = lazy(() => import("./pages/HomePage"));
const AboutPage           = lazy(() => import("./pages/AboutPage"));
const ContactPage         = lazy(() => import("./pages/ContactPage"));
const PublicDownloadsPage = lazy(() => import("./pages/PublicDownloadsPage"));
const AuthPage            = lazy(() => import("./pages/AuthPage"));
const DashboardPage       = lazy(() => import("./pages/portal/DashboardPage"));
const ModeStorePage       = lazy(() => import("./pages/portal/ModeStorePage"));
const SecureDownloadsPage = lazy(() => import("./pages/portal/SecureDownloadsPage"));
const OrdersPage          = lazy(() => import("./pages/portal/OrdersPage"));
const ProfilePage         = lazy(() => import("./pages/portal/ProfilePage"));
const AdminPage           = lazy(() => import("./pages/admin/AdminPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-cyan/50 text-xs tracking-widest">LOADING...</span>
      </div>
    </div>
  );
}

function Layout({ children, noFooter = false }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<Layout><HomePage /></Layout>} />
        <Route path="/about"     element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact"   element={<Layout><ContactPage /></Layout>} />
        <Route path="/downloads" element={<Layout><PublicDownloadsPage /></Layout>} />
        <Route path="/auth"      element={<Layout noFooter><AuthPage /></Layout>} />

        {/* Protected Portal */}
        <Route path="/portal" element={
          <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
        }/>
        <Route path="/portal/store" element={
          <ProtectedRoute><Layout><ModeStorePage /></Layout></ProtectedRoute>
        }/>
        <Route path="/portal/downloads" element={
          <ProtectedRoute><Layout><SecureDownloadsPage /></Layout></ProtectedRoute>
        }/>
        <Route path="/portal/orders" element={
          <ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>
        }/>
        <Route path="/portal/profile" element={
          <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
        }/>

        {/* Admin Only */}
        <Route path="/admin" element={
          <AdminRoute><Layout noFooter><AdminPage /></Layout></AdminRoute>
        }/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
