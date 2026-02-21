import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Printer,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
} from "lucide-react";
import { getOrder, type Order } from "@/services/orderService";
import {
  processPayment,
  getMidtransSnapToken,
  METHOD_LABELS,
  type PaymentMethod,
} from "@/services/paymentService";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ─── Method button ────────────────────────────────────────

interface MethodOption {
  method: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    method: "cash",
    label: "Tunai",
    icon: <Banknote size={20} />,
    desc: "Hitung kembalian otomatis",
  },
  {
    method: "qris",
    label: "QRIS",
    icon: <Smartphone size={20} />,
    desc: "GoPay, OVO, Dana, dll",
  },
  {
    method: "debit_card",
    label: "Kartu Debit",
    icon: <CreditCard size={20} />,
    desc: "Visa / Mastercard debit",
  },
  {
    method: "credit_card",
    label: "Kartu Kredit",
    icon: <CreditCard size={20} />,
    desc: "Visa / Mastercard credit",
  },
  {
    method: "transfer",
    label: "Transfer Bank",
    icon: <Building2 size={20} />,
    desc: "BCA, Mandiri, BRI, dll",
  },
];

// ─── Quick cash buttons ───────────────────────────────────

function quickAmounts(total: number): number[] {
  const ceil = Math.ceil(total / 1000) * 1000;
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
    .slice(0, 5);
}

// ─── Success overlay ──────────────────────────────────────

