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
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <SquaresFour size={20} weight="bold" />, roles: ['owner', 'manager', 'cashier', 'kitchen'] },
  { label: 'Pesanan', href: '/orders', matchPrefix: true, icon: <ShoppingCart size={20} weight="bold" />, roles: ['owner', 'manager', 'cashier', 'kitchen'] },
  { label: 'Pembayaran', href: '/payments', icon: <Wallet size={20} weight="bold" />, roles: ['owner', 'manager', 'cashier'] },
  { label: 'Kategori', href: '/menu/categories', icon: <Tag size={20} weight="bold" />, roles: ['owner', 'manager'] },
  { label: 'Menu', href: '/menu/items', icon: <ForkKnife size={20} weight="bold" />, roles: ['owner', 'manager'] },
  { label: 'Meja', href: '/tables', icon: <Armchair size={20} weight="bold" />, roles: ['owner', 'manager', 'cashier'] },
  { label: 'Staff', href: '/staff', icon: <Users size={20} weight="bold" />, roles: ['owner'] },
  { label: 'Laporan', href: '/reports', icon: <ChartBar size={20} weight="bold" />, roles: ['owner', 'manager'] },
  { label: 'Pengaturan', href: '/settings', icon: <Gear size={20} weight="bold" />, roles: ['owner'] },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.getElementById('main-scroll-container')
    const handler = () => setScrolled((el?.scrollTop || 0) > 8)
    el?.addEventListener('scroll', handler)
    return () => el?.removeEventListener('scroll', handler)
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
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center h-14', collapsed ? 'justify-center' : 'px-5')}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <ForkKnife size={16} weight="bold" className="text-white" />
            </div>
            <span className="font-semibold text-ink-sidebar text-base tracking-tight">
              Resto<span className="text-accent">App</span>
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <ForkKnife size={16} weight="bold" className="text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center h-11 w-11 mx-auto' : 'gap-3 px-3 h-10',
                active
                  ? 'bg-sidebar-active text-white'
                  : 'text-ink-sidebar/70 hover:bg-sidebar-hover hover:text-ink-sidebar'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn('flex-shrink-0', active ? 'text-white' : 'text-ink-sidebar/50')}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-3 pt-2 border-t border-white/10">
        <div className={cn('flex items-center gap-2.5 mb-2', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink-sidebar truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] font-medium text-ink-sidebar/40 uppercase tracking-wider truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center w-full rounded-lg text-xs font-medium text-ink-sidebar/50 hover:text-ink-sidebar hover:bg-sidebar-hover transition-colors',
            collapsed ? 'justify-center h-9' : 'gap-2 px-2.5 h-9'
          )}
          title={collapsed ? 'Keluar' : undefined}
        >
          <SignOut size={16} weight="bold" />
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          'hidden lg:flex flex-col transition-[width] duration-200 py-3 pl-3',
          collapsed ? 'w-20' : 'w-60'
        )}
      >
        <aside className="h-full bg-sidebar rounded-xl overflow-hidden flex flex-col">
          {sidebarContent}
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-3 pr-3 pl-3 lg:pl-0 pt-3">
        <header
          className={cn(
            'flex items-center justify-between px-4 h-12 rounded-lg transition-all z-10 mb-3',
            scrolled ? 'bg-surface/90 border border-rule shadow-sm' : 'bg-transparent',
          )}
        >
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-rule hover:bg-paper-2 transition-colors"
            >
              <List size={18} weight="bold" className="text-ink" />
            </button>
            <span className="font-semibold text-ink text-sm">RestoApp</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-rule text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors">
              <Bell size={16} weight="bold" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-danger" />
            </button>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-rule text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors"
            >
              <CaretLeft size={16} weight="bold" className={cn('transition-transform', collapsed && 'rotate-180')} />
            </button>
          </div>
        </header>

        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={cn(
            'fixed inset-y-3 left-3 z-50 w-60 bg-sidebar rounded-xl transition-[transform,opacity] duration-200 lg:hidden',
            mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+1rem)] opacity-0'
          )}
        >
          {sidebarContent}
        </aside>

        <main
          id="main-scroll-container"
          className="flex-1 overflow-y-auto rounded-lg bg-surface border border-rule p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  )
}