import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  Printer,
  Money,
  CreditCard,
  DeviceMobile,
  Buildings,
  WarningCircle,
  QrCode,
  HandCoins,
  Receipt,
  ArrowRight,
  Calculator,
  ShieldCheck,
  CreditCard as BankTransfer,
  ArrowsClockwise,
  ListChecks,
  CaretRight
} from '@phosphor-icons/react'
import { getOrder, type Order } from '@/services/orderService'
import {
  processPayment,
  getMidtransSnapToken,
  METHOD_LABELS,
  type PaymentMethod,
} from '@/services/paymentService'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('id-ID').format(n)
}

interface MethodOption {
  method: PaymentMethod
  label: string
  icon: any
  desc: string
  color: string
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    method: 'cash',
    label: 'Physical Cash',
    icon: HandCoins,
    desc: 'Auto kembalian calc',
    color: 'emerald'
  },
  {
    method: 'qris',
    label: 'QRIS Scan',
    icon: QrCode,
    desc: 'GoPay, OVO, Dana...',
    color: 'blue'
  },
  {
    method: 'debit_card',
    label: 'Debit Card',
    icon: BankTransfer,
    desc: 'Visa / Mastercard',
    color: 'violet'
  },
  {
    method: 'transfer',
    label: 'Bank Transfer',
    icon: Buildings,
    desc: 'Internal GL transfer',
    color: 'amber'
  },
]

function quickAmounts(total: number): number[] {
  const ceil = Math.ceil(total / 1000) * 1000
  return [
    ceil,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000,
    200000,
  ]
    .filter((v) => v >= total)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5)
}

