import { useEffect, useState } from 'react'
import { 
    Clock, CircleNotch, ArrowsClockwise, SealCheck, 
    Warning, ShieldCheck, Crown, RocketLaunch, 
    Diamond, CheckCircle, CaretRight, Info,
    LockKey, UserCircle, Stack, Table, 
    ChartLineUp
} from "@phosphor-icons/react"
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  type SubscriptionPlan,
  type CurrentSubscription,
} from '@/services/subscriptionService'
import { Toast, confirmAct } from '@/lib/swal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function statusVariant(status: string) {
    const map: Record<string, any> = {
        active: 'success',
        trialing: 'blue',
        past_due: 'warning',
        cancelled: 'glass',
        expired: 'danger',
    }
    return map[status] || 'glass'
}

// ─── Main page ────────────────────────────────────────────

export default function SubscriptionPage() {
  const [sub, setSub] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<number | 'cancel' | null>(null)
  const [months, setMonths] = useState(1)

  useEffect(() => {
    Promise.all([getCurrentSubscription(), getSubscriptionPlans()])
      .then(([s, p]) => {
        setSub(s)
        setPlans(p)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (planId: number) => {
    setWorking(planId)
    try {
      const updated = await subscribe(planId, months)
      setSub(updated)
      Toast.fire({ icon: 'success', title: 'Power-up activated!' })
    } catch {
      Toast.fire({
        icon: 'error',
        title: 'Upgrade failed',
        text: 'Please check your connection and try again.',
      })
    } finally {
      setWorking(null)
    }
  }

  const handleCancel = async () => {
    const result = await confirmAct(
      'Are you sure? Premium features will be restricted at the end of the billing cycle.',
      'Yes, Cancel Access'
    )
    if (!result.isConfirmed) return
    setWorking('cancel')
    try {
      const updated = await cancelSubscription()
      setSub(updated)
      Toast.fire({ icon: 'success', title: 'Subscription cancelled' })
    } catch {
      Toast.fire({ icon: 'error', title: 'Failed to off-board' })
    } finally {
      setWorking(null)
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Checking License...</span>
        </div>
    )
  }

  const progressPct = sub ? Math.min(100, Math.max(0, (sub.days_remaining / 31) * 100)) : 0

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-in pb-20">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Account Tiers</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Subscription Center</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Manage your growth and unlock advanced restaurant analytics.
           </p>
        </div>
      </div>

      {/* Current Active Status (Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                 <Card className="p-10 border-slate-100 bg-slate-900 text-white overflow-hidden relative group h-full">
                    {/* Background Decorative */}
                    <div className="absolute top-0 right-0 p-10 opacity-20 transition-transform duration-1000 group-hover:scale-110">
                        <Crown size={200} weight="duotone" className="text-primary" />
                    </div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />

                    <div className="relative z-10 space-y-8">
                        {sub ? (
                            <>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black tracking-tighter uppercase">{sub.plan?.name || "Standard Member"}</h2>
                                            <Badge variant={statusVariant(sub.status)} className="py-1 px-4 border-none font-black uppercase text-[10px]">
                                                {sub.status}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm">
                                            {sub.ends_at ? `Valid through ${new Date(sub.ends_at).toLocaleDateString()}` : 'Indefinite Access'}
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Days Remaining</span>
                                        <span className={cn("text-4xl font-black tracking-tighter", sub.days_remaining < 7 ? "text-danger" : "text-white")}>
                                            {sub.days_remaining}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                                    {[
                                        { label: 'Cloud Staff', val: sub.plan?.max_staff, icon: UserCircle },
                                        { label: 'Active Menu', val: sub.plan?.max_menu_items, icon: Stack },
                                        { label: 'Floor Tables', val: sub.plan?.max_tables, icon: Table },
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <item.icon size={20} weight="duotone" className="text-primary mb-2" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                                            <p className="text-xl font-black tracking-tighter">{item.val === 0 ? '∞' : item.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Life Bar */}
                                <div className="pt-4">
                                     <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">License Timeline</span>
                                        <span className="text-[10px] font-black uppercase text-slate-400">{sub.days_remaining} / 31 DAYS</span>
                                     </div>
                                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                progressPct < 20 ? "bg-danger" : progressPct < 50 ? "bg-amber-400" : "bg-success"
                                            )}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-10 text-center">
                                 <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">No Active Access</h2>
                                 <p className="text-slate-400 max-w-sm mx-auto">You're currently on a restricted view. Upgrade your plan to start serving customers.</p>
                            </div>
                        )}
                    </div>
                 </Card>
            </div>

            {/* Support / Quick Help */}
            <div className="lg:col-span-4">
                 <Card className="p-8 border-slate-100 bg-slate-50/50 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
                                <ShieldCheck size={20} weight="duotone" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase">Member Shield</h3>
                        </div>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">
                            Premium plans include dedicated account managers and 24/7 priority kitchen support. 
                        </p>
                    </div>

                    <div className="space-y-3">
                         {sub?.is_expiring && (
                            <div className="p-4 bg-danger/5 border border-danger/10 rounded-2xl flex items-center gap-3 text-danger">
                                <Warning size={18} weight="bold" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Action Required Soon</span>
                            </div>
                         )}
                         <Button variant="secondary" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200">
                            Download Ledger <CaretRight size={14} className="ml-2" />
                         </Button>
                         {sub?.is_active && sub?.status !== 'cancelled' && (
                            <button 
                                onClick={handleCancel}
                                disabled={working === 'cancel'}
                                className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-danger py-2 transition-colors uppercase"
                            >
                                {working === 'cancel' ? 'TERMINATING...' : 'Off-board Subscription'}
                            </button>
                         )}
                    </div>
                 </Card>
            </div>
      </div>

      {/* Pricing Grids */}
      <div className="space-y-8">
            <div className="text-center">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Choose Your Power</h2>
                 
                 {/* Premium Duration Toggle */}
                 <div className="inline-flex p-1.5 bg-slate-100 rounded-[24px] gap-1">
                    {[1, 3, 6, 12].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMonths(m)}
                            className={cn(
                                "h-10 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
                                months === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {m} {m === 1 ? 'Month' : 'Months'}
                        </button>
                    ))}
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => {
                    const isCurrent = sub?.plan?.id === plan.id && sub?.is_active
                    const total = plan.price_monthly * months
                    const isPro = plan.name.toLowerCase().includes('pro')
                    const isUltra = plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('ultra')

                    return (
                        <Card 
                            key={plan.id}
                            className={cn(
                                "p-8 border-slate-100 relative group overflow-hidden flex flex-col",
                                isPro && "border-primary/20 bg-primary/5",
                                isCurrent && "ring-4 ring-primary ring-offset-4 ring-offset-slate-50"
                            )}
                        >
                             {isPro && !isCurrent && (
                                <div className="absolute top-0 right-0 p-4">
                                     <Badge variant="primary" className="text-[8px] font-black uppercase py-1">MOST POPULAR</Badge>
                                </div>
                             )}

                             <div className="mb-8">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{fmt(plan.price_monthly)}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                                </div>
                                {months > 1 && (
                                    <p className="text-[10px] font-black text-primary mt-2 uppercase tracking-widest">Billed as {fmt(total)} every cycle</p>
                                )}
                             </div>

                             <ul className="space-y-4 mb-10 flex-1">
                                {[
                                    { label: `${plan.max_staff === 0 ? 'Unlimited' : plan.max_staff} Staff Members`, icon: UserCircle },
                                    { label: `${plan.max_menu_items === 0 ? 'Unlimited' : plan.max_menu_items} Menu Entries`, icon: Stack },
                                    { label: `${plan.max_tables === 0 ? 'Unlimited' : plan.max_tables} Physical Tables`, icon: Table },
                                    ...(plan.features || []).map(f => ({ label: f, icon: CheckCircle }))
                                ].map((feat, fidx) => (
                                    <li key={fidx} className="flex items-center gap-3">
                                        <feat.icon size={18} weight="bold" className={cn("flex-shrink-0", isPro ? "text-primary" : "text-slate-300")} />
                                        <span className="text-xs font-bold text-slate-600">{feat.label}</span>
                                    </li>
                                ))}
                             </ul>

                             <Button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={!!working || isCurrent}
                                variant={isCurrent ? 'secondary' : 'primary'}
                                className={cn(
                                    "w-full h-14 rounded-2xl uppercase font-black text-[10px] tracking-widest shadow-xl transition-all",
                                    isCurrent ? "bg-slate-900 text-white border-transparent" : "shadow-primary/20"
                                )}
                             >
                                 {working === plan.id ? (
                                    <CircleNotch size={20} className="animate-spin" />
                                 ) : isCurrent ? (
                                    <div className="flex items-center gap-2"><Crown size={18} weight="bold" /> CURRENT PLAN</div>
                                 ) : (
                                    "UPGRADE ACCESS"
                                 )}
                             </Button>
                        </Card>
                    )
                })}
            </div>
      </div>
    </div>
  )
}
