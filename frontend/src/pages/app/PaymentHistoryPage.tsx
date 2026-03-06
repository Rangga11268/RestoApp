import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleNotch, ArrowsClockwise, SealCheck, Clock, XCircle } from "@phosphor-icons/react";
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

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_ICON: Record<PaymentStatus, React.ReactNode> = {
  paid: <SealCheck size={14} className="text-green-500" />,
  pending: <Clock size={14} className="text-yellow-500" />,
  failed: <XCircle size={14} className="text-red-500" />,
  refunded: <XCircle size={14} className="text-gray-400" />,
};

const METHODS: { value: PaymentMethod | ""; label: string }[] = [
  { value: "", label: "Semua Metode" },
  { value: "cash", label: "Tunai" },
  { value: "qris", label: "QRIS" },
  { value: "debit_card", label: "Kartu Debit" },
  { value: "credit_card", label: "Kartu Kredit" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMethod, filterStatus, filterDate]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Riwayat Pembayaran
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} transaksi total
          </p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 bg-white transition"
        >
          <ArrowsClockwise size={14} className={cn(loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={filterMethod}
          onChange={(e) =>
            setFilterMethod(e.target.value as PaymentMethod | "")
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as PaymentStatus | "")
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="pending">Menunggu</option>
          <option value="refunded">Direfund</option>
          <option value="failed">Gagal</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />

        {(filterMethod || filterStatus || filterDate) && (
          <button
            onClick={() => {
              setFilterMethod("");
              setFilterStatus("");
              setFilterDate("");
            }}
            className="text-sm text-orange-600 hover:underline px-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <CircleNotch size={22} className="animate-spin mr-2" /> Memuat…
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          Belum ada riwayat pembayaran.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">No. Order</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Kembalian</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {pmt.order?.order_number ?? `#${pmt.order_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {METHOD_LABELS[pmt.method]}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatIDR(Number(pmt.amount))}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {Number(pmt.change_amount) > 0
                        ? formatIDR(Number(pmt.change_amount))
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          PAYMENT_STATUS_COLORS[pmt.status],
                        )}
                      >
                        {STATUS_ICON[pmt.status]}
                        {PAYMENT_STATUS_LABELS[pmt.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {pmt.cashier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {pmt.paid_at ? formatDateTime(pmt.paid_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${pmt.order_id}/invoice`}
                        className="text-orange-600 hover:underline text-xs font-medium"
                      >
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Halaman {page} dari {lastPage}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  ‹ Prev
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= lastPage}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
