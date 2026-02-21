import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Tag,
  Table2,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Wallet,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  /** Use startsWith matching (for parent paths like /orders) */
  matchPrefix?: boolean;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["superadmin", "owner", "manager", "cashier", "kitchen"],
  },
  {
    label: "Pesanan",
    href: "/orders",
    matchPrefix: true,
    icon: <ShoppingCart size={18} />,
    roles: ["owner", "manager", "cashier", "kitchen"],
  },
  {
    label: "Pembayaran",
    href: "/payments",
    icon: <Wallet size={18} />,
    roles: ["owner", "manager", "cashier"],
  },
  {
    label: "Kategori",
    href: "/menu/categories",
    icon: <Tag size={18} />,
    roles: ["owner", "manager"],
  },
  {
    label: "Menu",
    href: "/menu/items",
    icon: <UtensilsCrossed size={18} />,
    roles: ["owner", "manager"],
  },
  {
    label: "Meja",
    href: "/tables",
    icon: <Table2 size={18} />,
    roles: ["owner", "manager", "cashier"],
  },
  {
    label: "Laporan",
    href: "/reports",
    icon: <BarChart3 size={18} />,
    roles: ["owner", "manager"],
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: <Settings size={18} />,
    roles: ["owner", "superadmin"],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const visibleNav = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        {!collapsed && (
          <span className="font-bold text-orange-500 text-lg">🍽 RestoApp</span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeft
            size={16}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = item.matchPrefix
            ? pathname.startsWith(item.href)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                active
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium",
              )}
            >
              <span
                className={cn(active ? "text-orange-500" : "text-gray-400")}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </p>
              <span className="inline-block text-[10px] font-medium bg-gray-100 text-gray-500 capitalize rounded-full px-2 py-0.5 mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          {!collapsed && "Keluar"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200",
          collapsed ? "w-16" : "w-56",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-white border-r border-gray-200 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-orange-500">🍽 RestoApp</span>
        </header>

        {/* Subscription warning */}
        {user?.subscription?.status === "trialing" &&
          (user.subscription.days_remaining ?? 0) <= 3 && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center">
              ⚠️ Trial Anda berakhir dalam{" "}
              <strong>{user.subscription.days_remaining} hari</strong>.{" "}
              <Link
                to="/settings/subscription"
                className="underline font-medium"
              >
                Upgrade sekarang
              </Link>
            </div>
          )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
