import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import {
  getOrder,
  ORDER_TYPE_LABELS,
  type Order,
} from "@/services/orderService";
import {
  METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/services/paymentService";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

// ─── Helpers ─────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Invoice component (also used for print) ─────────────

function InvoiceContent({ order }: { order: Order }) {
  const payment = order.payment;

  return (
    <div
      id="invoice-print-area"
      className="bg-white max-w-md mx-auto font-mono text-sm"
    >
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900 not-italic">
          {order.restaurant?.name ?? "—"}
        </h1>
        {order.restaurant?.address && (
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">
            {order.restaurant.address}
          </p>
        )}
        {order.restaurant?.phone && (
          <p className="text-xs text-gray-500">{order.restaurant.phone}</p>
        )}
      </div>

      {/* Order meta */}
      <div className="mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">No. Order</span>
          <span className="font-semibold">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tanggal</span>
          <span>{formatDateTime(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tipe</span>
          <span>{ORDER_TYPE_LABELS[order.order_type]}</span>
        </div>
        {order.table && (
          <div className="flex justify-between">
            <span className="text-gray-500">Meja</span>
            <span>{order.table.name}</span>
          </div>
        )}
        {order.cashier && (
          <div className="flex justify-between">
            <span className="text-gray-500">Kasir</span>
            <span>{order.cashier.name}</span>
          </div>
        )}
        {order.customer_name && (
          <div className="flex justify-between">
            <span className="text-gray-500">Pelanggan</span>
            <span>{order.customer_name}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-300 mb-3" />

      {/* Items */}
      <div className="mb-3 space-y-2">
        {order.items?.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-800">
                {item.menu_item_name}
              </span>
              <span className="text-gray-800">
                {formatIDR(Number(item.subtotal))}
              </span>
            </div>
            <div className="text-gray-400 text-xs">
              {item.quantity} × {formatIDR(Number(item.price_snapshot))}
              {item.notes && (
                <span className="ml-2 italic">({item.notes})</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-300 mb-3" />

      {/* Totals */}
      <div className="space-y-1 text-xs mb-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatIDR(Number(order.subtotal))}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-green-700">
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
        <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-dashed border-gray-200">
          <span>TOTAL</span>
          <span>{formatIDR(Number(order.total))}</span>
        </div>
      </div>

      {/* Payment info */}
      {payment && (
        <>
          <div className="border-t-2 border-dashed border-gray-300 mb-3" />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Metode</span>
              <span className="font-semibold">
                {METHOD_LABELS[payment.method]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dibayar</span>
              <span>{formatIDR(Number(payment.amount))}</span>
            </div>
            {Number(payment.change_amount) > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Kembalian</span>
                <span>{formatIDR(Number(payment.change_amount))}</span>
              </div>
            )}
            {payment.transaction_ref && (
              <div className="flex justify-between">
                <span className="text-gray-500">Ref.</span>
                <span className="text-right max-w-[60%] truncate">
                  {payment.transaction_ref}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={cn(
                  "font-semibold",
                  payment.status === "paid"
                    ? "text-green-700"
                    : payment.status === "refunded"
                      ? "text-gray-500"
                      : "text-red-600",
                )}
              >
                {PAYMENT_STATUS_LABELS[payment.status]}
              </span>
            </div>
            {payment.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Bayar</span>
                <span>{formatDateTime(payment.paid_at)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t-2 border-dashed border-gray-300 mt-4 pt-4 text-center text-xs text-gray-400">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p className="mt-1">Simpan struk ini sebagai bukti pembayaran.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(Number(id))
      .then(setOrder)
      .catch(() => setError("Pesanan tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Memuat invoice…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto">
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

  return (
    <>
      {/* Print styles — hide nav/header when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area {
            position: fixed;
            left: 0; top: 0;
            width: 80mm;
            padding: 4mm;
            font-size: 11px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-lg mx-auto">
        <div className="no-print flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft size={15} /> Detail Pesanan
          </button>

          <div className="flex gap-2">
            {order.payment_status !== "paid" && (
              <button
                onClick={() => navigate(`/orders/${order.id}/payment`)}
                className="text-sm px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition font-medium"
              >
                Bayar Sekarang
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <Printer size={15} /> Cetak
            </button>
          </div>
        </div>

        {/* Payment status badge */}
        <div className="no-print mb-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              order.payment_status === "paid"
                ? "bg-green-100 text-green-700"
                : order.payment_status === "refunded"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-yellow-100 text-yellow-700",
            )}
          >
            {order.payment_status === "paid"
              ? "✓ Lunas"
              : order.payment_status === "refunded"
                ? "Direfund"
                : "Belum Dibayar"}
          </span>
        </div>

        {/* Invoice paper */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <InvoiceContent order={order} />
        </div>

        {/* Refund button (owner only) */}
        {user?.role === "owner" &&
          order.payment_status === "paid" &&
          order.payment && (
            <div className="no-print mt-4 flex justify-end">
              <button
                onClick={async () => {
                  if (
                    !confirm("Yakin ingin melakukan refund untuk pesanan ini?")
                  )
                    return;
                  try {
                    const { refundPayment } =
                      await import("@/services/paymentService");
                    await refundPayment(order.payment!.id);
                    const updated = await getOrder(order.id);
                    setOrder(updated);
                  } catch {
                    alert("Gagal melakukan refund.");
                  }
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Refund Pembayaran
              </button>
            </div>
          )}
      </div>
    </>
  );
}
