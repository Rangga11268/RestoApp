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
} from "@phosphor-icons/react"
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'

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
    icon: <SquaresFour size={20} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier', 'kitchen'],
  },
  {
    label: 'Pesanan',
    href: '/orders',
    matchPrefix: true,
    icon: <ShoppingCart size={20} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier', 'kitchen'],
  },
  {
    label: 'Pembayaran',
    href: '/payments',
    icon: <Wallet size={20} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    label: 'Kategori',
    href: '/menu/categories',
    icon: <Tag size={20} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Menu',
    href: '/menu/items',
    icon: <ForkKnife size={20} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Meja',
    href: '/tables',
    icon: <Armchair size={20} weight="duotone" />,
    roles: ['owner', 'manager', 'cashier'],
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: <Users size={20} weight="duotone" />,
    roles: ['owner'],
  },
  {
    label: 'Laporan',
    href: '/reports',
    icon: <ChartBar size={20} weight="duotone" />,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Langganan',
    href: '/subscription',
    icon: <CreditCard size={20} weight="duotone" />,
    roles: ['owner'],
    dividerBefore: true,
  },
  {
    label: 'Pengaturan',
    href: '/settings',
    icon: <Gear size={20} weight="duotone" />,
    roles: ['owner'],
  },
  // ── Super Admin only ──────────────────────────
  {
    label: 'Dashboard',
    href: '/superadmin',
    icon: <SquaresFour size={20} weight="duotone" />,
    roles: ['superadmin'],
  },
  {
    label: 'Restoran',
    href: '/superadmin/restaurants',
    icon: <Storefront size={20} weight="duotone" />,
    roles: ['superadmin'],
  },
  {
    label: 'Activity Logs',
    href: '/superadmin/logs',
    icon: <ClipboardText size={20} weight="duotone" />,
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
    <div className="flex flex-col h-full py-6">
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center px-6 mb-8 transition-all',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <ForkKnife size={18} weight="bold" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              Resto<span className="text-orange-500">App</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <ForkKnife size={22} weight="bold" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto w-full">
        {visibleNav.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
          return (
            <div key={item.href} className="w-full">
              {item.dividerBefore && !collapsed && (
                <div className="my-4 mx-2 border-t border-gray-100" />
              )}
              {item.dividerBefore && collapsed && (
                <div className="my-4 mx-auto w-8 border-t border-gray-100" />
              )}
              <Link
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center rounded-xl text-sm transition-all duration-300 w-full hover:scale-[1.02]',
                  collapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-3 gap-3',
                  active
                    ? 'bg-white text-orange-600 font-semibold shadow-premium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                )}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={cn('transition-colors', active ? 'text-orange-500' : 'text-gray-400')}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="tracking-tight">{item.label}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto px-4 pt-4">
        <div
          className={cn(
            'bg-white rounded-2xl border border-gray-100/80 transition-all overflow-hidden',
            collapsed ? 'p-2' : 'p-3 shadow-premium'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 flex items-center justify-center text-orange-600 font-bold text-sm ring-2 ring-white shadow-sm flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[11px] font-medium text-gray-400 capitalize truncate">
                  {user?.role} · {user?.restaurant?.name || 'No Resto'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center w-full rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors',
              collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
            )}
            title={collapsed ? 'Keluar' : undefined}
          >
            <SignOut size={collapsed ? 20 : 18} />
            {!collapsed && 'Keluar'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Desktop Sidebar (Floating UI style) */}
      <div
        className={cn(
          'hidden lg:flex flex-col transition-all duration-300 py-4 pl-4',
          collapsed ? 'w-28' : 'w-72'
        )}
      >
        <aside className="h-full bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">
          {sidebarContent}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-8 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:scale-110 transition-transform cursor-pointer shadow-sm shadow-black/5 z-10 hidden"
            // Temporarily hiding the built-in expand button to keep it super clean,
            // or we could show it if needed. Let's make it more seamless:
            style={{ display: 'none' }}
          />
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-4 pr-4 pl-4 lg:pl-6 pt-4">
        {/* Top bar (Desktop & Mobile) */}
        <header
          className={cn(
            'flex items-center justify-between px-6 py-4 rounded-3xl transition-all duration-300 z-10 mb-4',
            scrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-premium border border-gray-200/50'
              : 'bg-transparent',
            'lg:justify-end' // desktop just aligns to right since left is mostly empty
          )}
        >
          {/* Mobile Menu Icon */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/60 active:bg-white transition"
            >
              <List size={22} className="text-gray-700" />
            </button>
            <span className="font-bold text-gray-900 text-lg">
              Resto<span className="text-orange-500">App</span>
            </span>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-4">
            {/* Collapse Toggle for Desktop */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex p-2.5 rounded-xl bg-white border border-gray-200/50 text-gray-500 hover:text-gray-900 hover:shadow-sm transition-all shadow-black/5"
            >
              <CaretLeft
                size={18}
                className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
              />
            </button>
          </div>
        </header>

        {/* Mobile overlay */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile sidebar */}
        <aside
          className={cn(
            'fixed inset-y-4 left-4 z-50 w-64 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl transition-transform duration-300 lg:hidden overflow-hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'
          )}
        >
          {sidebarContent}
        </aside>

        {/* Subscription warning */}
        {user?.subscription && (
          <div className="mb-4">
            {user.subscription.status === 'expired' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3 text-sm text-red-700 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Warning size={18} weight="duotone" className="text-red-500" />
                  <span>
                    Langganan Anda telah <strong>kadaluarsa</strong>.
                  </span>
                </div>
                <Link
                  to="/subscription"
                  className="bg-red-500 text-white px-4 py-1.5 rounded-lg font-medium text-xs hover:bg-red-600 transition"
                >
                  Perbarui
                </Link>
              </div>
            )}
            {user.subscription.status !== 'expired' &&
              (user.subscription.days_remaining ?? 0) <= 7 &&
              (user.subscription.days_remaining ?? 0) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3 text-sm text-amber-700 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Warning size={18} weight="duotone" className="text-amber-500" />
                    <span>
                      Langganan berakhir dalam{' '}
                      <strong>{user.subscription.days_remaining} hari</strong>.
                    </span>
                  </div>
                  <Link
                    to="/subscription"
                    className="bg-amber-500 text-white px-4 py-1.5 rounded-lg font-medium text-xs hover:bg-amber-600 transition"
                  >
                    Perbarui
                  </Link>
                </div>
              )}
          </div>
        )}

        {/* Scrollable Content Area */}
        <main
          id="main-scroll-container"
          className="flex-1 overflow-y-auto rounded-3xl bg-white shadow-sm border border-gray-100/50 p-6 md:p-8 custom-scrollbar relative"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
