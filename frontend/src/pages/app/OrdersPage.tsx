import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Clock,
  CaretRight,
  ArrowsClockwise,
  CaretLeft,
  MagnifyingGlass,
  ArrowRight,
  Warning,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import {
  getOrders,
  STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
  type PaginatedOrders,
} from '@/services/orderService'
import { cn } from '@/lib/utils'

// ─── Tab definitions ─────────────────────────────────────

const TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Dikonfirmasi', value: 'confirmed' },
  { label: 'Dimasak', value: 'cooking' },
  { label: 'Siap', value: 'ready' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

// ─── Utils ───────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}d lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Order card ───────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  // Vibrant custom color pill for each status to replace default gray
  let statusGradient = ''
  switch (order.status) {
    case 'pending':
      statusGradient = 'bg-amber-100 text-amber-700 bg-opacity-70'
      break
    case 'confirmed':
      statusGradient = 'bg-blue-100 text-blue-700 bg-opacity-70'
      break
    case 'cooking':
      statusGradient = 'bg-indigo-100 text-indigo-700 bg-opacity-70'
      break
    case 'ready':
      statusGradient = 'bg-teal-100 text-teal-700 bg-opacity-70'
      break
    case 'completed':
      statusGradient = 'bg-emerald-100 text-emerald-700 bg-opacity-70 text-bold'
      break
    case 'cancelled':
      statusGradient = 'bg-red-100 text-red-700 bg-opacity-70'
      break
    default:
      statusGradient = 'bg-gray-100 text-gray-700'
  }

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-premium-hover transition-all duration-300 group hover:-translate-y-0.5"
    >
      {/* Icon with Soft Glow */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
        <ShoppingCart size={22} weight="duotone" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-extrabold text-gray-900 text-base tracking-tight">
            {order.order_number}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              statusGradient
            )}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-400">
          <span className="text-gray-600 font-semibold">
            {order.table ? `Meja ${order.table.name}` : ORDER_TYPE_LABELS[order.order_type]}
          </span>
          {order.customer_name ? ` · ${order.customer_name}` : ''}
          {order.items?.length ? ` · ${order.items.length} item` : ''}
        </p>
      </div>

      {/* Right side */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-gray-900 tracking-tight">
          {formatCurrency(order.total)}
        </p>
        <p className="text-[11px] font-bold text-gray-400 flex items-center justify-end gap-1 mt-1">
          <Clock size={12} weight="bold" />
          {timeAgo(order.created_at)}
        </p>
      </div>

      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
        <ArrowRight
          size={14}
          weight="bold"
          className="text-gray-400 group-hover:text-orange-500 transition-colors"
        />
      </div>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [result, setResult] = useState<PaginatedOrders | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        per_page: 20,
        page,
      })
      setResult(data)
    } catch {
      setError('Gagal memuat pesanan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  useEffect(() => {
    fetch()
  }, [fetch])

  const orders = result?.data ?? []
  const meta = result?.meta

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pesanan</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Pantau dan kelola seluruh transaksi masuk secara realtime
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetch}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm font-bold bg-white border-gray-200 shadow-sm hover:bg-gray-50 rounded-xl px-4 py-2.5"
        >
          <ArrowsClockwise
            size={16}
            weight="bold"
            className={loading ? 'animate-spin text-orange-500' : 'text-gray-500'}
          />
          Segarkan Data
        </Button>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/20 translate-y-[-1px]'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="w-full relative">
        {error && (
          <div className="flex items-center gap-3 px-5 py-4 text-sm text-red-600 bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl mb-4 shadow-sm">
            <Warning size={20} weight="duotone" className="text-red-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white/40 backdrop-blur rounded-3xl border border-gray-100 border-dashed">
            <ArrowsClockwise size={32} className="animate-spin mb-3 text-orange-500" />
            <span className="font-bold tracking-wide">Sinkronisasi Data Pesanan...</span>
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6 bg-white/50 backdrop-blur rounded-3xl border border-gray-100 border-dashed shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlass size={36} weight="duotone" className="text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 tracking-tight">
              Belum ada pesanan masuk
            </p>
            <p className="text-sm font-medium text-gray-400 mt-1 max-w-sm">
              Daftar transaksi untuk status ini masih kosong. Silahkan periksa tab lain atau tunggu
              pesanan pelanggan.
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination Modernized */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              Menampilkan{' '}
              <span className="text-gray-900">
                {(meta.current_page - 1) * meta.per_page + 1}–
                {Math.min(meta.current_page * meta.per_page, meta.total)}
              </span>{' '}
              dari <span className="text-gray-900">{meta.total}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page === 1 || loading}
                className="w-10 h-10 p-0 rounded-xl flex items-center justify-center bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200"
              >
                <CaretLeft size={16} weight="bold" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page === meta.last_page || loading}
                className="w-10 h-10 p-0 rounded-xl flex items-center justify-center bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200 text-orange-500"
              >
                <CaretRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
