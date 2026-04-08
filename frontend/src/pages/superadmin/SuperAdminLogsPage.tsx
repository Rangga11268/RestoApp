import { useEffect, useState, useCallback } from "react";
import {
  MagnifyingGlass,
  CircleNotch,
  CaretLeft,
  CaretRight,
  ClipboardText,
  ArrowsClockwise,
  Fingerprint,
  Monitor,
  CalendarBlank,
  HardDrives,
  UserCircle,
  CaretDown
} from "@phosphor-icons/react";
import {
  getActivityLogs,
  type ActivityLogItem,
} from "@/services/superAdminService";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

// ─── Action Config ─────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  "user.login": { label: "Session Init", color: "bg-blue-50 text-blue-600 border-blue-100" },
  "user.logout": { label: "Session Term", color: "bg-slate-50 text-slate-500 border-slate-100" },
  "user.register": { label: "New Adoption", color: "bg-success/10 text-success border-success/10" },
  "staff.created": { label: "Staff Add", color: "bg-violet-50 text-violet-600 border-violet-100" },
  "staff.deleted": { label: "Staff Drop", color: "bg-danger/5 text-danger border-danger/10" },
  "subscription.subscribe": { label: "Lease Start", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  "subscription.cancelled": { label: "Lease End", color: "bg-danger/5 text-danger border-danger/10" },
  "restaurant.suspended": { label: "Kill Switch", color: "bg-danger/10 text-danger border-danger/20" },
  "restaurant.activated": { label: "HQ Approve", color: "bg-success text-white border-transparent" },
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: "bg-slate-50 text-slate-400 border-slate-100" };
  return (
    <Badge 
        className={cn("px-3 py-1 font-black text-[9px] uppercase tracking-widest border", cfg.color)}
    >
      {cfg.label}
    </Badge>
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
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">System Forensics</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Audit Streams</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Real-time telemetry of all administrative and user events.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hidden md:flex items-center gap-2">
            <span className="text-primary font-black">{meta.total}</span> Total Events
          </div>
           <button
                onClick={() => load()}
                disabled={loading}
                className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
            >
                <ArrowsClockwise size={20} weight="bold" className={cn(loading && "animate-spin")} />
            </button>
        </div>
      </div>

      {/* Modern Filter Search */}
      <div className="max-w-md relative group">
        <MagnifyingGlass
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
        />
        <input
          type="text"
          placeholder="Filter by action code (e.g. user.login)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm outline-none"
        />
      </div>

      {/* Main Table Content */}
      <Card className="p-0 border-slate-100 overflow-hidden shadow-xl shadow-slate-900/5">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
                <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Streaming System Logs...</span>
            </div>
        ) : logs.length === 0 ? (
             <div className="text-center py-40 flex flex-col items-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-4">
                    <ClipboardText size={40} weight="duotone" className="opacity-40" />
                </div>
                <p className="font-black text-lg text-slate-900 tracking-tighter">Quiet Stream</p>
                <p className="text-xs font-medium">No activity logs recorded matching your query.</p>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            <CalendarBlank size={12} weight="bold" />
                            {log.created_at
                                ? new Date(log.created_at).toLocaleString("en-US", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                                : "—"}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-8 py-5">
                      {log.user ? (
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-900">
                                  {log.user.name[0]}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900 tracking-tight leading-none group-hover:text-primary transition-colors">{log.user.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 lowercase">{log.user.email}</span>
                             </div>
                        </div>
                      ) : (
                        <Badge variant="glass" className="font-black text-[9px] uppercase tracking-widest text-slate-300">Automated System</Badge>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {log.subject_type ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <HardDrives size={14} weight="duotone" className="text-primary" />
                           <span className="text-slate-900">{log.subject_type}</span>
                           <span className="opacity-40">#{log.subject_id}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 tracking-widest">
                            <Monitor size={14} weight="bold" />
                            {log.ip_address ?? "Unknown Source"}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {meta.last_page > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Scan Page <span className="text-slate-900 font-black">{meta.current_page}</span> / <span className="text-slate-900 font-black">{meta.last_page}</span>
            </span>
            <div className="flex gap-3">
               <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-30 shadow-sm"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                   className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-30 shadow-sm"
                >
                  <CaretRight size={20} weight="bold" />
                </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
