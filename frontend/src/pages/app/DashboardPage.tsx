import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuthStore } from '@/stores/authStore'
import {
  ShoppingCart,
  TrendUp,
  ForkKnife,
  Clock,
  Tag,
  Armchair,
  ArrowRight,
  ChartBar,
  CircleNotch,
  ImageBroken,
  Lightning,
  Sparkle,
} from '@phosphor-icons/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getDashboardReport, type DashboardData } from '@/services/reportService'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Helpers ─────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function fmt(n: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(n)
}

const QUICK_ACTIONS = [
  {
    label: 'Kategori',
    desc: 'Kelola kategori menu',
    icon: <Tag size={24} weight="duotone" />,
    href: '/menu/categories',
    color: 'bg-indigo-50 text-indigo-500',
    hoverGrad: 'group-hover:bg-indigo-500 group-hover:text-white',
  },
  {
    label: 'Menu',
    desc: 'Item menu baru',
    icon: <ForkKnife size={24} weight="duotone" />,
    href: '/menu/items',
    color: 'bg-orange-50 text-orange-500',
    hoverGrad: 'group-hover:bg-orange-500 group-hover:text-white',
  },
  {
    label: 'Meja',
    desc: 'Atur meja & QR',
    icon: <Armchair size={24} weight="duotone" />,
    href: '/tables',
    color: 'bg-cyan-50 text-cyan-500',
    hoverGrad: 'group-hover:bg-cyan-500 group-hover:text-white',
  },
  {
    label: 'Laporan',
    desc: 'Sales & produk',
    icon: <ChartBar size={24} weight="duotone" />,
    href: '/reports',
    color: 'bg-emerald-50 text-emerald-500',
    hoverGrad: 'group-hover:bg-emerald-500 group-hover:text-white',
  },
]

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <Card className="p-3 shadow-2xl border-none min-w-[140px] glass">
      <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-slate-900 font-extrabold text-base tracking-tight">
        {fmt(payload[0]?.value ?? 0)}
      </p>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const currency =
    (user as { restaurant?: { currency?: string } } | null)?.restaurant?.currency ?? 'IDR'

  useEffect(() => {
    getDashboardReport()
      .then(setData)
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setLoading(false))
  }, [])

  const isTrialing = user?.subscription?.status === 'trialing'
  const daysLeft = user?.subscription?.days_remaining ?? 0

  const stats = [
    {
      label: 'Pendapatan Hari Ini',
      value: loading ? '—' : fmt(data?.today.revenue ?? 0, currency),
      icon: <TrendUp size={28} weight="duotone" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pesanan Hari Ini',
      value: loading ? '—' : String(data?.today.order_count ?? 0),
      icon: <ShoppingCart size={28} weight="duotone" />,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Antrean Pending',
      value: loading ? '—' : String(data?.today.pending_orders ?? 0),
      icon: <Clock size={28} weight="duotone" />,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Menu Aktif',
      value: loading ? '—' : String(data?.today.active_menus ?? 0),
      icon: <Sparkle size={28} weight="duotone" />,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 selection:bg-primary/20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <Badge variant="primary" className="animate-pulse">Live Dashboard</Badge>
             <span className="text-xs font-bold text-slate-400 capitalize">{user?.restaurant?.name}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">
            {greeting()},{' '}
            <span className="text-primary italic">
              {user?.name?.split(' ')[0]}
            </span>{' '}
            👋
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-md">
            Pantau pertumbuhan bisnismu secara real-time dari satu dashboard modern.
          </p>
        </div>

        {user?.subscription && (
          <div
            className={cn(
              'flex items-center gap-4 py-3 px-5 rounded-2xl border transition-all animate-in shadow-sm',
              isTrialing && daysLeft <= 3
                ? 'bg-danger/5 border-danger/10 text-danger'
                : 'bg-white border-slate-100 text-slate-600'
            )}
          >
            <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isTrialing ? 'bg-amber-100 text-amber-900' : 'bg-success/10 text-success'
            )}>
                <Lightning size={20} weight="fill" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">Status Langganan</p>
                <p className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {isTrialing ? `Trial — ${daysLeft} hari lagi` : `Paket ${user.subscription.plan.toUpperCase()} Aktif`}
                </p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card
            key={s.label}
            animated
            className="group relative overflow-hidden"
          >
            <div className={cn('absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150', s.bg)} />
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6', s.bg, s.color)}>
                {s.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
                  {s.label}
                </p>
                {loading ? (
                  <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-24" />
                ) : (
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                    {s.value}
                  </h3>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bento Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue chart (takes up 2 columns) */}
        <Card className="xl:col-span-2 flex flex-col p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Performa Penjualan</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Ikhtisar pendapatan dalam 7 hari terakhir
              </p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2"
            >
              LIHAT DETAIL
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          <div className="flex-1 w-full min-h-[300px] relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/20">
                <CircleNotch size={32} className="animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={data?.chart ?? []}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={15}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmt(v).replace('Rp', '').trim()}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={4}
                    fill="url(#revenueGrad)"
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#1e293b', fill: '#f97316' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Side Actions & Top Menu (1 column) */}
        <div className="space-y-8 flex flex-col">
          {/* Quick Actions */}
          <Card className="p-8">
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">Akses Cepat</h2>
            <div className="grid grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="group flex flex-col gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-300 active:scale-95"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                      a.color,
                      a.hoverGrad
                    )}
                  >
                    {a.icon}
                  </div>
                  <p className="text-sm font-bold text-slate-900 tracking-tight">
                    {a.label}
                  </p>
                </Link>
              ))}
            </div>
          </Card>

          {/* Top Products */}
          <Card className="p-0 overflow-hidden flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Best Sellers</h2>
              <ShoppingCart size={20} weight="duotone" className="text-slate-300" />
            </div>
            
            <div className="p-4 flex-1">
                {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-100 rounded-md w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded-md w-1/3" />
                        </div>
                    </div>
                    ))}
                </div>
                ) : !data?.top_products?.length ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Sparkle size={32} className="text-slate-200" weight="duotone" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 px-6">
                        Data produk terlaris akan muncul di sini.
                    </p>
                </div>
                ) : (
                <div className="space-y-2">
                    {data.top_products.slice(0, 4).map((item, idx) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                    >
                        <div className="relative flex-shrink-0">
                        {item.image_url ? (
                            <img
                            src={item.image_url}
                            className="w-12 h-12 rounded-xl object-cover shadow-sm ring-2 ring-slate-100"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <ImageBroken size={24} weight="duotone" />
                            </div>
                        )}
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black ring-2 ring-white">
                            {idx + 1}
                        </div>
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate tracking-tight uppercase tracking-tight">
                            {item.name}
                        </p>
                        <p className="text-xs font-bold text-slate-400">
                            <span className="text-primary">{item.total_qty}</span> terjual
                        </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">
                        {fmt(item.total_revenue, currency).replace('Rp', '').trim()}
                        </p>
                    </div>
                    ))}
                </div>
                )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
