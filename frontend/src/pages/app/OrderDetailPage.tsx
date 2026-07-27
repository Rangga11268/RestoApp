import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  Armchair,
  User,
  Clock,
  CheckCircle,
  XCircle,
  CookingPot,
  BellRinging,
  CircleDashed,
  CircleNotch,
  Money,
  Receipt,
  DotsThreeOutlineVertical,
  Fingerprint,
  CalendarBlank,
  Note,
  Tag,
  ArrowsClockwise,
  WarningCircle,
  HandPointing,
  CaretRight
} from '@phosphor-icons/react'
import {
  getOrder,
  updateOrderStatus,
  cancelOrder,
  STATUS_LABELS,
  STATUS_COLORS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
} from '@/services/orderService'
import { cn } from '@/lib/utils'
import { confirmAct, Toast } from '@/lib/swal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; desc: string }> = {
    pending: { label: 'PENDING', icon: CircleDashed, color: 'text-amber-800 bg-warning-light border-amber-100', desc: 'Waiting for kitchen approval' },
    confirmed: { label: 'CONFIRMED', icon: CheckCircle, color: 'text-blue-500 bg-blue-50 border-blue-100', desc: 'Order accepted' },
    cooking: { label: 'COOKING', icon: CookingPot, color: 'text-orange-500 bg-orange-50 border-orange-100', desc: 'Preparing the meal' },
    ready: { label: 'READY', icon: BellRinging, color: 'text-green-500 bg-green-50 border-green-100', desc: 'Dish is on the counter' },
    completed: { label: 'DONE', icon: ShieldCheck, color: 'text-ink-2 bg-paper-2 border-rule-light', desc: 'Order served & finished' },
    cancelled: { label: 'CANCELLED', icon: XCircle, color: 'text-danger bg-danger/5 border-danger/10', desc: 'Order was rejected' },
}

const NEXT_STATUS_CONFIG: Partial<
  Record<OrderStatus, { label: string; icon: any; color: string }>
> = {
  confirmed: {
    label: 'Approve Order',
    icon: <CheckCircle size={18} weight="bold" />,
    color: 'bg-accent shadow-primary/20 hover:scale-[1.02]',
  },
  cooking: {
    label: 'Send to Kitchen',
    icon: <CookingPot size={18} weight="bold" />,
    color: 'bg-orange-500 shadow-orange-500/20 hover:scale-[1.02]',
  },
  ready: {
    label: 'Mark as Ready',
    icon: <BellRinging size={18} weight="bold" />,
    color: 'bg-green-500 shadow-green-500/20 hover:scale-[1.02]',
  },
  completed: {
    label: 'Finish Order',
    icon: <CheckCircle size={18} weight="bold" />,
    color: 'bg-slate-900 shadow-slate-900/20 hover:scale-[1.02]',
  },
}

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'cooking', 'ready', 'completed']

function StatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-danger bg-danger/5 px-6 py-4 rounded-xl border border-danger/10">
        <XCircle size={24} weight="bold" /> 
        <div className="flex flex-col">
            <span className="font-semibold text-sm uppercase tracking-widest">Order Voided</span>
            <span className="text-[10px] font-bold opacity-70">This transaction was cancelled and cannot be processed.</span>
        </div>
      </div>
    )
  }

  const currentIdx = STEPS.indexOf(status)

  return (
    <div className="relative flex items-center justify-between px-2 sm:px-4 py-2">
      <div className="absolute top-[1.35rem] left-8 right-8 h-[2px] bg-paper-2 z-0" />
      
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const StepIcon = STATUS_CONFIG[step].icon

        return (
          <div key={step} className="relative z-10 flex flex-col items-center group">
            <div
                className={cn(
                  'w-11 h-11 rounded-[20px] flex items-center justify-center transition-all border-4 border-white',
                  done
                    ? 'bg-success text-white'
                    : active
                      ? 'bg-accent text-white scale-110'
                      : 'bg-surface text-slate-300'
                )}
            >
                {done ? <CheckCircle size={20} weight="bold" /> : <StepIcon size={20} weight="bold" />}
            </div>
            <span
                className={cn(
                  'text-[9px] font-semibold mt-3 uppercase tracking-widest transition-colors',
                  done || active ? 'text-ink' : 'text-slate-300'
                )}
            >
                {STATUS_LABELS[step]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getOrder(Number(id))
      .then(setOrder)
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusUpdate(status: OrderStatus) {
    if (!order) return
    setActionLoading(true)
    setActionError(null)
    try {
      const updated = await updateOrderStatus(order.id, status)
      setOrder(updated)
      Toast.fire({ 
          icon: 'success', 
          title: `Order is now ${status.toUpperCase()}`,
          timer: 1500,
          showConfirmButton: false
      })
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Failed to update.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    const result = await confirmAct(
      'Void this order? This action is permanent.',
      'Yes, Void Order'
    )
    if (!result.isConfirmed) return

    setActionLoading(true)
    setActionError(null)
    try {
      await cancelOrder(order!.id)
      Toast.fire({ icon: 'success', title: 'Order Voided' })
      navigate('/orders')
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Failed to void.'
      setActionError(msg)
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-accent opacity-20" />
            <span className="font-semibold text-xs uppercase tracking-[0.2em] animate-pulse">Pulling Receipt...</span>
        </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-danger/5 text-danger rounded-[28px] flex items-center justify-center mx-auto mb-6">
            <WarningCircle size={40} weight="bold" />
        </div>
        <h2 className="text-lg font-semibold text-ink tracking-tighter mb-2">Order Not Found</h2>
        <p className="text-ink-2 font-medium mb-8">The request order ID could not be retrieved from the server.</p>
        <Button onClick={() => navigate('/orders')} variant="secondary" className="rounded-lg px-8">
            <ArrowLeft size={16} className="mr-2" /> Back to History
        </Button>
      </div>
    )
  }

  const nextStatuses = ((): OrderStatus[] => {
    switch (order.status) {
      case 'pending': return ['confirmed', 'cancelled']
      case 'confirmed': return ['cooking', 'cancelled']
      case 'cooking': return ['ready']
      case 'ready': return ['completed']
      default: return []
    }
  })()

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
            <Link
                to="/orders"
                className="group flex items-center gap-2 text-[10px] font-semibold text-ink-2 uppercase tracking-widest hover:text-accent transition-colors"
            >
                <ArrowLeft size={14} weight="bold" className="transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-[28px] bg-slate-900 flex items-center justify-center text-white">
                    <Fingerprint size={32} weight="bold" />
                 </div>
                 <div>
                    <h1 className="text-4xl font-semibold text-ink tracking-tighter">{order.order_number}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="muted" className="bg-paper-2 text-ink-2 border-rule uppercase tracking-widest text-[9px] py-1">
                            {ORDER_TYPE_LABELS[order.order_type]}
                        </Badge>
                        <span className="text-xs font-bold text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 text-ink-2 text-xs font-bold">
                            <CalendarBlank size={14} weight="bold" />
                            {formatDateTime(order.created_at)}
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        <div className="flex items-center gap-6 bg-surface p-6 rounded-[32px] border border-rule-light">
             <div className="text-right">
                <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest block mb-0.5">Order Total</span>
                <span className="text-lg font-semibold text-ink tracking-tighter leading-none">{formatCurrency(order.total)}</span>
             </div>
             <div className="h-10 w-[1px] bg-paper-2" />
             <div>
                <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest block mb-1">Status</span>
                <Badge 
                    className={cn(
                        "py-1.5 px-4 font-semibold border-none text-[10px] uppercase tracking-widest whitespace-nowrap",
                        STATUS_CONFIG[order.status]?.color || "bg-paper-2"
                    )}
                >
                    {order.status}
                </Badge>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
            <Card className="p-8 border-rule-light relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <HandPointing size={120} weight="bold" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent">
                            <CircleDashed size={20} weight="bold" className="animate-spin-slow" />
                        </div>
                        <h2 className="text-md font-semibold text-ink tracking-tighter">Kitchen Workflow</h2>
                    </div>

                    <StatusStepper status={order.status} />

                    {nextStatuses.length > 0 && (
                        <div className="mt-12 p-6 bg-paper-2/50 rounded-[32px] border border-rule-light flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-ink mb-1">Take Action</p>
                                <p className="text-xs font-medium text-ink-2">Move this order to the next phase of preparation.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                 {nextStatuses
                                    .filter((s) => s !== 'cancelled')
                                    .map((s) => {
                                    const cfg = NEXT_STATUS_CONFIG[s]
                                    if (!cfg) return null
                                    return (
                                        <Button
                                            key={s}
                                            onClick={() => handleStatusUpdate(s)}
                                            disabled={actionLoading}
                                            className={cn("flex-1 px-8 rounded-lg h-12 font-semibold uppercase tracking-widest text-[11px]", cfg.color)}
                                        >
                                            {actionLoading ? <CircleNotch size={18} className="animate-spin" /> : (
                                                <div className="flex items-center gap-2">
                                                    {cfg.icon} <span>{cfg.label}</span>
                                                </div>
                                            )}
                                        </Button>
                                    )
                                    })}
                                    {nextStatuses.includes('cancelled') && (
                                        <button 
                                            onClick={handleCancel}
                                            disabled={actionLoading}
                                            className="w-12 h-12 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-slate-300 hover:text-danger hover:border-danger/20 transition-all"
                                        >
                                            <XCircle size={24} weight="bold" />
                                        </button>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="p-0 border-rule-light overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                            <ShoppingCart size={20} weight="bold" />
                        </div>
                        <h2 className="text-md font-semibold text-ink tracking-tighter">Ordered Items</h2>
                    </div>
                    <Badge variant="muted" className="bg-paper-2 text-ink-2 border-none font-semibold uppercase tracking-widest py-1">
                        {order.items?.length || 0} TOTAL ITEMS
                    </Badge>
                </div>

                <div className="divide-y divide-slate-50">
                    {order.items?.map((item) => (
                        <div key={item.id} className="flex items-start gap-6 p-8 group hover:bg-paper-2/50 transition-all">
                             <div className="w-14 h-14 rounded-[22px] bg-slate-900 flex flex-col items-center justify-center text-white flex-shrink-0 transition-transform">
                                <span className="text-[10px] font-semibold opacity-50 leading-none mb-1 uppercase">Qty</span>
                                <span className="text-md font-semibold leading-none">{item.quantity}</span>
                             </div>
                             <div className="flex-1 min-w-0 pt-1">
                                <h4 className="text-sm font-semibold text-ink tracking-tight leading-tight group-hover:text-accent transition-colors">{item.menu_item_name}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink-2">
                                        <Tag size={14} weight="bold" />
                                        {formatCurrency(item.price_snapshot)}
                                    </div>
                                    {item.notes && (
                                        <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold bg-orange-50 px-2.5 py-1 rounded-lg">
                                            <Note size={14} weight="bold" />
                                            {item.notes}
                                        </div>
                                    )}
                                </div>
                             </div>
                             <div className="text-right pt-2">
                                <p className="text-md font-semibold text-ink tracking-tighter">
                                    {formatCurrency(item.subtotal)}
                                </p>
                             </div>
                        </div>
                    ))}
                </div>

                <div className="p-10 bg-slate-900 text-white flex flex-col items-end gap-6 relative overflow-hidden">
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent/20 rounded-full blur-[60px]" />
                    
                    <div className="w-full space-y-4 relative z-10 max-w-xs">
                         <div className="flex justify-between items-center text-ink-2 font-bold text-sm tracking-widest uppercase">
                            <span>Subtotal</span>
                            <span className="text-slate-200">{formatCurrency(order.total + (order.discount_amount || 0) - (order.tax_amount || 0))}</span>
                         </div>
                         {order.discount_amount > 0 && (
                            <div className="flex justify-between items-center text-accent font-bold text-sm tracking-widest uppercase">
                                <span>Discount</span>
                                <span>- {formatCurrency(order.discount_amount)}</span>
                            </div>
                         )}
                         {order.tax_amount > 0 && (
                            <div className="flex justify-between items-center text-ink-2 font-bold text-sm tracking-widest uppercase">
                                <span>VAT / Taxes</span>
                                <span className="text-slate-200">{formatCurrency(order.tax_amount)}</span>
                            </div>
                         )}
                         <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Final Balance</span>
                            <span className="text-xl font-semibold text-white tracking-tighter">{formatCurrency(order.total)}</span>
                         </div>
                    </div>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 border-rule-light bg-paper-2/50 relative group">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2">
                        <Armchair size={20} weight="bold" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink tracking-widest uppercase">Service Context</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <div>
                            <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-0.5">Table Location</p>
                            <p className="text-sm font-semibold text-ink">{order.table?.name || "Floor General"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-ink">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div>
                            <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-0.5">Assigned Staff</p>
                            <p className="text-sm font-semibold">{order.cashier?.name || "Self Service"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div>
                            <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-0.5">Customer Name</p>
                            <p className="text-sm font-semibold">{order.customer_name || "Guest Patron"}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-8 border-rule-light">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center text-success">
                        <Money size={20} weight="bold" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink tracking-widest uppercase">Billing Status</h3>
                </div>

                <div className="p-6 bg-slate-900 rounded-xl text-white mb-6">
                     <p className="text-[10px] font-semibold text-white/30 tracking-[0.2em] uppercase mb-4">Ledger Status</p>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             {order.payment_status === 'paid' ? <CheckCircle size={32} weight="bold" className="text-success" /> : <WarningCircle size={32} weight="bold" className="text-amber-500" />}
                             <span className="text-md font-semibold uppercase tracking-tighter">
                                {order.payment_status === 'paid' ? 'SETTLED' : 'DUE'}
                             </span>
                        </div>
                        <CaretRight size={20} className="text-white/20" />
                     </div>
                </div>

                {order.payment_status === 'unpaid' && order.status !== 'cancelled' ? (
                     <Button 
                        onClick={() => navigate(`/orders/${order.id}/payment`)}
                        className="w-full h-14 rounded-lg bg-success shadow-success/20 hover:scale-[1.02]"
                    >
                        COLLECT PAYMENT <ArrowCircleRight size={20} className="ml-2" />
                    </Button>
                ) : (
                    <Button 
                        onClick={() => navigate(`/orders/${order.id}/invoice`)}
                        variant="secondary"
                        className="w-full h-14 rounded-lg border-rule-light text-ink bg-surface"
                    >
                        PRINT RECEIPT <Receipt size={18} className="ml-2" />
                    </Button>
                )}
            </Card>

            {order.notes && (
                <div className="p-8 bg-warning-light rounded-[32px] border border-amber-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Note size={20} weight="fill" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest">Guest Instructions</span>
                    </div>
                    <p className="text-xs font-bold text-amber-900/70 leading-relaxed">
                        "{order.notes}"
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

function ShieldCheck({ size, className, weight }: any) {
    return <CheckCircle size={size} className={className} weight={weight || "bold"} />
}

function ArrowCircleRight({ size, className }: any) {
    return <ArrowLeft size={size} className={cn("rotate-180", className)} />
}
