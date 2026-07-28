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
    Clock, Camera, ShieldCheck, ArrowsClockwise,
    ArrowCircleRight, Warning,
    MapPin,
    Phone,
    EnvelopeSimple
} from "@phosphor-icons/react"
import { Toast } from '@/lib/swal'
import { useAuthStore } from '@/stores/authStore'
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

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    setLoading(true)
    setError(null)
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
      .catch(() => setError('Gagal memuat pengaturan. Periksa koneksi server.'))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''))
    if (fileRef.current?.files?.[0]) fd.append('logo', fileRef.current.files[0])

    try {
      const updated = await updateRestaurant(fd)
      setRestaurant(updated)
      setLogoPreview(updated.logo_url ?? null)
      if (fileRef.current) fileRef.current.value = ''

      const { user, setUser } = useAuthStore.getState()
      if (user) setUser({ ...user, restaurant: updated as any })
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = updated.logo_url ?? '/vite.svg'

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

  if (error)
    return (
      <div className="w-full max-w-5xl mx-auto space-y-10">
        <div className="flex items-start gap-4 p-5 bg-danger/5 border border-danger/10 rounded-lg">
          <Warning size={24} weight="bold" className="text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-danger text-xs uppercase tracking-widest mb-1">Gagal memuat data</p>
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-danger hover:text-danger/70 font-bold text-xs uppercase tracking-widest shrink-0 self-start">
            Coba Lagi
          </button>
        </div>
      </div>
    )

  if (loading)
    return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <ArrowsClockwise size={48} className="animate-spin mb-4 text-accent opacity-20" />
            <span className="font-semibold text-xs uppercase tracking-[0.2em] animate-pulse">Loading Config...</span>
        </div>
    )

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Admin Preferences</Badge>
           <h1 className="text-4xl font-semibold text-ink tracking-tighter">System Settings</h1>
            <p className="text-sm font-medium text-ink-2 mt-1">
              Configure your brand and localized defaults.
            </p>
        </div>
        <div className="flex items-center gap-3">
             <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="rounded-lg h-12 px-8"
             >
                {saving ? 'Syncing...' : 'Save All Changes'}
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
             <Card className="p-8 border-rule-light">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent">
                        <Buildings size={20} weight="bold" />
                    </div>
                    <h2 className="text-md font-semibold text-ink tracking-tighter">Restaurant Profile</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Brand Identity / Logo */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 bg-paper-2/50 rounded-lg border border-rule-light">
                         <div className="relative group">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    className="w-24 h-24 object-contain rounded-xl bg-surface border border-rule-light"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-surface border-2 border-dashed border-rule flex flex-col items-center justify-center text-slate-300">
                                    <Buildings size={32} weight="bold" />
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center"
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
                            <h3 className="text-sm font-semibold text-ink mb-1">Brand Identity</h3>
                            <p className="text-xs text-ink-2 font-medium leading-relaxed max-w-[280px]">
                                Your logo appears on public menus, receipts, and order notifications.
                            </p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                             <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">Official Name</label>
                             <Input {...register('name')} placeholder="The Gourmet Bistro" className="h-12 font-bold" />
                             {errors.name && <p className="text-[10px] font-semibold text-danger mt-2">{errors.name.message}</p>}
                        </div>

                        <div>
                             <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">Contact Email</label>
                             <div className="relative">
                                <Input {...register('email')} type="email" placeholder="admin@restaurant.com" className="h-12 pl-12 font-bold" />
                                <EnvelopeSimple size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" />
                             </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">Hotline / Whatsapp</label>
                            <div className="relative">
                                <Input {...register('phone')} placeholder="+62 821..." className="h-12 pl-12 font-bold" />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">Physical Address</label>
                            <div className="relative">
                                 <textarea
                                    {...register('address')}
                                    rows={3}
                                    className="w-full rounded-lg border border-rule px-5 py-4 pl-12 text-sm font-bold text-ink focus:ring-4 focus:ring-accent/15 bg-paper-2 placeholder:text-slate-300 resize-none outline-none"
                                    placeholder="Enter full street address..."
                                />
                                <MapPin size={18} className="absolute left-4 top-4 text-ink-2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-slate-900/5 flex items-center justify-center text-ink-2">
                            <Globe size={20} weight="bold" />
                         </div>
                         <h2 className="text-md font-semibold text-ink tracking-tighter">Localization</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">Operating Timezone</label>
                            <div className="relative">
                                <select
                                    {...register('timezone')}
                                    className="w-full h-12 rounded-lg border border-rule px-5 pl-12 text-sm font-semibold text-ink focus:ring-4 focus:ring-accent/15 bg-paper-2 appearance-none outline-none cursor-pointer"
                                >
                                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                                <Clock size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2 pl-1">System Currency</label>
                            <div className="relative">
                                <select
                                    {...register('currency')}
                                    className="w-full h-12 rounded-lg border border-rule px-5 pl-12 text-sm font-semibold text-ink focus:ring-4 focus:ring-accent/15 bg-paper-2 appearance-none outline-none cursor-pointer"
                                >
                                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <CurrencyDollar size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </form>
             </Card>
        </div>

      </div>
    </div>
  )
}