function SuccessOverlay({
  order,
  changeAmount,
  onPrint,
  onDone,
}: {
  order: Order;
  changeAmount: number;
  onPrint: () => void;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Pembayaran Berhasil!
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          {order.order_number} telah lunas
        </p>

        {changeAmount > 0 && (
          <div className="bg-green-50 rounded-xl p-4 mb-5 text-left">
            <div className="text-xs text-gray-500">Kembalian</div>
            <div className="text-2xl font-bold text-green-600">
              {formatIDR(changeAmount)}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition"
          >
            <Printer size={15} /> Invoice
          </button>
          <button
            onClick={onDone}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");

  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);

  const [snapLoading, setSnapLoading] = useState(false);
  const snapScriptRef = useRef<HTMLScriptElement | null>(null);

  // Load order
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(Number(id))
      .then((o) => {
        if (o.payment_status === "paid") {
          navigate(`/orders/${id}/invoice`, { replace: true });
          return;
        }
        setOrder(o);
      })
      .catch(() => setError("Pesanan tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Derive change amount live
  useEffect(() => {
    if (!order) return;
    const cash =
      parseFloat(cashInput.replace(/\./g, "").replace(",", ".")) || 0;
    setChangeAmount(Math.max(0, cash - Number(order.total)));
  }, [cashInput, order]);

  // ── Handle Midtrans Snap ──────────────────────────────

  async function handleQris() {
    if (!order) return;
    setSnapLoading(true);
    setProcessError(null);
    try {
      const { snap_token, client_key, snap_url } = await getMidtransSnapToken(
        order.id,
      );

      // Dynamically load snap.js if not yet loaded
      if (!snapScriptRef.current) {
        const script = document.createElement("script");
        script.src = snap_url;
        script.setAttribute("data-client-key", client_key);
        document.body.appendChild(script);
        snapScriptRef.current = script;
        await new Promise((resolve) => (script.onload = resolve));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).snap.pay(snap_token, {
        onSuccess: async (_result: unknown) => {
          // Re-fetch order to confirm paid status
          const updated = await getOrder(order.id);
          setPaidOrder(updated);
          setChangeAmount(0);
          setSuccess(true);
        },
        onPending: () => {
          setProcessError(
            "Pembayaran masih menunggu konfirmasi dari Midtrans.",
          );
        },
        onError: () => {
          setProcessError("Pembayaran gagal. Coba lagi.");
        },
        onClose: () => {
          // User closed the popup — no action
        },
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal membuka QRIS. Coba lagi.";
      setProcessError(msg);
    } finally {
      setSnapLoading(false);
    }
  }

  // ── Handle direct payment (cash / card / transfer) ────

  async function handlePay() {
    if (!order) return;
    setProcessing(true);
    setProcessError(null);

    const cashValue =
      method === "cash"
        ? parseFloat(cashInput.replace(/\./g, "").replace(",", ".")) || 0
        : Number(order.total);

    try {
      const updatedOrder = await processPayment({
        order_id: order.id,
        method,
        amount: cashValue,
        transaction_ref: txRef || undefined,
        notes: notes || undefined,
      });
      setPaidOrder(updatedOrder);
      setChangeAmount(
        method === "cash" ? Math.max(0, cashValue - Number(order.total)) : 0,
      );
      setSuccess(true);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal memproses pembayaran.";
      setProcessError(msg);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Memuat pesanan…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-500 mb-3">
          {error ?? "Tidak ditemukan."}
        </p>
        <Link
          to="/orders"
          className="text-sm text-orange-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Kembali ke pesanan
        </Link>
      </div>
    );
  }

  const total = Number(order.total);
  const isQris = method === "qris";
  const isNonCash = ["debit_card", "credit_card", "transfer"].includes(method);
  const cashValue =
    parseFloat(cashInput.replace(/\./g, "").replace(",", ".")) || 0;
  const cashInsufficient =
    method === "cash" && cashValue < total && cashInput !== "";

  return (
    <>
      {/* ── Success overlay ── */}
      {success && paidOrder && (
        <SuccessOverlay
          order={paidOrder}
          changeAmount={changeAmount}
          onPrint={() => navigate(`/orders/${paidOrder.id}/invoice`)}
          onDone={() => navigate("/orders")}
        />
      )}

      <div className="max-w-2xl">
        {/* Back */}
        <Link
          to={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
        >
          <ArrowLeft size={15} /> Detail Pesanan
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Proses Pembayaran
        </h1>

        {/* Order summary */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Ringkasan Pesanan
            </span>
          </div>
          <div className="px-5 py-4 space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.menu_item_name}{" "}
                  <span className="text-gray-400">×{item.quantity}</span>
                </span>
                <span className="text-gray-900 font-medium">
                  {formatIDR(Number(item.subtotal))}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatIDR(Number(order.subtotal))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>−{formatIDR(Number(order.discount_amount))}</span>
              </div>
            )}
            {Number(order.tax_amount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Pajak</span>
                <span>{formatIDR(Number(order.tax_amount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-orange-600">{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Metode Pembayaran
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.method}
                onClick={() => setMethod(opt.method)}
                className={cn(
                  "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 transition text-left",
                  method === opt.method
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                )}
              >
                <span
                  className={cn(
                    "text-lg mb-0.5",
                    method === opt.method ? "text-orange-500" : "text-gray-500",
                  )}
                >
                  {opt.icon}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    method === opt.method ? "text-orange-700" : "text-gray-800",
                  )}
                >
                  {opt.label}
                </span>
                <span className="text-[11px] text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === "cash" && (
          <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Jumlah Uang Diterima
              </span>
            </div>
            <div className="p-5">
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={formatNumber(total)}
                  value={cashInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setCashInput(raw ? formatNumber(Number(raw)) : "");
                  }}
                  className={cn(
                    "w-full border rounded-xl pl-10 pr-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 transition",
                    cashInsufficient
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-orange-200",
                  )}
                />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quickAmounts(total).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashInput(formatNumber(amt))}
                    className="px-3 py-1.5 text-sm rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition font-medium"
                  >
                    {formatIDR(amt)}
                  </button>
                ))}
              </div>

              {/* Change */}
              {cashInput && !cashInsufficient && (
                <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kembalian</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatIDR(changeAmount)}
                  </span>
                </div>
              )}
              {cashInsufficient && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={14} />
                  Uang kurang {formatIDR(total - cashValue)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction ref for non-cash */}
        {isNonCash && (
          <div className="bg-white rounded-xl border border-gray-200 mb-4 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nomor Referensi Transaksi{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="Contoh: TRX20260221-001"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 mb-5 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Catatan{" "}
            <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan untuk pembayaran ini…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
          />
        </div>

        {/* Error */}
        {processError && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {processError}
          </div>
        )}

        {/* Action button */}
        {isQris ? (
          <button
            onClick={handleQris}
            disabled={snapLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2"
          >
            {snapLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memuat QRIS…
              </>
            ) : (
              <>
                <Smartphone size={18} /> Bayar dengan QRIS — {formatIDR(total)}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handlePay}
            disabled={
              processing ||
              (method === "cash" && (cashInsufficient || !cashInput))
            }
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memproses…
              </>
            ) : (
              <>
                Konfirmasi Pembayaran {METHOD_LABELS[method]} —{" "}
                {formatIDR(total)}
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}
