import { useAuthStore } from "@/stores/authStore";
import {
  ShoppingCart,
  DollarSign,
  UtensilsCrossed,
  Table2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: "Pesanan Hari Ini",
      value: "0",
      icon: <ShoppingCart size={20} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pendapatan",
      value: "Rp 0",
      icon: <DollarSign size={20} />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Menu Aktif",
      value: "0",
      icon: <UtensilsCrossed size={20} />,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Meja Tersedia",
      value: "0",
      icon: <Table2 size={20} />,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.restaurant?.name} &mdash; ringkasan aktivitas hari ini
        </p>
      </div>

      {/* Subscription badge */}
      {user?.subscription && (
        <div className="mb-6 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          Paket {user.subscription.plan} —{" "}
          {user.subscription.status === "trialing"
            ? `${user.subscription.days_remaining} hari trial tersisa`
            : "Aktif"}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${s.color}`}
            >
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          Data akan muncul setelah Anda mulai menggunakan sistem.
        </p>
        <p className="text-xs mt-1">
          Mulai dengan menambahkan menu dan meja restoran Anda.
        </p>
      </div>
    </div>
  );
}
