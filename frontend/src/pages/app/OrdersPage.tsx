import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Clock,
  ChevronRight,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import {
  getOrders,
  STATUS_LABELS,
  STATUS_COLORS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
  type PaginatedOrders,
} from "@/services/orderService";
import { cn } from "@/lib/utils";

// ─── Tab definitions ─────────────────────────────────────

const TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Menunggu", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Dimasak", value: "cooking" },
  { label: "Siap", value: "ready" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

// ─── Utils ───────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Order card ───────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
        <ShoppingCart size={16} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">
            {order.order_number}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_COLORS[order.status],
            )}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {order.table ? `Meja ${order.table.name} · ` : ""}
          {ORDER_TYPE_LABELS[order.order_type]}
          {order.customer_name ? ` · ${order.customer_name}` : ""}
          {order.items?.length ? ` · ${order.items.length} item` : ""}
        </p>
      </div>

      {/* Right side */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(order.total)}
        </p>
        <p className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-0.5">
          <Clock size={11} />
          {timeAgo(order.created_at)}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-gray-500 flex-shrink-0"
      />
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [result, setResult] = useState<PaginatedOrders | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders({
        status: activeTab !== "all" ? activeTab : undefined,
        per_page: 20,
        page,
      });
      setResult(data);
    } catch {
      setError("Gagal memuat pesanan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const orders = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau dan kelola seluruh pesanan
          </p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition bg-white"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap",
              activeTab === tab.value
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error && (
          <div className="px-5 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {loading && orders.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Memuat…
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <ShoppingCart size={40} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Belum ada pesanan
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Pesanan dari pelanggan akan muncul di sini.
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {(meta.current_page - 1) * meta.per_page + 1}–
              {Math.min(meta.current_page * meta.per_page, meta.total)} dari{" "}
              {meta.total} pesanan
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page === 1 || loading}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page === meta.last_page || loading}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
