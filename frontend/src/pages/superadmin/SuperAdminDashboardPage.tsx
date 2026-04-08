import { useEffect, useState } from "react";
import { 
    Storefront, Users, TrendUp, Pulse, CircleNotch, 
    ArrowsClockwise, IdentificationBadge, ChartLineUp,
    ShieldCheck, Globe, WarningCircle, CaretRight
} from "@phosphor-icons/react";
import {
  getPlatformStats,
  type PlatformStats,
} from "@/services/superAdminService";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="p-8 border-slate-100 group hover:scale-[1.02] transition-all">
       <div className="flex items-start justify-between mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", color)}>
                <Icon size={24} weight="duotone" />
            </div>
            {sub?.includes('+') && <Badge variant="success" className="text-[10px] font-black">{sub.split(' ')[0]}</Badge>}
       </div>
       <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            {sub && !sub.includes('+') && <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{sub}</p>}
       </div>
    </Card>
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
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Platform Ledger...</span>
        </div>
    )
  }

  if (!stats) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Platform Control</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">HQ Dashboard</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Top-level insights into RestoApp SaaS performance.
           </p>
        </div>
        <div className="flex items-center gap-3">
             <button
                onClick={() => window.location.reload()}
                className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
            >
                <ArrowsClockwise size={20} weight="bold" />
            </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Entities"
          value={stats.restaurants.total}
          sub={`${stats.restaurants.active} Active / ${stats.restaurants.inactive} Pending`}
          icon={Storefront}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="SaaS Users"
          value={stats.users}
          sub="Verified Accounts"
          icon={Users}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Active Licenses"
          value={stats.subscriptions.active}
          sub={`${stats.subscriptions.trialing} Trials · ${stats.subscriptions.inactive} Closed`}
          icon={ShieldCheck}
          color="bg-success/10 text-success"
        />
        <StatCard
          label="Total Revenue"
          value={fmt(stats.revenue.this_month)}
          sub={`MTD Total Receipts`}
          icon={TrendUp}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Growth Analytics */}
        <div className="lg:col-span-8">
            <Card className="p-8 border-slate-100 overflow-hidden relative">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <ChartLineUp size={20} weight="duotone" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter">Onboarding Growth</h2>
                    </div>
                    <Badge variant="glass" className="text-[10px] uppercase font-black tracking-widest bg-slate-50 border-none">Last 6 Months</Badge>
                 </div>

                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={stats.growth}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                        <defs>
                            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                fontSize: '10px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                padding: '12px'
                            }}
                            cursor={{ stroke: '#f97316', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#f97316"
                            strokeWidth={4}
                            fill="url(#growthGrad)"
                            animationDuration={1500}
                        />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
            </Card>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4 space-y-8">
             <Card className="p-8 border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
                        <Pulse size={20} weight="duotone" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter">License Health</h2>
                </div>

                <div className="space-y-8">
                    {[
                    { label: "Active Pro", count: stats.subscriptions.active, color: "bg-success" },
                    { label: "Free / Trial", count: stats.subscriptions.trialing, color: "bg-primary" },
                    { label: "Inactive", count: stats.subscriptions.inactive, color: "bg-slate-300" },
                    ].map((item) => {
                    const pct = stats.subscriptions.total
                        ? Math.round((item.count / stats.subscriptions.total) * 100)
                        : 0;
                    return (
                        <div key={item.label} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                <span className="text-lg font-black text-slate-900 leading-none">
                                    {item.count} <small className="text-[10px] text-slate-300">{pct}%</small>
                                </span>
                            </div>
                            <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                                <div
                                className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                                style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                    })}
                </div>
             </Card>

             {/* Quick Actions Card */}
             <Card className="p-8 bg-slate-900 border-transparent relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Globe size={80} weight="duotone" className="text-white" />
                  </div>
                  <div className="relative z-10">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Administration</h4>
                        <div className="space-y-3">
                             <Button variant="primary" className="w-full h-12 rounded-2xl group text-[10px] font-black tracking-widest">
                                MANAGE REALMS <CaretRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                             </Button>
                             <button className="w-full h-12 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all">
                                AUDIT SYSTEM LOGS
                             </button>
                        </div>
                  </div>
             </Card>
        </div>
      </div>
    </div>
  );
}
