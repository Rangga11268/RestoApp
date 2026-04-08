import { useEffect, useState, useCallback } from "react";
import {
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  CircleNotch,
  CaretLeft,
  CaretRight,
  Power,
  Storefront,
  IdentificationBadge,
  ShieldCheck,
  Funnel,
  ArrowsClockwise,
  UserCircle,
  CalendarBlank,
  Crown,
  HandPointing,
  WarningCircle
} from "@phosphor-icons/react";
import {
  getAdminRestaurants,
  toggleAdminRestaurant,
  type RestaurantListItem,
} from "@/services/superAdminService";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// ─── Helpers ─────────────────────────────────────────────

function subVariant(status: string | undefined): any {
    if (!status) return "glass";
    const map: Record<string, any> = {
        active: "success",
        trialing: "blue",
        expired: "danger",
        cancelled: "glass",
        past_due: "warning",
    };
    return map[status] || "glass";
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
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Admin Control</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Realm Directory</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Manage all active restaurant entities and their lease status.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hidden md:flex items-center gap-2">
            <span className="text-primary font-black">{meta.total}</span> Registered Realms
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

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-4">
           {/* Search Input */}
           <div className="relative flex-1 min-w-[300px]">
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search name, email, or domain slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
           </div>

           {/* Status Filter */}
           <div className="relative min-w-[160px]">
                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-12 pl-12 pr-10 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 appearance-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm uppercase tracking-widest cursor-pointer"
                >
                    <option value="">Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Suspended</option>
                </select>
           </div>

           {/* Sub Filter */}
           <div className="relative min-w-[200px]">
                <Crown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                    value={subFilter}
                    onChange={(e) => setSubFilter(e.target.value)}
                    className="w-full h-12 pl-12 pr-10 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 appearance-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm uppercase tracking-widest cursor-pointer"
                >
                    <option value="">License Tier</option>
                    <option value="active">Active Plan</option>
                    <option value="trialing">Free Trial</option>
                    <option value="expired">Lease Expired</option>
                    <option value="cancelled">Cancelled</option>
                </select>
           </div>
      </div>

      {/* Main Table Content */}
      <Card className="p-0 border-slate-100 overflow-hidden shadow-xl shadow-slate-900/5">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
                <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Scanning HQ Database...</span>
            </div>
        ) : items.length === 0 ? (
             <div className="text-center py-40 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">
                    <Storefront size={40} weight="duotone" />
                </div>
                <p className="font-black text-lg text-slate-900 tracking-tighter">No Realms Found</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Check your search terms or filter criteria.</p>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Restaurant Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Owner Context</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">License Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Onboarded</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SaaS Status</th>
                  <th className="px-8 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                               <Storefront size={20} weight="duotone" />
                           </div>
                           <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-slate-900 tracking-tighter truncate group-hover:text-primary transition-colors">{r.name}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{r.slug}</span>
                           </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      {r.owner ? (
                         <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-900">
                                  {r.owner.name[0]}
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1">{r.owner.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[140px]">{r.owner.email}</span>
                              </div>
                         </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant={subVariant(r.subscription?.status)} className="py-0.5 px-3 font-black text-[8px] uppercase tracking-widest border-none">
                            {r.subscription?.status || "NO PLAN"}
                        </Badge>
                        {r.subscription?.plan && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Crown size={12} weight="bold" />
                            {r.subscription.plan}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        <CalendarBlank size={12} className="inline mr-1 opacity-50" />
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5">
                      <Badge 
                        variant={r.is_active ? "success" : "glass"}
                        className={cn(
                            "py-1.5 px-3 font-black text-[9px] uppercase tracking-widest border-none",
                            !r.is_active && "bg-slate-100 text-slate-400"
                        )}
                      >
                        {r.is_active ? <CheckCircle size={12} weight="bold" className="mr-1.5" /> : <WarningCircle size={12} weight="bold" className="mr-1.5" />}
                        {r.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleToggle(r.id)}
                        disabled={working === r.id}
                        className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                            r.is_active 
                                ? "bg-white border-slate-100 text-slate-300 hover:text-danger hover:border-danger/20" 
                                : "bg-success text-white border-transparent hover:scale-110"
                        )}
                      >
                        {working === r.id ? (
                          <CircleNotch size={18} className="animate-spin text-primary" />
                        ) : (
                          <Power size={18} weight="bold" />
                        )}
                      </button>
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
              Page <span className="text-slate-900 font-black">{meta.current_page}</span> of <span className="text-slate-900 font-black">{meta.last_page}</span>
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
