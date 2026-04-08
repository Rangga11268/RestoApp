import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  SquaresFour,
  ShoppingCart,
  ForkKnife,
  Tag,
  Armchair,
  Gear,
  SignOut,
  CaretLeft,
  List,
  Wallet,
  ChartBar,
  Users,
  CreditCard,
  Storefront,
  ClipboardText,
  Warning,
  Bell,
} from "@phosphor-icons/react"
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/auth'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NavItem {
  label: string
  href: string
  matchPrefix?: boolean
  icon: React.ReactNode
  roles: UserRole[]
  dividerBefore?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <SquaresFour size={22} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier', 'kitchen'],
  },
  {
    label: 'Pesanan',
    href: '/orders',
    matchPrefix: true,
    icon: <ShoppingCart size={22} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier', 'kitchen'],
  },
  {
    label: 'Pembayaran',
    href: '/payments',
    icon: <Wallet size={22} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    label: 'Kategori',
    href: '/menu/categories',
    icon: <Tag size={22} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Menu',
    href: '/menu/items',
    icon: <ForkKnife size={22} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Meja',
    href: '/tables',
    icon: <Armchair size={22} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: <Users size={22} weight="duotone" />,
    roles: ['owner'],
  },
  {
    label: 'Laporan',
    href: '/reports',
    icon: <ChartBar size={22} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Langganan',
    href: '/subscription',
    icon: <CreditCard size={22} weight="duotone" />,
    roles: ['owner'],
    dividerBefore: true,
  },
  {
    label: 'Pengaturan',
    href: '/settings',
    icon: <Gear size={22} weight="duotone" />,
    roles: ['owner'],
  },
  // ── Super Admin only ──────────────────────────
  {
    label: 'Dashboard',
    href: '/superadmin',
    icon: <SquaresFour size={22} weight="duotone" />,
    roles: ['superadmin'],
  },
  {
    label: 'Restoran',
    href: '/superadmin/restaurants',
    icon: <Storefront size={22} weight="duotone" />,
    roles: ['superadmin'],
  },
  {
    label: 'Activity Logs',
    href: '/superadmin/logs',
    icon: <ClipboardText size={22} weight="duotone" />,
    roles: ['superadmin'],
  },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Scrolled state for beautiful topbar
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container')
    const handleScroll = () => {
      setScrolled((mainContainer?.scrollTop || 0) > 10)
    }
    mainContainer?.addEventListener('scroll', handleScroll)
    return () => mainContainer?.removeEventListener('scroll', handleScroll)
  }, [])

  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full py-8">
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center px-6 mb-10 transition-all',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ForkKnife size={20} weight="bold" />
            </div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tighter">
              Resto<span className="text-primary italic">App</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <ForkKnife size={24} weight="bold" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto w-full custom-scrollbar">
        {visibleNav.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
          return (
            <div key={item.href} className="w-full">
              {item.dividerBefore && (
                <div className={cn('my-4 border-t border-slate-100', collapsed ? 'mx-4' : 'mx-2')} />
              )}
              <Link
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center rounded-xl transition-all duration-300 w-full relative',
                  collapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3 gap-3.5',
                  active
                    ? 'bg-primary/5 text-primary font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                )}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full animate-in" />
                )}
                <span
                  className={cn(
                    'transition-all duration-300 group-hover:scale-110',
                    active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="tracking-tight text-sm">{item.label}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto px-4 pt-6">
        <div
          className={cn(
            'bg-slate-50/50 rounded-2xl border border-slate-100/80 transition-all overflow-hidden',
            collapsed ? 'p-1.5' : 'p-3 shadow-sm'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-4 ring-white shadow-sm flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center w-full rounded-xl text-sm font-semibold text-slate-500 hover:text-danger hover:bg-danger/5 transition-all active:scale-95',
              collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
            )}
            title={collapsed ? 'Keluar' : undefined}
          >
            <SignOut size={collapsed ? 22 : 20} weight="duotone" />
            {!collapsed && 'Keluar'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-primary/20">
      {/* Desktop Sidebar (Floating Pro Max style) */}
      <div
        className={cn(
          'hidden lg:flex flex-col transition-all duration-500 ease-in-out py-6 pl-6',
          collapsed ? 'w-24' : 'w-72'
        )}
      >
        <aside className="h-full bg-white border border-slate-200/60 rounded-[32px] shadow-premium overflow-hidden flex flex-col relative animate-in">
          {sidebarContent}
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-6 pr-6 pl-6 lg:pl-8 pt-6">
        {/* Top bar */}
        <header
          className={cn(
            'flex items-center justify-between px-8 py-4 rounded-[24px] transition-all duration-500 z-10 mb-6',
            scrolled
              ? 'glass shadow-premium'
              : 'bg-transparent',
            'lg:justify-end'
          )}
        >
          {/* Mobile Menu Icon */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-3 -ml-2 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-90 transition-all"
            >
              <List size={24} weight="bold" className="text-slate-900" />
            </button>
            <span className="font-extrabold text-slate-900 text-xl tracking-tighter">
              Resto<span className="text-primary italic">App</span>
            </span>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-5">
            <button className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-premium transition-all relative">
                <Bell size={20} weight="duotone" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white animate-pulse" />
            </button>

            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-premium transition-all group"
            >
              <CaretLeft
                size={20}
                weight="bold"
                className={cn('transition-transform duration-500 group-hover:scale-110', collapsed && 'rotate-180')}
              />
            </button>
          </div>
        </header>

        {/* Mobile overlay */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 lg:hidden',
            mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile sidebar */}
        <aside
          className={cn(
            'fixed inset-y-6 left-6 z-50 w-72 bg-white border border-slate-100 rounded-[32px] shadow-2xl transition-all duration-500 lg:hidden overflow-hidden',
            mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'
          )}
        >
          {sidebarContent}
        </aside>

        {/* Subscription warning */}
        {user?.subscription && (
          <div className="mb-6 animate-in">
            {user.subscription.status === 'expired' && (
              <div className="bg-danger/5 border border-danger/10 rounded-[20px] px-6 py-4 text-sm text-danger flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                    <Warning size={22} weight="duotone" />
                  </div>
                  <div>
                    <p className="font-bold">Langganan Kedaluwarsa</p>
                    <p className="opacity-80">Akses fitur terbatas. Segera perbarui langganan Anda.</p>
                  </div>
                </div>
                <Link
                  to="/subscription"
                  className="bg-danger text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-red-600 transition shadow-lg shadow-danger/20 active:scale-95"
                >
                  PERBARUI SEKARANG
                </Link>
              </div>
            )}
            {user.subscription.status !== 'expired' &&
              (user.subscription.days_remaining ?? 0) <= 7 &&
              (user.subscription.days_remaining ?? 0) > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-[20px] px-6 py-4 text-sm text-amber-700 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Warning size={22} weight="duotone" />
                    </div>
                    <div>
                      <p className="font-bold">Langganan Segera Berakhir</p>
                      <p className="opacity-80">Tersisa {user.subscription.days_remaining} hari lagi.</p>
                    </div>
                  </div>
                  <Link
                    to="/subscription"
                    className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    PERPANJANG
                  </Link>
                </div>
              )}
          </div>
        )}

        {/* Scrollable Content Area */}
        <main
          id="main-scroll-container"
          className="flex-1 overflow-y-auto rounded-[32px] bg-white shadow-premium border border-slate-100 p-8 md:p-10 custom-scrollbar relative animate-in"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
