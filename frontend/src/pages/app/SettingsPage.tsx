import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getRestaurant,
  updateRestaurant,
  type RestaurantSettings,
} from '@/services/restaurantService'
import { 
    Buildings, SealCheck, Globe, CurrencyDollar, 
    Clock, Camera, ShieldCheck, RocketLaunch,
    Crown, UsersThree, ListChecks, ArrowsClockwise,
    ArrowCircleRight,
    MapPin,
    Phone,
    EnvelopeSimple
} from "@phosphor-icons/react"
import { Toast } from '@/lib/swal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const schema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(150),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
})
type FormData = z.infer<typeof schema>

const TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'UTC']
const CURRENCIES = ['IDR', 'USD', 'MYR', 'SGD']

const PLAN_STATUS: Record<string, string> = {
  active: 'PRO ACTIVE',
  trial: 'TRIAL PERIOD',
  expired: 'EXPIRED',
  cancelled: 'CANCELLED',
}

function limitLabel(val: number | null | undefined) {
  if (!val || val === 0) return '∞'
  return val
}

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    getRestaurant()
      .then((r) => {
        setRestaurant(r)
        setLogoPreview(r.logo_url ?? null)
        reset({
          name: r.name,
          email: r.email ?? '',
          phone: r.phone ?? '',
          address: r.address ?? '',
          timezone: r.timezone ?? 'Asia/Jakarta',
          currency: r.currency ?? 'IDR',
        })
      })
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const fd = new FormData()
    fd.append('_method', 'PUT')
    Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''))
    if (fileRef.current?.files?.[0]) fd.append('logo', fileRef.current.files[0])

    try {
      const updated = await updateRestaurant(fd)
      setRestaurant(updated)
      setLogoPreview(updated.logo_url ?? null)
      if (fileRef.current) fileRef.current.value = ''
      Toast.fire({ icon: 'success', title: 'Global settings updated' })
    } catch (err: any) {
      const msg = err.response?.data?.message
      Toast.fire({
        icon: 'error',
        title: 'Save failed',
        text: msg ?? 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Loading Config...</span>
        </div>
    )

  const sub = restaurant?.subscription
  const plan = sub?.plan

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-in">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Admin Preferences</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Settings</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Configure your brand, subscription and localized defaults.
           </p>
        </div>
        <div className="flex items-center gap-3">
             <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="shadow-xl shadow-primary/20 rounded-2xl h-12 px-8"
             >
                {saving ? 'Syncing...' : 'Save All Changes'}
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Profile & Branding */}
        <div className="lg:col-span-8 space-y-10">
             <Card className="p-8 border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Buildings size={20} weight="duotone" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter">Restaurant Profile</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Brand Identity / Logo */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
                         <div className="relative group">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    className="w-24 h-24 object-contain rounded-3xl bg-white border border-slate-100 shadow-xl"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                    <Buildings size={32} weight="duotone" />
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            >
                                <Camera size={20} weight="bold" />
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) setLogoPreview(URL.createObjectURL(f))
                                }}
                            />
                         </div>
                         <div className="flex-1">
                            <h3 className="text-sm font-black text-slate-900 mb-1">Brand Identity</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px]">
                                Your logo appears on public menus, receipts, and order notifications.
                            </p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Official Name</label>
                             <Input {...register('name')} placeholder="The Gourmet Bistro" className="h-12 font-bold" />
                             {errors.name && <p className="text-[10px] font-black text-danger mt-2">{errors.name.message}</p>}
                        </div>

                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Contact Email</label>
                             <div className="relative">
                                <Input {...register('email')} type="email" placeholder="admin@restaurant.com" className="h-12 pl-12 font-bold" />
                                <EnvelopeSimple size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                             </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Hotline / Whatsapp</label>
                            <div className="relative">
                                <Input {...register('phone')} placeholder="+62 821..." className="h-12 pl-12 font-bold" />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Physical Address</label>
                            <div className="relative">
                                 <textarea
                                    {...register('address')}
                                    rows={3}
                                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 pl-12 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 placeholder:text-slate-300 resize-none outline-none"
                                    placeholder="Enter full street address..."
                                />
                                <MapPin size={18} className="absolute left-4 top-4 text-slate-300 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-slate-900/5 flex items-center justify-center text-slate-400">
                            <Globe size={20} weight="duotone" />
                         </div>
                         <h2 className="text-xl font-black text-slate-900 tracking-tighter">Localization</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Operating Timezone</label>
                            <div className="relative">
                                <select
                                    {...register('timezone')}
                                    className="w-full h-12 rounded-2xl border border-slate-200 px-5 pl-12 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 bg-slate-50 appearance-none outline-none cursor-pointer"
                                >
                                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                                <Clock size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">System Currency</label>
                            <div className="relative">
                                <select
                                    {...register('currency')}
                                    className="w-full h-12 rounded-2xl border border-slate-200 px-5 pl-12 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 bg-slate-50 appearance-none outline-none cursor-pointer"
                                >
                                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <CurrencyDollar size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </form>
             </Card>
        </div>

        {/* Right Column: Subscription & Limits */}
        <div className="lg:col-span-4 space-y-8">
            {/* Account Status Card */}
            <Card className="p-8 bg-slate-900 text-white border-transparent relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-primary">
                            <Crown size={28} weight="duotone" />
                        </div>
                         <Badge variant="glass" className="text-white border-white/20">
                            {sub ? PLAN_STATUS[sub.status] : 'FREE PLAN'}
                         </Badge>
                    </div>

                    <h2 className="text-2xl font-black tracking-tighter mb-1">{plan?.name || "Standard Tier"}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-6">
                        {sub?.ends_at ? `Expires ${new Date(sub.ends_at).toLocaleDateString()}` : 'Lifetime Access'}
                    </p>

                    <div className="space-y-5 mb-8">
                        {[
                            { label: 'Cloud Menu Items', val: plan?.max_menu_items, icon: RocketLaunch },
                            { label: 'Active Floor Tables', val: plan?.max_tables, icon: ListChecks },
                            { label: 'Team Accounts', val: plan?.max_staff, icon: UsersThree },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                                        <item.icon size={16} weight="duotone" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                                </div>
                                <span className="text-sm font-black">{limitLabel(item.val)}</span>
                            </div>
                        ))}
                    </div>

                    <Button variant="primary" className="w-full h-12 rounded-2xl group">
                        UPGRADE POWER <ArrowCircleRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </Card>

            {/* Security Quick Actions */}
            <Card className="p-8 border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck size={20} weight="duotone" className="text-success" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tighter uppercase tracking-widest">Trust & Security</h3>
                </div>
                <div className="space-y-3">
                    <button className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-left flex items-center justify-between group">
                        Change Root Password <ArrowCircleRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-left flex items-center justify-between group">
                        Session History <ArrowCircleRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  )
}
