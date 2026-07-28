import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
    CircleNotch, ArrowsClockwise, SealCheck, Clock, XCircle, 
    CreditCard, Money, QrCode, Bank, Wallet,
    Funnel, MagnifyingGlass, CalendarBlank,
    CaretLeft, CaretRight, FileText, Fingerprint
} from "@phosphor-icons/react";
import {
  getPaymentHistory,
  METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from "@/services/paymentService";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    cash: { label: 'Cash', icon: Money, color: 'text-green-600 bg-green-50' },
    qris: { label: 'QRIS', icon: QrCode, color: 'text-blue-600 bg-blue-50' },
    debit_card: { label: 'Debit', icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
    credit_card: { label: 'Credit', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    transfer: { label: 'Bank', icon: Bank, color: 'text-amber-600 bg-amber-50' },
};

const STATUS_CONFIG: Record<PaymentStatus, { icon: any; variant: any }> = {
  paid: { icon: SealCheck, variant: 'success' },
  pending: { icon: Clock, variant: 'warning' },
  failed: { icon: XCircle, variant: 'danger' },
  refunded: { icon: Wheelchair, variant: 'muted' },
};

// Fallback for missing icon
function Wheelchair(props: any) { return <XCircle {...props} /> }

const METHODS_LIST: { value: PaymentMethod | ""; label: string }[] = [
  { value: "", label: "Method" },
  { value: "cash", label: "Cash" },
  { value: "qris", label: "QRIS" },
  { value: "debit_card", label: "Debit" },
  { value: "credit_card", label: "Credit" },
  { value: "transfer", label: "Transfer" },
];

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "">("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "">("");
  const [filterDate, setFilterDate] = useState("");

  async function load(pg = 1) {
    setLoading(true);
    try {
      const res = await getPaymentHistory({
        page: pg,
        per_page: 20,
        method: filterMethod || undefined,
        status: filterStatus || undefined,
        date: filterDate || undefined,
      });
      setPayments(res.data);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [filterMethod, filterStatus, filterDate]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Financial Records</Badge>
           <h1 className="text-4xl font-semibold text-ink tracking-tighter">Transaction Vault</h1>
           <p className="text-sm font-medium text-ink-2 mt-1">
             Track every payment and verify settlement status.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-surface border border-rule-light rounded-lg text-sm font-bold text-ink hidden md:flex items-center gap-2">
            <span className="text-accent font-semibold">{total}</span> Payments Managed
          </div>
           <button
                onClick={() => load(page)}
                disabled={loading}
                className="w-12 h-12 bg-surface border border-rule-light rounded-lg flex items-center justify-center text-ink-2 hover:text-accent"
            >
                <ArrowsClockwise size={20} weight="bold" className={cn(loading && "animate-spin")} />
            </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-4">
           {/* Method Filter */}
           <div className="relative min-w-[160px]">
                <Wallet size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" />
                <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value as PaymentMethod | "")}
                    className="w-full h-12 pl-12 pr-10 bg-surface border border-rule-light rounded-lg text-sm font-semibold text-ink appearance-none focus:ring-4 focus:ring-accent/15 uppercase tracking-widest cursor-pointer"
                >
                    {METHODS_LIST.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
           </div>

           {/* Status Filter */}
           <div className="relative min-w-[160px]">
                <Funnel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | "")}
                    className="w-full h-12 pl-12 pr-10 bg-surface border border-rule-light rounded-lg text-sm font-semibold text-ink appearance-none focus:ring-4 focus:ring-accent/15 uppercase tracking-widest cursor-pointer"
                >
                    <option value="">Status</option>
                    <option value="paid">Settled</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                </select>
           </div>

           {/* Date Filter */}
           <div className="relative min-w-[160px]">
                <CalendarBlank size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" />
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-surface border border-rule-light rounded-lg text-sm font-semibold text-ink-2 focus:ring-4 focus:ring-accent/15 cursor-pointer outline-none"
                />
           </div>

           {(filterMethod || filterStatus || filterDate) && (
             <Button 
                onClick={() => {
                   setFilterMethod("");
                   setFilterStatus("");
                   setFilterDate("");
                }}
                variant="secondary" 
                className="h-12 rounded-lg px-6 text-[10px] font-semibold uppercase tracking-widest"
             >
                Reset Filters
             </Button>
           )}
      </div>

      {/* Main Table Content */}
      <Card className="p-0 border-rule-light overflow-hidden">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-ink-2">
                <ArrowsClockwise size={48} className="animate-spin mb-4 text-accent opacity-20" />
                <span className="font-semibold text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Ledger...</span>
            </div>
        ) : payments.length === 0 ? (
             <div className="text-center py-40 flex flex-col items-center">
                <div className="w-20 h-20 bg-paper-2 rounded-lg flex items-center justify-center text-slate-200 mb-4">
                    <FileText size={40} weight="bold" />
                </div>
                <p className="font-semibold text-md text-ink tracking-tighter">No Transactions Found</p>
                <p className="text-xs font-medium text-ink-2 mt-1 max-w-[240px]">We couldn't find any financial records matching your filters.</p>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                 <tr className="bg-paper-2/50 text-left border-b border-rule-light">
                  <th className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em]">Transaction / Order</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em]">Settlement</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em]">Amount (IDR)</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em]">Reference</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-[0.2em]">Time Period</th>
                  <th className="px-8 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {payments.map((pmt) => {
                  const Method = METHOD_CONFIG[pmt.method] || { label: pmt.method, icon: Money, color: 'bg-paper-2' };
                  const Status = STATUS_CONFIG[pmt.status] || { icon: Clock, variant: 'muted' };
                  const MIcon = Method.icon;
                  const SIcon = Status.icon;

                  return (
                    <tr key={pmt.id} className="group hover:bg-paper-2/50">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-lg bg-surface border border-rule-light flex flex-col items-center justify-center text-ink-2 group-hover:bg-slate-900 group-hover:text-white">
                                 <Fingerprint size={20} weight="bold" />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-ink tracking-tighter truncate group-hover:text-accent">
                                    {pmt.order?.order_number ?? `#${pmt.order_id}`}
                                </span>
                                <Badge variant="muted" className={cn("mt-1 py-0 px-2 text-[8px] font-semibold w-fit uppercase", Method.color)}>
                                    <MIcon size={10} weight="bold" className="mr-1" /> {Method.label}
                                </Badge>
                             </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                          <Badge variant={Status.variant} className="py-1 px-3 font-semibold text-[9px] uppercase tracking-widest border-none">
                              <SIcon size={12} weight="bold" className="mr-1.5" />
                              {pmt.status}
                          </Badge>
                      </td>
                      <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-ink tracking-tighter">{formatIDR(Number(pmt.amount))}</span>
                            {Number(pmt.change_amount) > 0 && (
                                <span className="text-[10px] font-bold text-ink-2">Change: {formatIDR(Number(pmt.change_amount))}</span>
                            )}
                          </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-ink-2">
                          {pmt.cashier?.name ? (
                              <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-paper-2 flex items-center justify-center text-[10px] font-semibold text-ink">
                                      {pmt.cashier.name[0]}
                                  </div>
                                  <span>{pmt.cashier.name}</span>
                              </div>
                          ) : "—"}
                      </td>
                      <td className="px-8 py-5 text-[10px] font-semibold text-ink-2 uppercase tracking-tight">
                        {pmt.paid_at ? formatDateTime(pmt.paid_at) : "—"}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          to={`/orders/${pmt.order_id}/invoice`}
                          className="w-10 h-10 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2 hover:text-accent hover:border-accent/20"
                        >
                          <FileText size={18} weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {lastPage > 1 && (
          <div className="px-8 py-6 bg-paper-2/50 border-t border-rule-light flex items-center justify-between">
            <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest">
              Page <span className="text-ink font-semibold">{page}</span> of <span className="text-ink font-semibold">{lastPage}</span>
            </span>
            <div className="flex gap-3">
               <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="w-12 h-12 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2 hover:text-accent disabled:opacity-30"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= lastPage}
                   className="w-12 h-12 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2 hover:text-accent disabled:opacity-30"
                >
                  <CaretRight size={20} weight="bold" />
                </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}