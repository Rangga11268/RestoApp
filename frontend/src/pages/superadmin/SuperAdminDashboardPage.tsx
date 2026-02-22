import { useEffect, useState } from "react";
import { Store, Users, TrendingUp, Activity, Loader2 } from "lucide-react";
import {
  getPlatformStats,
  type PlatformStats,
} from "@/services/superAdminService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4`}
    >
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Statistik platform RestoApp secara keseluruhan
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Restoran"
          value={stats.restaurants.total}
          sub={`${stats.restaurants.active} aktif · ${stats.restaurants.inactive} tidak aktif`}
          icon={<Store size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Total Pengguna"
          value={stats.users}
          icon={<Users size={20} />}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Langganan Aktif"
          value={stats.subscriptions.active}
          sub={`${stats.subscriptions.trialing} trial · ${stats.subscriptions.inactive} tidak aktif`}
          icon={<Activity size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Revenue Bulan Ini"
          value={fmt(stats.revenue.this_month)}
          sub={`Total: ${fmt(stats.revenue.total)}`}
          icon={<TrendingUp size={20} />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Subscription breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Status Langganan</h2>
          <div className="space-y-3">
            {[
              {
                label: "Aktif",
                count: stats.subscriptions.active,
                cls: "bg-green-500",
              },
              {
                label: "Trial",
                count: stats.subscriptions.trialing,
                cls: "bg-blue-500",
              },
              {
                label: "Tidak Aktif",
                count: stats.subscriptions.inactive,
                cls: "bg-red-400",
              },
            ].map((item) => {
              const pct = stats.subscriptions.total
                ? Math.round((item.count / stats.subscriptions.total) * 100)
                : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-900">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.cls}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">
            Pertumbuhan Restoran (6 Bulan)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={stats.growth}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
                formatter={(v) => [`${v} restoran`, "Baru"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#growthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
