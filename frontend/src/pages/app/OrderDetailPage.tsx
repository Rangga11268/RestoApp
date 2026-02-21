import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Table2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  CookingPot,
  BellRing,
  CircleDashed,
  Loader2,
} from "lucide-react";
import {
  getOrder,
  updateOrderStatus,
  cancelOrder,
  STATUS_LABELS,
  STATUS_COLORS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
} from "@/services/orderService";
import { cn } from "@/lib/utils";

// ─── Utils ───────────────────────────────────────────────

function formatCurrency(n: number) {
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

// ─── Next-status button config ────────────────────────────

const NEXT_STATUS_CONFIG: Partial<
  Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }>
> = {
  confirmed: {
    label: "Konfirmasi",
    icon: <CheckCircle2 size={16} />,
    color: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  cooking: {
    label: "Mulai Masak",
    icon: <CookingPot size={16} />,
    color: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  ready: {
    label: "Tandai Siap",
    icon: <BellRing size={16} />,
    color: "bg-green-500 hover:bg-green-600 text-white",
  },
  completed: {
    label: "Selesaikan",
    icon: <CheckCircle2 size={16} />,
    color: "bg-gray-700 hover:bg-gray-800 text-white",
  },
};

// ─── Status steps indicator ───────────────────────────────

const STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "cooking",
  "ready",
  "completed",
];

function StatusStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <XCircle size={16} /> Pesanan Dibatalkan
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;

        return (
          <div key={step} className="flex items-center">
            <div className={cn("flex flex-col items-center")}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2",
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-gray-200 text-gray-300",
                )}
              >
                {done ? (
                  <CheckCircle2 size={14} />
                ) : active ? (
                  <CircleDashed size={14} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 whitespace-nowrap",
                  done || active ? "text-gray-700" : "text-gray-400",
                )}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 sm:w-10 mx-1 mb-4",
                  done ? "bg-green-400" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(Number(id))
      .then(setOrder)
      .catch(() => setError("Pesanan tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(status: OrderStatus) {
    if (!order) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrder(updated);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal memperbarui status.";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!order || !confirm("Batalkan pesanan ini?")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelOrder(order.id);
      navigate("/orders");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal membatalkan pesanan.";
      setActionError(msg);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" />
        Memuat…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-red-500 mb-4">
          {error ?? "Pesanan tidak ditemukan."}
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

  // Derive allowed next statuses on the frontend (mirrors backend allowedNextStatuses())
  const nextStatuses = ((): OrderStatus[] => {
    switch (order.status) {
      case "pending":
        return ["confirmed", "cancelled"];
      case "confirmed":
        return ["cooking", "cancelled"];
      case "cooking":
        return ["ready"];
      case "ready":
        return ["completed"];
      default:
        return [];
    }
  })();

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
      >
        <ArrowLeft size={15} />
        Pesanan
      </Link>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {order.order_number}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDateTime(order.created_at)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0",
            STATUS_COLORS[order.status],
          )}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 overflow-x-auto">
        <StatusStepper status={order.status} />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          {
            icon: <ShoppingCart size={14} />,
            label: "Tipe",
            value: ORDER_TYPE_LABELS[order.order_type],
          },
          {
            icon: <Table2 size={14} />,
            label: "Meja",
            value: order.table?.name ?? "—",
          },
          {
            icon: <User size={14} />,
            label: "Kasir",
            value: order.cashier?.name ?? "—",
          },
          order.customer_name
            ? {
                icon: <User size={14} />,
                label: "Pelanggan",
                value: order.customer_name,
              }
            : null,
          {
            icon: <Clock size={14} />,
            label: "Pembayaran",
            value:
              order.payment_status === "paid"
                ? "Sudah bayar"
                : order.payment_status === "refunded"
                  ? "Direfund"
                  : "Belum bayar",
          },
        ]
          .filter(Boolean)
          .map((item) => (
            <div
              key={item!.label}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3"
            >
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                {item!.icon}
                {item!.label}
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {item!.value}
              </p>
            </div>
          ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          <span className="font-medium">Catatan:</span> {order.notes}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
          Item Pesanan
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                {item.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {item.menu_item_name}
                </p>
                {item.notes && (
                  <p className="text-xs text-gray-400 italic mt-0.5">
                    {item.notes}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatCurrency(item.price_snapshot)} / pcs
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="border-t border-gray-100 px-5 py-3 space-y-1.5 bg-gray-50/50">
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Diskon</span>
              <span>- {formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          {order.tax_amount > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Pajak</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {actionError}
        </div>
      )}

      {/* Action buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nextStatuses
            .filter((s) => s !== "cancelled")
            .map((s) => {
              const cfg = NEXT_STATUS_CONFIG[s];
              if (!cfg) return null;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusUpdate(s)}
                  disabled={actionLoading}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60",
                    cfg.color,
                  )}
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    cfg.icon
                  )}
                  {cfg.label}
                </button>
              );
            })}

          {nextStatuses.includes("cancelled") && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
            >
              <XCircle size={15} />
              Batalkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
