import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getRestaurant,
  updateRestaurant,
  type RestaurantSettings,
} from '@/services/restaurantService'
import { Building2, BadgeCheck } from 'lucide-react'
import { Toast } from '@/lib/swal'

const schema = z.object({
  name: z.string().min(1, 'Nama restoran wajib diisi').max(150),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
})
type FormData = z.infer<typeof schema>

const TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'UTC']
const CURRENCIES = ['IDR', 'USD', 'MYR', 'SGD']

const PLAN_STATUS: Record<string, string> = {
  active: 'Aktif',
  trial: 'Trial',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
}
const PLAN_STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-blue-100 text-blue-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function limitLabel(val: number | null | undefined) {
  if (!val || val === 0) return 'Unlimited'
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
      Toast.fire({ icon: 'success', title: 'Pengaturan berhasil disimpan' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      Toast.fire({
        icon: 'error',
        title: 'Gagal menyimpan',
        text: msg ?? 'Terjadi kesalahan. Silakan coba lagi.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )

  const sub = restaurant?.subscription
  const plan = sub?.plan

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Restoran</h1>

      {/* Subscription info card */}
      {sub && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <BadgeCheck className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800">{plan?.name ?? 'Free'}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_STATUS_COLOR[sub.status] ?? 'bg-gray-100 text-gray-500'}`}
                >
                  {PLAN_STATUS[sub.status] ?? sub.status}
                </span>
              </div>
              {sub.ends_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Berakhir:{' '}
                  {new Date(sub.ends_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
              {plan && (
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>
                    Menu: <strong>{limitLabel(plan.max_menu_items)}</strong>
                  </span>
                  <span>
                    Meja: <strong>{limitLabel(plan.max_tables)}</strong>
                  </span>
                  <span>
                    Staff: <strong>{limitLabel(plan.max_staff)}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main form card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="text-orange-500" size={18} />
          <h2 className="font-semibold text-gray-700">Informasi Restoran</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Restoran</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo"
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl">
                  🏠
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setLogoPreview(URL.createObjectURL(f))
                }}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">PNG/JPG, max 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Restoran <span className="text-red-400">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                {...register('phone')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                placeholder="08x..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              {...register('address')}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                {...register('timezone')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
              <select
                {...register('currency')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
