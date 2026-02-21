import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  ShoppingCart,
  DollarSign,
  UtensilsCrossed,
  Table2,
  Tag,
  Settings,
  ArrowRight,
} from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
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
    label: "Pengaturan",
    desc: "Info & logo restoran",
    icon: <Settings size={18} />,
    href: "/settings",
    color: "bg-green-50 text-green-600",
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: "Pesanan Hari Ini",
      value: "0",
      icon: <ShoppingCart size={20} />,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Pendapatan",
      value: "Rp 0",
      icon: <DollarSign size={20} />,
      color: "bg-green-50 text-green-600",
      border: "border-green-100",
    },
    {
      label: "Menu Aktif",
      value: "0",
      icon: <UtensilsCrossed size={20} />,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },
    {
      label: "Meja Tersedia",
      value: "0",
      icon: <Table2 size={20} />,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-100",
    },
  ];

  const isTrialing = user?.subscription?.status === "trialing";
  const daysLeft = user?.subscription?.days_remaining ?? 0;

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

        {/* Subscription badge */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
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
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-7">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Getting started */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Mulai dari sini
          </h2>
          <span className="text-xs text-gray-400">0 / 4 selesai</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              step: "Lengkapi profil restoran",
              desc: "Tambahkan logo, alamat & informasi kontak",
              href: "/settings",
              done: false,
            },
            {
              step: "Buat kategori menu",
              desc: "Misalnya: Makanan Utama, Minuman, Dessert",
              href: "/menu/categories",
              done: false,
            },
            {
              step: "Tambahkan menu pertama",
              desc: "Lengkapi dengan foto, harga & deskripsi",
              href: "/menu/items",
              done: false,
            },
            {
              step: "Daftarkan meja & cetak QR",
              desc: "Pelanggan bisa scan untuk lihat menu",
              href: "/tables",
              done: false,
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.href}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition group"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  item.done
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 group-hover:border-orange-400"
                }`}
              >
                {item.done && (
                  <svg
                    viewBox="0 0 10 8"
                    className="w-2.5 h-2.5 fill-none stroke-white stroke-2"
                  >
                    <polyline
                      points="1,4 4,7 9,1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
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
