import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Clock,
  CaretRight,
  ArrowsClockwise,
  CaretLeft,
  MagnifyingGlass,
  Warning,
  Receipt,
  MapPin,
} from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  getOrders,
  STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
  type PaginatedOrders,
} from '@/services/orderService'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Tab definitions ─────────────────────────────────────

const TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Proses', value: 'confirmed' },
  { label: 'Dapur', value: 'cooking' },
  { label: 'Siap', value: 'ready' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Batal', value: 'cancelled' },
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
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Order card ───────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  let badgeVariant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted' = 'muted'

  switch (order.status) {
    case 'pending': badgeVariant = 'warning'; break
    case 'confirmed': badgeVariant = 'info'; break
    case 'cooking': badgeVariant = 'primary'; break
    case 'ready': badgeVariant = 'success'; break
    case 'completed': badgeVariant = 'success'; break
    case 'cancelled': badgeVariant = 'danger'; break
  }

  return (
    <Card
      animated
      className="p-0 overflow-hidden group hover:ring-2 hover:ring-accent/15 transition-all border-rule"
    >
      <Link
        to={`/orders/${order.id}`}
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
      >
        {/* Visual Identity */}
        <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-lg bg-paper-2 flex items-center justify-center text-ink-2 group-hover:bg-accent group-hover:text-white transition-colors shadow-inner">
                <Receipt size={28} weight="bold" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-extrabold text-ink text-lg tracking-tighter">
                        #{order.order_number}
                    </span>
                    <Badge variant={badgeVariant} className="text-[10px] uppercase font-black">
                        {STATUS_LABELS[order.status]}
                    </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-ink-2">
                    <div className="flex items-center gap-1.5 bg-paper-2 px-2 py-0.5 rounded-md text-ink-2">
                        {order.table ? (
                            <>
                                <MapPin size={12} weight="bold" className="text-accent" />
                                <span>Table {order.table.name}</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={12} weight="bold" className="text-accent" />
                                <span>{ORDER_TYPE_LABELS[order.order_type]}</span>
                            </>
                        )}
                    </div>
                    {order.customer_name && (
                        <span className="truncate max-w-[120px]">{order.customer_name}</span>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {timeAgo(order.created_at)}
                    </span>
                </div>
            </div>
        </div>

        {/* Pricing & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-4 pl-0 sm:pl-4 border-t sm:border-t-0 border-rule pt-4 sm:pt-0">
            <div className="text-right">
                <p className="text-xs font-medium text-ink-2 uppercase tracking-widest mb-1">Bill Amount</p>
                <p className="text-md font-black text-ink tracking-tighter">
                {formatCurrency(order.total)}
                </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-paper-2 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <CaretRight size={20} weight="bold" />
            </div>
        </div>
      </Link>
    </Card>
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
    <div className="w-full max-w-6xl mx-auto space-y-8 selection:bg-accent/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <Badge variant="primary" className="mb-2">Real-time Orders</Badge>
           <h1 className="text-xl font-black text-ink tracking-tighter">Manage Orders</h1>
           <p className="text-sm font-medium text-ink-2 mt-1">
             Track and manage all transactions across your restaurant.
           </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetch}
          disabled={loading}
          className="bg-surface border-rule"
        >
          <ArrowsClockwise
            size={18}
            className={loading ? 'animate-spin text-accent' : ''}
          />
          Sync Now
        </Button>
      </div>

      {/* Boutique Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-shrink-0 px-5 py-3 rounded-lg text-xs font-black transition-colors uppercase tracking-widest ring-1',
                isActive
                  ? 'bg-accent text-white border-transparent ring-accent'
                  : 'bg-surface border-transparent ring-rule text-ink-2 hover:text-ink hover:bg-paper-2'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="w-full relative space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-light border border-danger/10 text-danger text-sm font-bold">
            <Warning size={20} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        {loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-ink-2/40">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-accent opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em]">Synchronizing...</span>
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6 bg-surface/50 backdrop-blur rounded-xl border border-rule border-dashed">
            <div className="w-24 h-24 bg-paper-2 rounded-full flex items-center justify-center mb-6">
              <MagnifyingGlass size={48} weight="bold" className="text-ink-2/40" />
            </div>
            <p className="text-md font-black text-ink tracking-tight">
              No orders found
            </p>
            <p className="text-sm font-medium text-ink-2 mt-2 max-w-sm">
              We couldn't find any orders matching this status. Stay tuned for new customer activity!
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between p-5 bg-surface rounded-lg border border-rule mt-10">
            <p className="text-xs font-black text-ink-2 uppercase tracking-widest">
              Showing <span className="text-ink">{(meta.current_page - 1) * meta.per_page + 1}&ndash;{Math.min(meta.current_page * meta.per_page, meta.total)}</span> of <span className="text-ink">{meta.total}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page === 1 || loading}
                className="w-12 h-12 rounded-lg flex items-center justify-center bg-paper-2 text-ink-2 hover:bg-ink hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page === meta.last_page || loading}
                className="w-12 h-12 rounded-lg flex items-center justify-center bg-paper-2 text-ink-2 hover:bg-ink hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
