import { useEffect, useState, useCallback } from "react";
import {
  MagnifyingGlass,
  CircleNotch,
  CaretLeft,
  CaretRight,
  ClipboardText,
} from "@phosphor-icons/react";
import {
  getActivityLogs,
  type ActivityLogItem,
} from "@/services/superAdminService";

// ─── Helpers ─────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  "user.login": "bg-blue-100 text-blue-700",
  "user.logout": "bg-gray-100 text-gray-600",
  "user.register": "bg-green-100 text-green-700",
  "staff.created": "bg-violet-100 text-violet-700",
  "staff.deleted": "bg-red-100 text-red-700",
  "staff.toggled": "bg-yellow-100 text-yellow-700",
  "subscription.subscribe": "bg-green-100 text-green-700",
  "subscription.cancelled": "bg-red-100 text-red-700",
  "restaurant.suspended": "bg-red-100 text-red-700",
  "restaurant.activated": "bg-green-100 text-green-700",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${cls}`}
    >
      {action}
    </span>
  );
}

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 50,
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
    getActivityLogs({ search: debouncedSearch || undefined, page })
      .then((res) => {
        setLogs(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Riwayat aktivitas di seluruh platform ({meta.total} entri)
        </p>
      </div>

      {/* MagnifyingGlass */}
      <div className="relative max-w-sm">
        <MagnifyingGlass
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Filter aksi (contoh: user.login)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <CircleNotch className="animate-spin text-orange-500" size={28} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Tidak ada log ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Waktu
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Aksi
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Pengguna
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Subjek
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <>
                          <p className="font-medium text-gray-800">
                            {log.user.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.user.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {log.subject_type ? (
                        <span className="text-xs">
                          {log.subject_type} #{log.subject_id}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                      {log.ip_address ?? "—"}
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
