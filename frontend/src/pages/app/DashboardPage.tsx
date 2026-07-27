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
    icon: <Tag size={20} weight="bold" />,
    href: '/menu/categories',
  },
  {
    label: 'Menu',
    desc: 'Item menu baru',
    icon: <ForkKnife size={20} weight="bold" />,
    href: '/menu/items',
  },
  {
    label: 'Meja',
    desc: 'Atur meja & QR',
    icon: <Armchair size={20} weight="bold" />,
    href: '/tables',
  },
  {
    label: 'Laporan',
    desc: 'Sales & produk',
    icon: <ChartBar size={20} weight="bold" />,
    href: '/reports',
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
    <Card className="p-3 min-w-[140px]">
      <p className="font-medium text-ink-2 text-xs mb-0.5">{label}</p>
      <p className="text-ink font-semibold text-md">
        {fmt(payload[0]?.value ?? 0)}
      </p>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const currency =
    (user as { restaurant?: { currency?: string } } | null)?.restaurant?.currency ?? 'IDR'

  useEffect(() => {
    getDashboardReport()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Pendapatan Hari Ini',
      value: loading ? '—' : fmt(data?.today.revenue ?? 0, currency),
      icon: <TrendUp size={22} weight="bold" />,
    },
    {
      label: 'Pesanan Hari Ini',
      value: loading ? '—' : String(data?.today.order_count ?? 0),
      icon: <ShoppingCart size={22} weight="bold" />,
    },
    {
      label: 'Antrean Pending',
      value: loading ? '—' : String(data?.today.pending_orders ?? 0),
      icon: <Clock size={22} weight="bold" />,
    },
    {
      label: 'Menu Aktif',
      value: loading ? '—' : String(data?.today.active_menus ?? 0),
      icon: <ForkKnife size={22} weight="bold" />,
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            {greeting()}, <span className="text-accent">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-ink-2 mt-0.5">
            {user?.restaurant?.name} &middot; {data?.today.order_count ?? 0} pesanan hari ini
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent flex-shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-2">{s.label}</p>
              {loading ? (
                <div className="h-5 bg-paper-2 rounded w-20 mt-0.5 animate-pulse" />
              ) : (
                <p className="text-md font-semibold text-ink">{s.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-md font-semibold text-ink">Performa Penjualan</h2>
              <p className="text-xs text-ink-2 mt-0.5">Pendapatan 7 hari terakhir</p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1"
            >
              Detail
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>

          <div className="w-full min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-[250px] text-ink-2">
                <CircleNotch size={24} className="animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={data?.chart ?? []}
                  margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c4542f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#c4542f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#9e9b93' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9e9b93' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmt(v).replace('Rp', '').trim()}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-rule)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c4542f"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface)', fill: '#c4542f' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-4 flex flex-col">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Akses Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-paper-2 border border-rule hover:bg-accent-light hover:border-accent/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface border border-rule flex items-center justify-center text-accent">
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink">{a.label}</p>
                    <p className="text-[10px] text-ink-2">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-rule flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Best Sellers</h2>
              <ShoppingCart size={16} weight="bold" className="text-ink-2" />
            </div>

            <div className="p-3 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-paper-2 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-paper-2 rounded w-3/4" />
                        <div className="h-2 bg-paper-2 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !data?.top_products?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-ink-2">Belum ada data penjualan.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {data.top_products.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-2 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-paper-2 flex items-center justify-center text-ink-2">
                            <ImageBroken size={18} weight="bold" />
                          </div>
                        )}
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[9px] font-semibold">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                        <p className="text-[10px] text-ink-2">{item.total_qty} terjual</p>
                      </div>
                      <p className="text-xs font-semibold text-ink">
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