import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";

// Auth pages (eager loaded — fast initial paint)
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

// App pages (lazy loaded)
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const CategoriesPage = lazy(() => import("@/pages/app/CategoriesPage"));
const MenuItemsPage = lazy(() => import("@/pages/app/MenuItemsPage"));
const TablesPage = lazy(() => import("@/pages/app/TablesPage"));
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage"));
const OrdersPage = lazy(() => import("@/pages/app/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/app/OrderDetailPage"));
const PaymentPage = lazy(() => import("@/pages/app/PaymentPage"));
const InvoicePage = lazy(() => import("@/pages/app/InvoicePage"));
const PaymentHistoryPage = lazy(() => import("@/pages/app/PaymentHistoryPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

// Public pages (no auth)
const PublicMenuPage = lazy(() => import("@/pages/public/PublicMenuPage"));

const Loader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function ShellRoute({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public — no auth required */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/menu/:slug" element={<PublicMenuPage />} />

          {/* Protected — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <ShellRoute>
                  <DashboardPage />
                </ShellRoute>
              }
            />
            <Route
              path="/menu/categories"
              element={
                <ShellRoute>
                  <CategoriesPage />
                </ShellRoute>
              }
            />
            <Route
              path="/menu/items"
              element={
                <ShellRoute>
                  <MenuItemsPage />
                </ShellRoute>
              }
            />
            <Route
              path="/tables"
              element={
                <ShellRoute>
                  <TablesPage />
                </ShellRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ShellRoute>
                  <SettingsPage />
                </ShellRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ShellRoute>
                  <OrdersPage />
                </ShellRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ShellRoute>
                  <OrderDetailPage />
                </ShellRoute>
              }
            />
            <Route
              path="/orders/:id/payment"
              element={
                <ShellRoute>
                  <PaymentPage />
                </ShellRoute>
              }
            />
            <Route
              path="/orders/:id/invoice"
              element={
                <ShellRoute>
                  <InvoicePage />
                </ShellRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ShellRoute>
                  <PaymentHistoryPage />
                </ShellRoute>
              }
            />
          </Route>

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
