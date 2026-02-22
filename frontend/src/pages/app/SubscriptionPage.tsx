import { useEffect, useState } from 'react'
import { Clock, Loader2, RefreshCw, BadgeCheck, AlertTriangle } from 'lucide-react'
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  type SubscriptionPlan,
  type CurrentSubscription,
} from '@/services/subscriptionService'
import { Toast, confirmAct } from '@/lib/swal'

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
    trialing: { label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
    past_due: { label: 'Jatuh Tempo', cls: 'bg-yellow-100 text-yellow-700' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-600' },
    expired: { label: 'Kadaluarsa', cls: 'bg-red-100 text-red-700' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  )
}

function planColor(name: string) {
  if (name === 'enterprise') return 'border-violet-400 bg-violet-50'
  if (name === 'pro') return 'border-orange-400 bg-orange-50'
  return 'border-gray-200 bg-white'
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
      Toast.fire({ icon: 'success', title: 'Langganan berhasil diaktifkan!' })
    } catch {
      Toast.fire({
        icon: 'error',
        title: 'Gagal mengaktifkan langganan',
        text: 'Silakan coba lagi.',
      })
    } finally {
      setWorking(null)
    }
  }

  const handleCancel = async () => {
    const result = await confirmAct(
      'Langganan akan dihentikan dan fitur premium tidak bisa digunakan lagi.',
      'Ya, Batalkan Langganan'
    )
    if (!result.isConfirmed) return
    setWorking('cancel')
    try {
      const updated = await cancelSubscription()
      setSub(updated)
      Toast.fire({ icon: 'success', title: 'Langganan berhasil dibatalkan' })
    } catch {
      Toast.fire({ icon: 'error', title: 'Gagal membatalkan langganan' })
    } finally {
      setWorking(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
  }

  const progressPct = sub ? Math.min(100, Math.max(0, (sub.days_remaining / 30) * 100)) : 0

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Langganan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola paket berlangganan restoran Anda</p>
      </div>

      {/* Current subscription card */}
      {sub ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">Paket {sub.plan?.name ?? '—'}</h2>
                {statusBadge(sub.status)}
              </div>
              <p className="text-sm text-gray-500">
                {sub.ends_at
                  ? `Berlaku hingga ${new Date(sub.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Tidak ada tanggal berakhir'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
              <Clock size={16} />
              {sub.days_remaining} hari lagi
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Sisa masa aktif</span>
              <span>{sub.days_remaining} / 30 hari</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progressPct <= 20
                    ? 'bg-red-500'
                    : progressPct <= 50
                      ? 'bg-yellow-400'
                      : 'bg-green-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Plan limits */}
          {sub.plan && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              {[
                {
                  label: 'Maks. Staff',
                  value: sub.plan.max_staff === 0 ? '∞' : sub.plan.max_staff,
                },
                {
                  label: 'Maks. Menu',
                  value: sub.plan.max_menu_items === 0 ? '∞' : sub.plan.max_menu_items,
                },
                {
                  label: 'Maks. Meja',
                  value: sub.plan.max_tables === 0 ? '∞' : sub.plan.max_tables,
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Expiring soon warning */}
          {sub.is_expiring && sub.is_active && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-2.5 rounded-xl">
              <AlertTriangle size={15} />
              Langganan Anda akan berakhir dalam <strong>{sub.days_remaining} hari</strong>. Segera
              perbarui!
            </div>
          )}

          {/* Cancel button */}
          {sub.is_active && sub.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              disabled={working === 'cancel'}
              className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
            >
              {working === 'cancel' ? 'Membatalkan...' : 'Batalkan langganan'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3 rounded-xl">
          Tidak ada langganan aktif. Pilih paket di bawah untuk memulai.
        </div>
      )}

      {/* Plans section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Paket</h2>

        {/* Month selector */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-gray-600">Durasi:</span>
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-3 py-1 text-sm rounded-lg border transition ${
                months === m
                  ? 'bg-orange-500 border-orange-500 text-white font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {m} {m === 1 ? 'Bulan' : 'Bulan'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = sub?.plan?.id === plan.id && sub?.is_active
            const total = plan.price_monthly * months
            return (
              <div
                key={plan.id}
                className={`relative border-2 rounded-2xl p-5 flex flex-col gap-4 transition ${planColor(plan.name)} ${isCurrent ? 'ring-2 ring-orange-400' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-gray-900 capitalize">{plan.name}</h3>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {fmt(plan.price_monthly)}
                    <span className="text-sm font-normal text-gray-500">/bln</span>
                  </p>
                  {months > 1 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Total {months} bulan: {fmt(total)}
                    </p>
                  )}
                </div>

                <ul className="space-y-1.5 text-sm text-gray-600 flex-1">
                  <li className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-green-500 flex-shrink-0" />
                    Staff: {plan.max_staff === 0 ? 'Unlimited' : `maks. ${plan.max_staff}`}
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-green-500 flex-shrink-0" />
                    Menu: {plan.max_menu_items === 0 ? 'Unlimited' : `maks. ${plan.max_menu_items}`}
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck size={14} className="text-green-500 flex-shrink-0" />
                    Meja: {plan.max_tables === 0 ? 'Unlimited' : `maks. ${plan.max_tables}`}
                  </li>
                  {(plan.features ?? []).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <BadgeCheck size={14} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!working || isCurrent}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60'
                  }`}
                >
                  {working === plan.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  {isCurrent
                    ? 'Paket Aktif'
                    : sub?.is_active
                      ? 'Ganti ke Paket Ini'
                      : 'Pilih Paket'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
