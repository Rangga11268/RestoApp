import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
    ArrowLeft, Printer, CircleNotch, 
    ShareNetwork, DownloadSimple, CheckCircle, 
    WarningCircle, ShieldCheck, Receipt,
    ArrowsClockwise,
    IdentificationBadge,
    CalendarBlank,
    MapPin,
    PhoneCall,
    CaretRight,
    Clock,
    Money,
    QrCode
} from '@phosphor-icons/react'
import { getOrder, ORDER_TYPE_LABELS, type Order } from '@/services/orderService'
import { METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/services/paymentService'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { confirmAct, Toast } from '@/lib/swal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

// ─── Helpers ─────────────────────────────────────────────

function formatIDR(n: number) {
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

// ─── Invoice Content (Print Optimized) ─────────────

function InvoiceContent({ order }: { order: Order }) {
  const payment = order.payment

  return (
    <div id="invoice-print-area" className="bg-white max-w-sm mx-auto font-mono text-[11px] leading-tight text-slate-900 border-2 border-dashed border-slate-100 p-8 shadow-2xl rounded-[32px] sm:border-none sm:shadow-none sm:p-0">
      {/* Brand Header */}
      <div className="text-center pb-6 mb-6 border-b border-dashed border-slate-200">
        <h1 className="text-xl font-black tracking-tighter uppercase mb-1">
          {order.restaurant?.name ?? 'RestoApp'}
        </h1>
        {order.restaurant?.address && (
          <p className="text-[10px] text-slate-400 font-bold mb-1">{order.restaurant.address}</p>
        )}
        {order.restaurant?.phone && (
          <p className="text-[10px] text-slate-400 font-bold">T: {order.restaurant.phone}</p>
        )}
      </div>

      {/* Transaction Details */}
      <div className="mb-6 space-y-1.5 font-bold uppercase tracking-tight">
        <div className="flex justify-between">
          <span className="text-slate-400">Order ID:</span>
          <span>{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Date:</span>
          <span>{formatDateTime(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Service:</span>
          <span>{ORDER_TYPE_LABELS[order.order_type]}</span>
        </div>
        {order.table && (
          <div className="flex justify-between">
            <span className="text-slate-400">Table:</span>
            <span>{order.table.name}</span>
          </div>
        )}
        {order.customer_name && (
          <div className="flex justify-between">
            <span className="text-slate-400">Patron:</span>
            <span>{order.customer_name}</span>
          </div>
        )}
      </div>

      {/* Itemized List */}
      <div className="mb-6">
        <div className="border-y border-dashed border-slate-200 py-2 mb-3 font-black text-slate-400 uppercase tracking-widest text-[9px] flex justify-between">
            <span>Description</span>
            <span>Amount</span>
        </div>
        <div className="space-y-3">
            {order.items?.map((item) => (
                <div key={item.id}>
                    <div className="flex justify-between font-black text-slate-900">
                        <span className="flex-1 pr-4">{item.menu_item_name}</span>
                        <span>{formatIDR(Number(item.subtotal))}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] font-bold mt-0.5">
                        {item.quantity} × {formatIDR(Number(item.price_snapshot))}
                        {item.notes && <span className="ml-2 italic text-primary">({item.notes})</span>}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="space-y-2 mb-6 border-t border-dashed border-slate-200 pt-4 font-bold">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{formatIDR(Number(order.subtotal))}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-primary">
            <span>Discount Applied</span>
            <span>−{formatIDR(Number(order.discount_amount))}</span>
          </div>
        )}
        {Number(order.tax_amount) > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>VAT / Taxes</span>
            <span>{formatIDR(Number(order.tax_amount))}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-lg text-slate-900 pt-2 mt-2 border-t-2 border-slate-900">
          <span>TOTAL</span>
          <span>{formatIDR(Number(order.total))}</span>
        </div>
      </div>

      {/* Payment Settlement */}
      {payment && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 font-bold mb-6">
            <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Settled Via</span>
                <span className="uppercase text-[10px]">{METHOD_LABELS[payment.method]}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Amount Tendered</span>
                <span className="text-slate-900">{formatIDR(Number(payment.amount))}</span>
            </div>
            {Number(payment.change_amount) > 0 && (
                <div className="flex justify-between text-primary font-black">
                    <span className="uppercase text-[9px]">Change Returned</span>
                    <span>{formatIDR(Number(payment.change_amount))}</span>
                </div>
            )}
            {payment.paid_at && (
                <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 text-[9px] text-slate-400">
                    <span>Payment Time</span>
                    <span>{formatDateTime(payment.paid_at)}</span>
                </div>
            )}
        </div>
      )}

      {/* Proof of Transaction Footer */}
      <div className="text-center pt-4 opacity-50 space-y-1">
        <p className="font-black uppercase tracking-widest text-[9px]">Thank you for dining with us!</p>
        <p className="text-[10px] font-bold">Support: help@restoapp.com</p>
      </div>

      {/* QR Code Placeholder for digital verification */}
      <div className="mt-6 flex flex-col items-center opacity-10">
           <div className="w-16 h-16 border-2 border-slate-900 rounded-lg p-1">
                <div className="w-full h-full bg-slate-900 rounded-sm" />
           </div>
           <span className="text-[7px] font-black mt-1">RESTOAPP VERIFIED</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getOrder(Number(id))
      .then(setOrder)
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }, [id])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Generating Invoice...</span>
        </div>
    )
  }

  if (error || !order) {
    return (
        <div className="max-w-3xl mx-auto py-20 text-center">
          <div className="w-20 h-20 bg-danger/5 text-danger rounded-[28px] flex items-center justify-center mx-auto mb-6">
              <WarningCircle size={40} weight="duotone" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Invoice Missing</h2>
          <Button onClick={() => navigate('/orders')} variant="secondary" className="rounded-2xl px-8">
              <ArrowLeft size={16} className="mr-2" /> Back to History
          </Button>
        </div>
      )
  }

  return (
    <>
      <style>{`
        @media print {
          header, nav, .no-print { display: none !important; }
          body { background: white !important; }
          #invoice-print-area {
            position: absolute;
            left: 0; top: 0;
            width: 80mm;
            padding: 4mm;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl mx-auto space-y-8 animate-in pb-20">
        {/* Navigation / Actions Layer */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex items-center justify-center w-12 h-12 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                     <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Digital Receipt</h1>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.order_number}</p>
                </div>
           </div>

           <div className="flex items-center gap-3">
                {order.payment_status !== 'paid' && (
                    <Button
                        onClick={() => navigate(`/orders/${order.id}/payment`)}
                        className="h-12 px-6 rounded-2xl bg-amber-500 shadow-amber-500/20"
                    >
                        COMPLETE PAYMENT
                    </Button>
                )}
                <Button
                    variant="secondary"
                    onClick={handlePrint}
                    className="h-12 px-6 rounded-2xl border-slate-100 bg-white"
                >
                    <Printer size={18} weight="bold" className="mr-2" /> PRINT 80MM
                </Button>
                 <button className="flex items-center justify-center w-12 h-12 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
                    <ShareNetwork size={20} weight="bold" />
                </button>
           </div>
        </div>

        {/* Status Overlay */}
        <div className="no-print">
            <Badge 
                variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                className="py-2 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-none shadow-sm"
            >
                {order.payment_status === 'paid' ? <CheckCircle size={14} weight="bold" className="mr-2" /> : <Clock size={14} weight="bold" className="mr-2" />}
                {order.payment_status === 'paid' ? 'SETTLED & VERIFIED' : 'PENDING PAYMENT'}
            </Badge>
        </div>

        {/* Multi-Column Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* The actual Invoice Paper */}
            <div className="lg:col-span-6 flex flex-col items-center">
                 <InvoiceContent order={order} />
            </div>

            {/* Merchant Insight Section (No Print) */}
            <div className="lg:col-span-6 no-print space-y-8">
                 <Card className="p-8 border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                            <IdentificationBadge size={20} weight="duotone" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase">Audit Logs</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-xs font-black">
                                {order.cashier?.name?.[0] || 'A'}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Handled By</p>
                                <p className="text-sm font-black text-slate-900">{order.cashier?.name || 'System Auto'}</p>
                             </div>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-[28px] text-white">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Settlement Method</span>
                                <Badge variant="glass" className="text-white border-white/20 uppercase tracking-tight text-[9px]">Confirmed</Badge>
                             </div>
                             <div className="flex items-center gap-4">
                                {order.payment?.method === 'cash' ? <Money size={32} weight="duotone" className="text-success" /> : <QrCode size={32} weight="duotone" className="text-primary" />}
                                <div>
                                    <p className="text-lg font-black tracking-tight leading-none uppercase">{order.payment?.method || 'NONE'}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Ref: {order.payment?.transaction_ref || 'INTERNAL'}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                 </Card>

                 {/* Refund Logic (Owner Only) */}
                 {user?.role === 'owner' && order.payment_status === 'paid' && order.payment && (
                    <div className="p-8 bg-danger/5 rounded-[32px] border border-danger/10 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-danger shadow-sm">
                            <WarningCircle size={24} weight="bold" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">High Risk Action</h4>
                            <p className="text-[11px] font-bold text-slate-400">Performing a refund will revert all ledger entries and void the transaction permanently.</p>
                        </div>
                        <button
                            onClick={async () => {
                                const result = await confirmAct(
                                'Perform full refund for this order?',
                                'Yes, Refund'
                                )
                                if (!result.isConfirmed) return

                                try {
                                const { refundPayment } = await import('@/services/paymentService')
                                await refundPayment(order.payment!.id)
                                Toast.fire({ icon: 'success', title: 'Refund Completed' })
                                const updated = await getOrder(order.id)
                                setOrder(updated)
                                } catch {
                                Toast.fire({ icon: 'error', title: 'Refund failed to sync.' })
                                }
                            }}
                            className="w-full h-12 rounded-2xl border-2 border-danger text-danger font-black uppercase tracking-widest text-[10px] hover:bg-danger hover:text-white transition-all shadow-lg shadow-danger/5"
                        >
                            Authorize Total Refund
                        </button>
                    </div>
                 )}
            </div>
        </div>
      </div>
    </>
  )
}
