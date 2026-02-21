import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
  Clock,
  Tag,
  Table2,
  ArrowRight,
  BarChart3,
  Loader2,
  ImageOff,
} from "lucide-react";
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
  getDashboardReport,
  type DashboardData,
} from "@/services/reportService";

// ─── Helpers ─────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function fmt(n: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(n);
}

const QUICK_ACTIONS = [
  {
    label: "Tambah Kategori",
    desc: "Kelola kategori menu",
    icon: <Tag size={18} />,
    href: "/menu/categories",
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Tambah Menu",
    desc: "Tambah item menu baru",
    icon: <UtensilsCrossed size={18} />,
    href: "/menu/items",
    color: "bg-orange-50 text-orange-600",
  },
  {
    label: "Kelola Meja",
    desc: "Atur meja & QR code",
    icon: <Table2 size={18} />,
    href: "/tables",
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Laporan",
    desc: "Sales & top produk",
    icon: <BarChart3 size={18} />,
    href: "/reports",
    color: "bg-emerald-50 text-emerald-600",
  },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-orange-600 font-bold">{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const currency =
    (user as { restaurant?: { currency?: string } } | null)?.restaurant
      ?.currency ?? "IDR";

  useEffect(() => {
    getDashboardReport()
      .then(setData)
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setLoading(false));
  }, []);

  const isTrialing = user?.subscription?.status === "trialing";
  const daysLeft = user?.subscription?.days_remaining ?? 0;

  const stats = [
    {
      label: "Pendapatan Hari Ini",
      value: loading ? "—" : fmt(data?.today.revenue ?? 0, currency),
      icon: <TrendingUp size={20} />,
      color: "bg-green-50 text-green-600",
      border: "border-green-100",
    },
    {
      label: "Pesanan Hari Ini",
      value: loading ? "—" : String(data?.today.order_count ?? 0),
      icon: <ShoppingCart size={20} />,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Pesanan Pending",
      value: loading ? "—" : String(data?.today.pending_orders ?? 0),
      icon: <Clock size={20} />,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      label: "Menu Aktif",
      value: loading ? "—" : String(data?.today.active_menus ?? 0),
      icon: <UtensilsCrossed size={20} />,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.restaurant?.name ? `${user.restaurant.name} — ` : ""}
            ringkasan aktivitas hari ini
          </p>
        </div>
        {user?.subscription && (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border ${
              isTrialing && daysLeft <= 3
                ? "bg-red-50 border-red-200 text-red-700"
                : isTrialing
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isTrialing && daysLeft <= 3
                  ? "bg-red-400 animate-pulse"
                  : isTrialing
                    ? "bg-amber-400 animate-pulse"
                    : "bg-green-400"
              }`}
            />
            {isTrialing
              ? daysLeft <= 3
                ? `⚠ Trial berakhir ${daysLeft} hari lagi`
                : `Trial — ${daysLeft} hari tersisa`
              : `Paket ${user.subscription.plan} · Aktif`}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border ${s.border} p-4 hover:shadow-sm transition`}
          >
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${s.color}`}
            >
              {s.icon}
            </div>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded animate-pulse w-20 mb-1" />
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
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Pendapatan 7 Hari Terakhir
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Berdasarkan pembayaran lunas
            </p>
          </div>
          <Link
            to="/reports"
            className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
          >
            Laporan lengkap <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-44 text-gray-300">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={176}>
            <AreaChart
              data={data?.chart ?? []}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}rb`
                      : String(v)
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top 5 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Top 5 Menu Terlaris
            </h2>
            <Link
              to="/reports"
              className="text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Semua →
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-28" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.top_products?.length ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              Belum ada data penjualan
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.top_products.map((item, idx) => (
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
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                      <ImageOff size={14} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.total_qty} porsi terjual
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

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                to={a.href}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-gray-300 transition group flex flex-col gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.color}`}
                >
                  {a.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                    {a.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all mt-auto"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting started */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Mulai dari sini
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              step: "Lengkapi profil restoran",
              desc: "Tambahkan logo, alamat & informasi kontak",
              href: "/settings",
            },
            {
              step: "Buat kategori menu",
              desc: "Misalnya: Makanan Utama, Minuman, Dessert",
              href: "/menu/categories",
            },
            {
              step: "Tambahkan menu pertama",
              desc: "Lengkapi dengan foto, harga & deskripsi",
              href: "/menu/items",
            },
            {
              step: "Daftarkan meja & cetak QR",
              desc: "Pelanggan bisa scan untuk lihat menu",
              href: "/tables",
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.href}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition group"
            >
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-orange-400 flex-shrink-0 transition" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.step}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-orange-400 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

}

