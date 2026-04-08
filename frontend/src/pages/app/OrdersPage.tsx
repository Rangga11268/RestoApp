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
  let badgeVariant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'glass' = 'glass'
  
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
      className="p-0 overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all border-slate-100"
    >
      <Link
        to={`/orders/${order.id}`}
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
      >
        {/* Visual Identity */}
        <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/30">
                <Receipt size={28} weight="duotone" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-extrabold text-slate-900 text-lg tracking-tighter">
                        #{order.order_number}
                    </span>
                    <Badge variant={badgeVariant} className="text-[10px] uppercase font-black">
                        {STATUS_LABELS[order.status]}
                    </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                        {order.table ? (
                            <>
                                <MapPin size={12} weight="fill" className="text-primary" />
                                <span>Table {order.table.name}</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={12} weight="fill" className="text-primary" />
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
        <div className="flex items-center justify-between sm:justify-end gap-6 pl-0 sm:pl-4 border-t sm:border-t-0 border-slate-50 pt-4 sm:pt-0">
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bill Amount</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(order.total)}
                </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
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
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in selection:bg-primary/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Real-time Orders</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Manage Orders</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Track and manage all transactions across your restaurant.
           </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetch}
          disabled={loading}
          className="bg-white border-slate-100 shadow-sm"
        >
          <ArrowsClockwise
            size={18}
            className={loading ? 'animate-spin text-primary' : ''}
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
                'flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-widest ring-1',
                isActive
                  ? 'bg-primary text-white border-transparent shadow-xl shadow-primary/20 ring-primary'
                  : 'bg-white border-transparent ring-slate-100 text-slate-400 hover:text-slate-900 hover:ring-slate-300'
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
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-danger/5 border border-danger/10 text-danger text-sm font-bold">
            <Warning size={20} weight="fill" />
            <span>{error}</span>
          </div>
        )}

        {loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Synchronizing...</span>
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6 bg-white/50 backdrop-blur rounded-[40px] border border-slate-100 border-dashed">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MagnifyingGlass size={48} weight="duotone" className="text-slate-200" />
            </div>
            <p className="text-xl font-black text-slate-900 tracking-tight">
              No orders found
            </p>
            <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm">
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
          <div className="flex items-center justify-between p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm mt-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)}</span> of <span className="text-slate-900">{meta.total}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page === 1 || loading}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page === meta.last_page || loading}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
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
