import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
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
    label: 'Tambah Kategori',
    desc: 'Kelola kategori menu',
    icon: <Tag size={22} weight="duotone" />,
    href: '/menu/categories',
    color: 'bg-indigo-50 text-indigo-500',
    hoverGrad: 'group-hover:bg-gradient-to-br from-indigo-500 to-indigo-600 group-hover:text-white',
  },
  {
    label: 'Tambah Menu',
    desc: 'Item menu baru',
    icon: <ForkKnife size={22} weight="duotone" />,
    href: '/menu/items',
    color: 'bg-orange-50 text-orange-500',
    hoverGrad: 'group-hover:bg-gradient-to-br from-orange-500 to-orange-600 group-hover:text-white',
  },
  {
    label: 'Kelola Meja',
    desc: 'Atur meja & QR',
    icon: <Armchair size={22} weight="duotone" />,
    href: '/tables',
    color: 'bg-cyan-50 text-cyan-500',
    hoverGrad: 'group-hover:bg-gradient-to-br from-cyan-500 to-cyan-600 group-hover:text-white',
  },
  {
    label: 'Laporan',
    desc: 'Sales & produk',
    icon: <ChartBar size={22} weight="duotone" />,
    href: '/reports',
    color: 'bg-emerald-50 text-emerald-500',
    hoverGrad:
      'group-hover:bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:text-white',
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
    <div className="bg-white/90 backdrop-blur-md border border-gray-100/50 rounded-2xl shadow-xl px-4 py-3 text-xs w-40">
      <p className="font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-black text-lg tracking-tight">
        {fmt(payload[0]?.value ?? 0)}
      </p>
    </div>
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
      icon: <TrendUp size={24} weight="duotone" className="opacity-80" />,
      gradient: 'from-green-500 to-emerald-400',
      shadow: 'shadow-green-500/20',
    },
    {
      label: 'Pesanan Hari Ini',
      value: loading ? '—' : String(data?.today.order_count ?? 0),
      icon: <ShoppingCart size={24} weight="duotone" className="opacity-80" />,
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
    },
    {
      label: 'Pesanan Pending',
      value: loading ? '—' : String(data?.today.pending_orders ?? 0),
      icon: <Clock size={24} weight="duotone" className="opacity-80" />,
      gradient: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/20',
    },
    {
      label: 'Menu Aktif',
      value: loading ? '—' : String(data?.today.active_menus ?? 0),
      icon: <ForkKnife size={24} weight="duotone" className="opacity-80" />,
      gradient: 'from-rose-500 to-pink-400',
      shadow: 'shadow-rose-500/20',
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header section with gradient flair */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {greeting()},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
              {user?.name?.split(' ')[0]}
            </span>{' '}
            👋
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            {user?.restaurant?.name ? `${user.restaurant.name} — ` : ''}
            Berikut adalah ringkasan aktivitas restoranmu hari ini.
          </p>
        </div>

        {user?.subscription && (
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
              isTrialing && daysLeft <= 3
                ? 'bg-red-50 text-red-600 border border-red-100'
                : isTrialing
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-white text-gray-700 border border-gray-100 shadow-premium'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isTrialing && daysLeft <= 3
                  ? 'bg-red-500 animate-pulse'
                  : isTrialing
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-green-500'
              }`}
            />
            {isTrialing
              ? daysLeft <= 3
                ? `⚠ Trial berakhir ${daysLeft} hari lagi`
                : `Trial — ${daysLeft} hari tersisa`
              : `Paket ${user.subscription.plan.toUpperCase()} Aktif`}
          </div>
        )}
      </div>

      {/* Modern Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden bg-white rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 border border-gray-100/50 shadow-premium-hover`}
          >
            {/* Soft background glow */}
            <div
              className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl`}
            />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {s.label}
                </p>
                {loading ? (
                  <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-24" />
                ) : (
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                    {s.value}
                  </h3>
                )}
              </div>
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg ${s.shadow}`}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Top Products section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Revenue chart (takes up 2 columns) */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 lg:p-8 border border-gray-100/50 shadow-premium-hover flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tren Pendapatan</h2>
              <p className="text-xs font-medium text-gray-400 mt-1">
                7 Hari Terakhir (Pembayaran Lunas)
              </p>
            </div>
            <Link
              to="/reports"
              className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors group"
            >
              Laporan Detail
              <ArrowRight
                size={16}
                weight="bold"
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="flex-1 w-full min-h-[220px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-200">
                <CircleNotch size={32} className="animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={data?.chart ?? []}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradCore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}jt`
                        : v >= 1_000
                          ? `${(v / 1_000).toFixed(0)}k`
                          : String(v)
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={4}
                    fill="url(#revenueGradCore)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Action Panel (1 column) */}
        <div className="space-y-6 lg:space-y-8 flex flex-col">
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100/50 shadow-premium-hover">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="group flex flex-col gap-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-transparent hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                      a.color,
                      a.hoverGrad
                    )}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 tracking-tight leading-tight">
                      {a.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top 5 list */}
          <div className="bg-white rounded-3xl border border-gray-100/50 shadow-premium-hover flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Menu Terlaris</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded-md w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.top_products?.length ? (
              <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <ForkKnife size={28} className="text-gray-300" weight="duotone" />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  Belum ada pesanan lunas hari ini.
                </p>
              </div>
            ) : (
              <div className="p-3">
                {data.top_products.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-sm border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-300">
                          <ImageBroken size={20} weight="duotone" />
                        </div>
                      )}
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-gray-400">
                        <span className="text-orange-500">{item.total_qty}</span> porsi
                      </p>
                    </div>
                    <p className="text-sm font-black text-gray-900 flex-shrink-0 tracking-tight">
                      {fmt(item.total_revenue, currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