function SuccessOverlay({
  order,
  changeAmount,
  onPrint,
  onDone,
}: {
  order: Order
  changeAmount: number
  onPrint: () => void
  onDone: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90  flex items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center p-10 bg-surface border-transparent shadow-[0_0_100px_rgba(34,197,94,0.3)]">
        <div className="flex items-center justify-center w-24 h-24 rounded-lg bg-success-light text-success mx-auto mb-8 ">
          <ShieldCheck size={48} weight="bold" />
        </div>
        <h2 className="text-xl font-semibold text-ink tracking-tighter mb-2">Settlement Complete</h2>
        <p className="text-ink-2 font-bold text-sm mb-8 uppercase tracking-widest">{order.order_number} PAID</p>

        {changeAmount > 0 && (
          <div className="bg-slate-900 rounded-xl p-6 mb-8 text-center border-t-4 border-success">
            <div className="text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em] mb-2">Change to Return</div>
            <div className="text-xl font-semibold text-white tracking-tighter">{formatIDR(changeAmount)}</div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onPrint}
            className="w-full h-14 rounded-lg bg-accent shadow-primary/20 font-semibold uppercase tracking-widest text-[10px]"
          >
            <Printer size={20} weight="bold" className="mr-2" /> Print Thermal Invoice
          </Button>
          <Button variant="secondary" onClick={onDone} className="w-full h-14 rounded-lg border-rule-light text-ink font-semibold uppercase tracking-widest text-[10px]">
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashInput, setCashInput] = useState('')
  const [txRef, setTxRef] = useState('')
  const [notes, setNotes] = useState('')

  const [processing, setProcessing] = useState(false)
  const [snapLoading, setSnapLoading] = useState(false)
  const [_processError, setProcessError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [paidOrder, setPaidOrder] = useState<Order | null>(null)
  const [changeAmount, setChangeAmount] = useState(0)

  const snapScriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getOrder(Number(id))
      .then((o) => {
        if (o.payment_status === 'paid') {
          navigate(`/orders/${id}/invoice`, { replace: true })
          return
        }
        setOrder(o)
      })
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (!order) return
    const cash = parseFloat(cashInput.replace(/\./g, '').replace(',', '.')) || 0
    setChangeAmount(Math.max(0, cash - Number(order.total)))
  }, [cashInput, order])

  async function handleQris() {
    if (!order) return
    setSnapLoading(true)
    setProcessError(null)
    try {
      const { snap_token, client_key, snap_url } = await getMidtransSnapToken(order.id)

      if (!snapScriptRef.current) {
        const script = document.createElement('script')
        script.src = snap_url
        script.setAttribute('data-client-key', client_key)
        document.body.appendChild(script)
        snapScriptRef.current = script
        await new Promise((resolve) => (script.onload = resolve))
      }

      ;(window as any).snap.pay(snap_token, {
        onSuccess: async (_result: any) => {
          const updated = await getOrder(order.id)
          setPaidOrder(updated)
          setChangeAmount(0)
          setSuccess(true)
        },
        onPending: () => {
          Toast.fire({ icon: 'info', title: 'Payment Pending', text: 'Waiting for network confirmation.' })
        },
        onError: () => {
          Toast.fire({ icon: 'error', title: 'Payment Failed', text: 'Transaction was rejected.' })
        },
      })
    } catch (e: any) {
      setProcessError(e.response?.data?.message || 'Failed to initialize QRIS.')
    } finally {
      setSnapLoading(false)
    }
  }

  async function handlePay() {
    if (!order) return
    setProcessing(true)
    setProcessError(null)

    const cashValue =
      method === 'cash'
        ? parseFloat(cashInput.replace(/\./g, '').replace(',', '.')) || 0
        : Number(order.total)

    try {
      const updatedOrder = await processPayment({
        order_id: order.id,
        method,
        amount: cashValue,
        transaction_ref: txRef || undefined,
        notes: notes || undefined,
      })
      setPaidOrder(updatedOrder)
      setChangeAmount(method === 'cash' ? Math.max(0, cashValue - Number(order.total)) : 0)
      setSuccess(true)
    } catch (e: any) {
      setProcessError(e.response?.data?.message || 'Failed to settle.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-accent opacity-20" />
            <span className="font-semibold text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Payment API...</span>
        </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-danger/5 text-danger rounded-lg flex items-center justify-center mx-auto mb-6">
            <WarningCircle size={40} weight="bold" />
        </div>
        <h2 className="text-lg font-semibold text-ink tracking-tighter mb-2">Order Missing</h2>
        <Button onClick={() => navigate('/orders')} variant="secondary" className="rounded-lg px-8">
            <ArrowLeft size={16} className="mr-2" /> Back to History
        </Button>
      </div>
    )
  }

  const total = Number(order.total)
  const isQris = method === 'qris'
  const isNonCash = ['debit_card', 'credit_card', 'transfer'].includes(method)
  const cashValue = parseFloat(cashInput.replace(/\./g, '').replace(',', '.')) || 0
  const cashInsufficient = method === 'cash' && cashValue < total && cashInput !== ''

  return (
    <>
      {success && paidOrder && (
        <SuccessOverlay
          order={paidOrder}
          changeAmount={changeAmount}
          onPrint={() => navigate(`/orders/${paidOrder.id}/invoice`)}
          onDone={() => navigate('/orders')}
        />
      )}

      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
                <Link
                    to={`/orders/${order.id}`}
                    className="group flex items-center gap-2 text-[10px] font-semibold text-ink-2 uppercase tracking-widest hover:text-accent transition-colors"
                >
                    <ArrowLeft size={14} weight="bold" className="transition-transform group-hover:-translate-x-1" />
                    Back to Order Detail
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                        <Money size={32} weight="bold" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-semibold text-ink tracking-tighter">Register Checkout</h1>
                        <p className="text-xs font-bold text-ink-2 uppercase tracking-widest mt-1">Order Transaction: {order.order_number}</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-lg text-white flex flex-col items-center sm:items-end relative overflow-hidden ">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform">
                    <ShieldCheck size={120} weight="bold" />
                 </div>
                 <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-[0.3em] mb-1 relative z-10">Grand Balance Due</span>
                 <span className="text-4xl font-semibold text-white tracking-tighter relative z-10">{formatIDR(total)}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
                 <Card className="p-8 border-rule-light">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent">
                            <ListChecks size={20} weight="bold" />
                        </div>
                        <h2 className="text-md font-semibold text-ink tracking-tighter">Settlement Method</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {METHOD_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const active = method === opt.method;
                            return (
                                <button
                                    key={opt.method}
                                    onClick={() => setMethod(opt.method)}
                                    className={cn(
                                        "relative flex flex-col items-start p-6 rounded-lg border-2 transition-all group overflow-hidden",
                                        active 
                                            ? "bg-slate-900 border-slate-900 text-white scale-[1.02]"
                                            : "bg-surface border-rule-light text-ink-2 hover:border-accent/20 hover:bg-paper-2"
                                    )}
                                >
                                    <Icon size={28} weight={active ? "fill" : "bold"} className={cn("mb-6 transition-colors", active ? "text-accent" : "text-slate-300")} />
                                    <span className="text-xs font-semibold uppercase tracking-widest mb-1">{opt.label}</span>
                                    <span className={cn("text-[9px] font-bold opacity-50 text-left leading-tight", active ? "text-slate-400" : "text-ink-2")}>{opt.desc}</span>
                                    
                                    {active && (
                                        <div className="absolute -bottom-2 -right-2">
                                            <CheckCircle size={40} weight="bold" className="text-accent/10" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {method === 'cash' && (
                        <div className="mt-10 p-8 bg-paper-2 rounded-lg border border-rule space-y-8">
                             <div className="flex flex-col sm:flex-row items-center gap-8">
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em] mb-3 pl-1">Amount Rendered (IDR)</label>
                                    <div className="relative group">
                                         <Calculator size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors" />
                                         <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={formatNumber(total)}
                                            value={cashInput}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9]/g, '')
                                                setCashInput(raw ? formatNumber(Number(raw)) : '')
                                            }}
                                            className={cn(
                                                "w-full h-20 pl-16 pr-8 bg-surface rounded-lg text-xl font-semibold text-ink border-2 transition-all outline-none tracking-tighter",
                                                cashInsufficient ? "border-danger ring-4 ring-danger/10" : "border-rule-light focus:border-accent focus:ring-4 focus:ring-accent/15"
                                            )}
                                         />
                                    </div>
                                    {cashInsufficient && (
                                        <p className="mt-3 text-xs font-semibold text-danger uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                                            <WarningCircle size={16} weight="bold" />
                                            Balance Shortfall: {formatIDR(total - cashValue)}
                                        </p>
                                    )}
                                </div>

                                <div className={cn(
                                    "w-full sm:w-64 h-24 rounded-lg flex flex-col items-center justify-center p-6 border-2 transition-all",
                                    cashInput && !cashInsufficient ? "bg-success border-success text-white shadow-success/20" : "bg-surface border-rule-light text-slate-300"
                                )}>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Kembalian</span>
                                    <span className="text-lg font-semibold tracking-tighter truncate w-full text-center">
                                        {formatIDR(changeAmount)}
                                    </span>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest pl-1 text-center sm:text-left">Quick Tenders</p>
                                <div className="flex flex-wrap gap-3">
                                    {quickAmounts(total).map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setCashInput(formatNumber(amt))}
                                            className="px-6 py-3 bg-surface border border-rule rounded-lg text-[11px] font-semibold text-ink-2 hover:border-accent hover:text-accent transition-all"
                                        >
                                            {formatIDR(amt)}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}

                    {isNonCash && (
                        <div className="mt-10 p-8 bg-paper-2 rounded-lg border border-rule grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-3 pl-1">Reference ID (Optional)</label>
                                <Input
                                    value={txRef}
                                    onChange={(e) => setTxRef(e.target.value)}
                                    placeholder="Enter Auth / TRX Code"
                                    className="h-14 font-semibold rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-3 pl-1">Merchant Notes</label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Payment specifics..."
                                    className="h-14 font-semibold rounded-lg"
                                />
                            </div>
                        </div>
                    )}
                 </Card>

                 <div className="flex justify-end pt-4">
                    {isQris ? (
                        <Button
                            onClick={handleQris}
                            disabled={snapLoading}
                            className="w-full sm:w-auto h-20 px-16 rounded-lg bg-accent text-md font-semibold tracking-tighter  group "
                        >
                            {snapLoading ? <CircleNotch size={32} className="animate-spin" /> : (
                                <div className="flex items-center gap-4">
                                    <QrCode size={32} weight="bold" />
                                    <span>ACTIVATE QR SCAN</span>
                                    <ArrowRight size={24} weight="bold" className="ml-2 group-hover:translate-x-2 transition-transform" />
                                </div>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePay}
                            disabled={processing || (method === 'cash' && (cashInsufficient || !cashInput))}
                            className="w-full h-20 rounded-lg bg-accent text-md font-semibold tracking-tighter  group "
                        >
                             {processing ? <CircleNotch size={32} className="animate-spin" /> : (
                                <div className="flex items-center gap-4">
                                    <ShieldCheck size={32} weight="bold" />
                                    <span>POST SETTLEMENT — {formatIDR(total)}</span>
                                    <ArrowRight size={24} weight="bold" className="ml-2 group-hover:translate-x-2 transition-transform" />
                                </div>
                            )}
                        </Button>
                    )}
                 </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
                 <Card className="p-8 border-rule-light h-fit bg-paper-2/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                        <Receipt size={100} weight="bold" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-rule-light">
                            <div className="w-10 h-10 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2">
                                <Receipt size={20} weight="bold" />
                            </div>
                            <h3 className="text-sm font-semibold text-ink tracking-widest uppercase">Cart Insight</h3>
                        </div>

                        <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                             {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-ink leading-tight mb-0.5">{item.menu_item_name}</p>
                                        <p className="text-[10px] font-bold text-ink-2 uppercase tracking-widest">{item.quantity} × {formatIDR(Number(item.price_snapshot))}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-ink tracking-tighter whitespace-nowrap">{formatIDR(Number(item.subtotal))}</span>
                                </div>
                             ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-rule-light space-y-4 font-bold text-xs uppercase tracking-widest">
                             <div className="flex justify-between text-ink-2">
                                <span>Subtotal</span>
                                <span>{formatIDR(Number(order.subtotal))}</span>
                             </div>
                             {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-accent">
                                    <span>Discount</span>
                                    <span>−{formatIDR(Number(order.discount_amount))}</span>
                                </div>
                             )}
                             {Number(order.tax_amount) > 0 && (
                                <div className="flex justify-between text-ink-2">
                                    <span>Tax / VAT</span>
                                    <span>{formatIDR(Number(order.tax_amount))}</span>
                                </div>
                             )}
                             <div className="pt-4 flex justify-between items-center text-ink border-t border-rule-light">
                                <span className="text-[10px] font-semibold">Final Total</span>
                                <span className="text-md font-semibold tracking-tighter">{formatIDR(total)}</span>
                             </div>
                        </div>
                    </div>
                 </Card>

                 <div className="p-8 bg-slate-900 rounded-lg flex items-center gap-4 text-white">
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent">
                        <ShieldCheck size={24} weight="bold" />
                     </div>
                     <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-2">Secure Ledger</p>
                        <p className="text-xs font-bold leading-tight">Every transaction is encrypted and logged in real-time.</p>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </>
  )
}
