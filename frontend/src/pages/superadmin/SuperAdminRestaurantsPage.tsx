import { useEffect, useState, useCallback } from "react";
import {
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  CircleNotch,
  CaretLeft,
  CaretRight,
  Power,
} from "@phosphor-icons/react";
import {
  getAdminRestaurants,
  toggleAdminRestaurant,
  type RestaurantListItem,
} from "@/services/superAdminService";

// ─── Helpers ─────────────────────────────────────────────

function subBadge(status: string | undefined) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    trialing: "bg-blue-100 text-blue-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    past_due: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

export default function SuperAdminRestaurantsPage() {
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    getAdminRestaurants({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      subscription: subFilter || undefined,
      page,
    })
      .then((res) => {
        setItems(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter, subFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, subFilter]);

  const handleToggle = async (id: number) => {
    setWorking(id);
    try {
      const res = await toggleAdminRestaurant(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: res.is_active } : r)),
      );
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daftar Restoran</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {meta.total} restoran terdaftar di platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari nama, email, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">Semua Langganan</option>
          <option value="active">Aktif</option>
          <option value="trialing">Trial</option>
          <option value="expired">Kadaluarsa</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <CircleNotch className="animate-spin text-orange-500" size={28} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Storefront size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Tidak ada restoran ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Restoran
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Owner
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Langganan
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Terdaftar
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.owner ? (
                        <>
                          <p className="font-medium text-gray-800">
                            {r.owner.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {r.owner.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {subBadge(r.subscription?.status)}
                        {r.subscription?.plan && (
                          <p className="text-xs text-gray-400 capitalize">
                            {r.subscription.plan}
                          </p>
                        )}
                        {r.subscription?.ends_at && (
                          <p className="text-xs text-gray-400">
                            s/d{" "}
                            {new Date(
                              r.subscription.ends_at,
                            ).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          r.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {r.is_active ? (
                          <CheckCircle size={11} />
                        ) : (
                          <XCircle size={11} />
                        )}
                        {r.is_active ? "Aktif" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(r.id)}
                        disabled={working === r.id}
                        title={r.is_active ? "Suspend" : "Aktifkan"}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                          r.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {working === r.id ? (
                          <CircleNotch size={12} className="animate-spin" />
                        ) : (
                          <Power size={12} />
                        )}
                        {r.is_active ? "Suspend" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} ({meta.total}{" "}
            total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <CaretLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fix missing import
function Storefront({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
