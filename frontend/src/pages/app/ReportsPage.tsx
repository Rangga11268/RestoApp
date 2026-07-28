import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  CircleNotch,
  TrendUp,
  ShoppingCart,
  ChartBar,
  Users,
  ImageBroken,
  FileXls,
  FileText,
  Calendar,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import {
  getSalesReport,
  getTopProducts,
  getStaffPerformance,
  exportReportExcel,
  exportReportPdf,
  type SalesData,
  type TopProduct,
  type StaffStat,
} from '@/services/reportService'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ─── Sub-components ───────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { dataKey: string; value: number; color: string }[]
  label?: string
  currency?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95  border border-white/10 rounded-lg px-5 py-4 text-xs space-y-3 min-w-[180px]">
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <Calendar size={14} weight="bold" className="text-accent" />
        <p className="font-semibold text-white tracking-tight">{label}</p>
      </div>
      <div className="space-y-2">
          {payload.map((p, idx) => (
            <div key={p.dataKey ?? idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                 <span className="text-ink-2 font-bold uppercase tracking-widest text-[9px]">
                    {p.dataKey === 'revenue' ? 'Revenue' : 'Orders'}
                 </span>
              </div>
              <span className="text-white font-semibold">
                {p.dataKey === 'revenue' ? fmt(p.value, currency) : `${p.value}`}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuthStore()
  const currency =
    (user as { restaurant?: { currency?: string } } | null)?.restaurant?.currency ?? 'IDR'

  // Filters
  const [from, setFrom] = useState(daysAgo(29))
  const [to, setTo] = useState(today())
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day')
  const [topLimit, setTopLimit] = useState(10)
  const [topSort, setTopSort] = useState<'qty' | 'revenue'>('revenue')

  // Data
  const [sales, setSales] = useState<SalesData | null>(null)
  const [products, setProducts] = useState<TopProduct[]>([])
  const [staff, setStaff] = useState<StaffStat[]>([])
  const [loadingSales, setLoadingSales] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type)
    const params = {
      from,
      to,
      group_by: groupBy,
      limit: topLimit,
      sort_by: topSort,
    }
    try {
      if (type === 'excel') await exportReportExcel(params)
      else await exportReportPdf(params)
    } catch {
      // silently ignore
    } finally {
      setExporting(null)
    }
  }

  useEffect(() => {
    setLoadingSales(true)
    setLoadingStaff(true)
    Promise.all([
      getSalesReport({ from, to, group_by: groupBy }),
      getStaffPerformance({ from, to }),
    ])
      .then(([s, st]) => {
        setSales(s)
        setStaff(st)
      })
      .catch(() => {})
      .finally(() => {
        setLoadingSales(false)
        setLoadingStaff(false)
      })
  }, [from, to, groupBy])

  useEffect(() => {
    setLoadingProducts(true)
    getTopProducts({ from, to, limit: topLimit, sort_by: topSort })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [from, to, topLimit, topSort])

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: loadingSales ? '—' : fmt(sales?.summary.total_revenue ?? 0, currency),
      icon: <TrendUp size={20} weight="bold" />,
      color: 'bg-accent-light text-accent',
      border: 'border-primary/20',
    },
    {
      label: 'Order Volume',
      value: loadingSales ? '—' : String(sales?.summary.total_transactions ?? 0),
      icon: <ShoppingCart size={20} weight="bold" />,
      color: 'bg-success-light text-success',
      border: 'border-success/20',
    },
    {
      label: 'Daily Average',
      value: loadingSales ? '—' : fmt(sales?.summary.avg_per_day ?? 0, currency),
      icon: <ChartBar size={20} weight="bold" />,
      color: 'bg-amber-100 text-amber-900',
      border: 'border-amber-200/50',
    },
    {
      label: 'Active Staff',
      value: loadingStaff ? '—' : String(staff.length),
      icon: <Users size={20} weight="bold" />,
      color: 'bg-violet-50 text-violet-600',
      border: 'border-violet-100',
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 selection:bg-accent/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Performance Center</Badge>
           <h1 className="text-4xl font-semibold text-ink tracking-tighter">Analytics Reports</h1>
           <p className="text-sm font-medium text-ink-2 mt-1">Deep insights into your restaurant's financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            variant="secondary"
            className="rounded-lg bg-surface border-rule-light"
          >
            {exporting === 'excel' ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <FileXls size={18} weight="bold" className="text-emerald-500" />
            )}
            Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            variant="secondary"
            className="rounded-lg bg-surface border-rule-light"
          >
            {exporting === 'pdf' ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <FileText size={18} weight="bold" className="text-red-500" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-6 overflow-visible border-rule-light">
        <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-1.5 min-w-[160px]">
                <label className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest pl-1">Date Range</label>
                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="h-10 text-xs font-bold"
                    />
                    <span className="text-ink-2">to</span>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="h-10 text-xs font-bold"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest pl-1">Grouping</label>
                <div className="flex bg-paper-2 p-1.5 rounded-lg border border-rule-light">
                    {(['day', 'month'] as const).map((g) => (
                    <button
                        key={g}
                        onClick={() => setGroupBy(g)}
                        className={cn(
                            "px-6 py-1.5 text-xs font-semibold rounded-lg uppercase tracking-widest",
                            groupBy === g
                                ? "bg-surface text-ink"
                                : "text-ink-2 hover:text-ink"
                        )}
                    >
                        {g === 'day' ? 'Daily' : 'Monthly'}
                    </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 ml-auto">
                {[
                    { label: '7D', from: daysAgo(6) },
                    { label: '30D', from: daysAgo(29) },
                    { label: '90D', from: daysAgo(89) },
                ].map((p) => (
                    <button
                        key={p.label}
                        onClick={() => {
                            setFrom(p.from)
                            setTo(today())
                        }}
                        className="text-[10px] font-semibold px-4 h-10 rounded-lg bg-paper-2 text-ink-2 border border-rule-light hover:bg-slate-900 hover:text-white hover:border-slate-900 uppercase tracking-widest"
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
      </Card>

      {/* Summary Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((s) => (
          <Card
            key={s.label}
            className="relative overflow-hidden group border-rule-light"
          >
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", s.color)}>
              {s.icon}
            </div>
            {loadingSales ? (
              <div className="h-8 bg-paper-2 rounded-lg animate-pulse w-32 mb-2" />
            ) : (
              <p className="text-lg font-semibold text-ink tracking-tighter leading-none mb-1">{s.value}</p>
            )}
            <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Box */}
      <Card className="p-8 border-rule-light">
        <div className="flex items-center justify-between mb-10">
            <div>
                 <h2 className="text-md font-semibold text-ink tracking-tighter">
                    Revenue Trend
                </h2>
                <p className="text-xs font-medium text-ink-2 mt-1">
                    Visualizing {groupBy === 'day' ? 'daily' : 'monthly'} sales performance.
                </p>
            </div>
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                 <TrendUp size={24} weight="bold" className="text-accent" />
            </div>
        </div>

        <div className="w-full h-[320px]">
            {loadingSales ? (
            <div className="flex flex-col items-center justify-center h-full text-ink-2">
                <CircleNotch size={40} className="animate-spin mb-4 text-accent opacity-20" />
                <span className="font-semibold text-xs uppercase tracking-[0.2em]">Crafting Graph...</span>
            </div>
            ) : !sales?.chart?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 border-2 border-dashed border-rule-light rounded-lg">
                <Calendar size={48} weight="bold" className="mb-4 opacity-20" />
                <span className="text-sm font-bold text-ink-2">No data for selected range</span>
            </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales.chart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c4542f" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#c4542f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" stroke="#f1f5f9" vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    interval={groupBy === 'month' ? 0 : 'preserveStartEnd'}
                />
                <YAxis
                    yAxisId="rev"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v) =>
                    v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}k`
                        : String(v)
                    }
                />
                <YAxis
                    yAxisId="ord"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c4542f"
                    strokeWidth={4}
                    fill="url(#revGrad)"
                    dot={{ fill: '#c4542f', r: 5, strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }}
                />
                <Area
                    yAxisId="ord"
                    type="monotone"
                    dataKey="transactions"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#ordGrad)"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
                />
                </AreaChart>
            </ResponsiveContainer>
            )}
        </div>
      </Card>

      {/* Top Products & Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top products */}
        <Card className="p-0 overflow-hidden border-rule-light flex flex-col">
          <div className="px-8 py-6 border-b border-rule flex items-center justify-between">
            <div>
                 <h2 className="text-md font-semibold text-ink tracking-tighter">Best Sellers</h2>
                 <p className="text-[10px] font-bold text-ink-2 uppercase tracking-widest mt-1">By {topSort === 'revenue' ? 'Revenue' : 'Sales Qty'}</p>
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={topSort}
                    onChange={(e) => setTopSort(e.target.value as 'qty' | 'revenue')}
                    className="h-9 text-[10px] font-semibold uppercase tracking-widest border border-rule-light rounded-lg px-3 bg-paper-2 focus:outline-none"
                >
                    <option value="revenue">Revenue</option>
                    <option value="qty">Quantity</option>
                </select>
                <select
                    value={topLimit}
                    onChange={(e) => setTopLimit(Number(e.target.value))}
                    className="h-9 text-[10px] font-semibold uppercase tracking-widest border border-rule-light rounded-lg px-3 bg-paper-2 focus:outline-none"
                >
                    {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>Top {n}</option>
                    ))}
                </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px] custom-scrollbar">
            {loadingProducts ? (
                <div className="p-8 space-y-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-paper-2 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-paper-2 rounded w-1/2" />
                        <div className="h-2 bg-paper-2 rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-paper-2 rounded w-20" />
                    </div>
                ))}
                </div>
            ) : !products.length ? (
                <div className="p-20 text-center text-sm font-bold text-ink-2">No data found</div>
            ) : (
                <div className="divide-y divide-rule">
                {products.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-4 px-8 py-5 hover:bg-paper-2/50 group">
                    <span className="text-xs font-semibold text-slate-200 w-6 group-hover:text-accent">
                        {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="relative">
                         {item.image_url ? (
                            <img
                            src={item.image_url}
                            loading="lazy"
                            className="w-12 h-12 rounded-lg object-cover border border-white"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-paper-2 flex items-center justify-center text-slate-300">
                                <ImageBroken size={20} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-ink-2 uppercase tracking-widest">{item.total_qty} Items Sold</p>
                    </div>
                    <p className="text-sm font-semibold text-ink tracking-tighter">
                        {fmt(item.total_revenue, currency)}
                    </p>
                    </div>
                ))}
                </div>
            )}
          </div>
        </Card>

        {/* Staff performance */}
        <Card className="p-0 overflow-hidden border-rule-light flex flex-col">
          <div className="px-8 py-6 border-b border-rule">
            <h2 className="text-md font-semibold text-ink tracking-tighter">Team Performance</h2>
            <p className="text-[10px] font-bold text-ink-2 uppercase tracking-widest mt-1">Commission & Sales Data</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px] custom-scrollbar">
            {loadingStaff ? (
                <div className="p-8 space-y-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-paper-2 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-paper-2 rounded w-1/2" />
                        <div className="h-2 bg-paper-2 rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-paper-2 rounded w-16" />
                    </div>
                ))}
                </div>
            ) : !staff.length ? (
                <div className="p-20 text-center text-sm font-bold text-ink-2">No staff activity</div>
            ) : (
                <div className="divide-y divide-rule text-slate-100">
                {staff.map((s) => {
                    const initials = s.cashier_name
                    .split(' ')
                    .slice(0, 2)
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase()
                    return (
                        <div key={s.cashier_id} className="flex items-center gap-4 px-8 py-5 hover:bg-paper-2/50">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-semibold  border-white">
                            {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink truncate tracking-tight">{s.cashier_name}</p>
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{s.total_orders} Orders</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-ink tracking-tighter">
                                    {fmt(s.total_revenue, currency)}
                                </p>
                            </div>
                        </div>
                    )
                })}
                </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}