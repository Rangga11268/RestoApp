import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Users,
  ImageOff,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  getSalesReport,
  getTopProducts,
  getStaffPerformance,
  exportReportExcel,
  exportReportPdf,
  type SalesData,
  type TopProduct,
  type StaffStat,
} from "@/services/reportService";
import { useAuthStore } from "@/stores/authStore";

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(n);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.dataKey === "revenue"
            ? fmt(p.value, currency)
            : `${p.value} pesanan`}
        </p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuthStore();
  const currency =
    (user as { restaurant?: { currency?: string } } | null)?.restaurant
      ?.currency ?? "IDR";

  // Filters
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [topLimit, setTopLimit] = useState(10);
  const [topSort, setTopSort] = useState<"qty" | "revenue">("revenue");

  // Data
  const [sales, setSales] = useState<SalesData | null>(null);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [staff, setStaff] = useState<StaffStat[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const handleExport = async (type: "excel" | "pdf") => {
    setExporting(type);
    const params = {
      from,
      to,
      group_by: groupBy,
      limit: topLimit,
      sort_by: topSort,
    };
    try {
      if (type === "excel") await exportReportExcel(params);
      else await exportReportPdf(params);
    } catch {
      // silently ignore — browser will show nothing if it fails
    } finally {
      setExporting(null);
    }
  };

  // Fetch sales + staff together when date range changes
  useEffect(() => {
    setLoadingSales(true);
    setLoadingStaff(true);
    Promise.all([
      getSalesReport({ from, to, group_by: groupBy }),
      getStaffPerformance({ from, to }),
    ])
      .then(([s, st]) => {
        setSales(s);
        setStaff(st);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingSales(false);
        setLoadingStaff(false);
      });
  }, [from, to, groupBy]);

  // Fetch top products when filter changes
  useEffect(() => {
    setLoadingProducts(true);
    getTopProducts({ from, to, limit: topLimit, sort_by: topSort })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [from, to, topLimit, topSort]);

  const summaryCards = [
    {
      label: "Total Pendapatan",
      value: loadingSales
        ? "—"
        : fmt(sales?.summary.total_revenue ?? 0, currency),
      icon: <TrendingUp size={20} />,
      color: "bg-green-50 text-green-600",
      border: "border-green-100",
    },
    {
      label: "Total Pesanan",
      value: loadingSales
        ? "—"
        : String(sales?.summary.total_transactions ?? 0),
      icon: <ShoppingCart size={20} />,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Rata-rata/Hari",
      value: loadingSales
        ? "—"
        : fmt(sales?.summary.avg_per_day ?? 0, currency),
      icon: <BarChart3 size={20} />,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },
    {
      label: "Staf Aktif",
      value: loadingStaff ? "—" : String(staff.length),
      icon: <Users size={20} />,
      color: "bg-violet-50 text-violet-600",
      border: "border-violet-100",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Analisis penjualan & performa restoran
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("excel")}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {exporting === "excel" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={15} />
            )}
            Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {exporting === "pdf" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileText size={15} />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Kelompokkan
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(["day", "month"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  groupBy === g
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {g === "day" ? "Harian" : "Bulanan"}
              </button>
            ))}
          </div>
        </div>
        {/* Preset shortcuts */}
        <div className="flex gap-2 ml-auto">
          {[
            { label: "7H", from: daysAgo(6) },
            { label: "30H", from: daysAgo(29) },
            { label: "90H", from: daysAgo(89) },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from);
                setTo(today());
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border ${s.border} p-4 hover:shadow-sm transition`}
          >
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${s.color}`}
            >
              {s.icon}
            </div>
            {loadingSales ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-24 mb-1" />
            ) : (
              <p className="text-xl font-bold text-gray-900 leading-none">
                {s.value}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Grafik Penjualan — {groupBy === "day" ? "Harian" : "Bulanan"}
        </h2>
        {loadingSales ? (
          <div className="flex items-center justify-center h-52 text-gray-300">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : !sales?.chart?.length ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">
            Tidak ada data dalam rentang ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <AreaChart
              data={sales.chart}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="rev"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}rb`
                      : String(v)
                }
              />
              <YAxis
                yAxisId="ord"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area
                yAxisId="rev"
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                yAxisId="ord"
                type="monotone"
                dataKey="transactions"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#ordGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products + Staff performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Menu Terlaris
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={topSort}
                onChange={(e) =>
                  setTopSort(e.target.value as "qty" | "revenue")
                }
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-300"
              >
                <option value="revenue">Revenue</option>
                <option value="qty">Qty Terjual</option>
              </select>
              <select
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-300"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    Top {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingProducts ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-28" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : !products.length ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">
                    {idx + 1}
                  </span>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                      <ImageOff size={14} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.total_qty} porsi
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 flex-shrink-0">
                    {fmt(item.total_revenue, currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff performance */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Performa Staf
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Pendapatan per kasir/staf
            </p>
          </div>

          {loadingStaff ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-2.5 bg-gray-100 rounded w-14" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : !staff.length ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              Tidak ada data staf
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {staff.map((s) => {
                const initials = s.cashier_name
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={s.cashier_id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.cashier_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.total_orders} pesanan
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 flex-shrink-0">
                      {fmt(s.total_revenue, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
