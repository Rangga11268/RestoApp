import { useEffect, useState } from 'react'
import {
  UserPlus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  ChefHat,
  UserCog,
  CreditCard,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaff,
  type StaffMember,
  type StaffFormData,
} from '@/services/staffService'
import { Toast, confirmDelete } from '@/lib/swal'

// ─── Helpers ─────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  manager: {
    label: 'Manager',
    icon: <UserCog size={13} />,
    cls: 'bg-violet-100 text-violet-700',
  },
  cashier: {
    label: 'Kasir',
    icon: <CreditCard size={13} />,
    cls: 'bg-blue-100 text-blue-700',
  },
  kitchen: {
    label: 'Dapur',
    icon: <ChefHat size={13} />,
    cls: 'bg-orange-100 text-orange-700',
  },
}

function RoleBadge({ role }: { role: string }) {
  const r = ROLE_LABELS[role] ?? {
    label: role,
    icon: null,
    cls: 'bg-gray-100 text-gray-600',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.cls}`}
    >
      {r.icon}
      {r.label}
    </span>
  )
}

const emptyForm: StaffFormData = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'cashier',
  phone: '',
}

// ─── Modal ────────────────────────────────────────────────

interface ModalProps {
  initial?: StaffMember | null
  onSave: (data: StaffFormData, id?: number) => Promise<void>
  onClose: () => void
}

function StaffModal({ initial, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<StaffFormData>(
    initial
      ? {
          name: initial.name,
          email: initial.email,
          role: initial.role,
          phone: initial.phone ?? '',
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: keyof StaffFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.email.trim()) e.email = 'Email wajib diisi'
    if (!initial && !form.password) e.password = 'Password wajib diisi untuk staff baru'
    if (form.password && form.password !== form.password_confirmation)
      e.password_confirmation = 'Konfirmasi password tidak cocok'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave(form, initial?.id)
      onClose()
    } catch (err: unknown) {
      const res = (
        err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      )?.response?.data
      if (res?.errors) {
        const fieldErrors: Record<string, string> = {}
        Object.entries(res.errors).forEach(([k, v]) => {
          fieldErrors[k] = v[0]
        })
        setErrors(fieldErrors)
        Toast.fire({ icon: 'error', title: 'Validasi gagal', text: 'Cek isian form' })
      } else {
        const msg = res?.message ?? 'Gagal menyimpan data.'
        setErrors({ _global: msg })
        Toast.fire({ icon: 'error', title: 'Terjadi kesalahan', text: msg })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{initial ? 'Edit Staff' : 'Tambah Staff'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors._global && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {errors._global}
            </p>
          )}

          {[
            {
              key: 'name' as const,
              label: 'Nama Lengkap',
              type: 'text',
              placeholder: 'Nama staff',
            },
            {
              key: 'email' as const,
              label: 'Email',
              type: 'email',
              placeholder: 'email@restoran.com',
            },
            {
              key: 'phone' as const,
              label: 'No. Telepon (opsional)',
              type: 'text',
              placeholder: '08xx',
            },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <Input
                type={type}
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
              />
              {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
            </div>
          ))}

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="manager">Manager</option>
              <option value="cashier">Kasir</option>
              <option value="kitchen">Dapur</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {initial ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
            </label>
            <Input
              type="password"
              value={form.password ?? ''}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Min. 8 karakter"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {(form.password || !initial) && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Konfirmasi Password
              </label>
              <Input
                type="password"
                value={form.password_confirmation ?? ''}
                onChange={(e) => set('password_confirmation', e.target.value)}
                placeholder="Ulangi password"
              />
              {errors.password_confirmation && (
                <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{
    open: boolean
    staff?: StaffMember | null
  }>({ open: false })
  const [working, setWorking] = useState<number | null>(null)

  const reload = () => {
    setLoading(true)
    getStaff()
      .then(setStaff)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const handleSave = async (data: StaffFormData, id?: number) => {
    if (id) {
      const updated = await updateStaff(id, data)
      setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)))
      Toast.fire({ icon: 'success', title: 'Data staff berhasil diperbarui' })
    } else {
      const created = await createStaff(data)
      setStaff((prev) => [...prev, created])
      Toast.fire({ icon: 'success', title: 'Staff berhasil ditambahkan' })
    }
  }

  const handleToggle = async (id: number) => {
    setWorking(id)
    try {
      const updated = await toggleStaff(id)
      setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)))
    } finally {
      setWorking(null)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    const result = await confirmDelete(name)
    if (!result.isConfirmed) return
    setWorking(id)
    try {
      await deleteStaff(id)
      setStaff((prev) => prev.filter((s) => s.id !== id))
      Toast.fire({ icon: 'success', title: 'Staff berhasil dihapus' })
    } catch {
      Toast.fire({ icon: 'error', title: 'Gagal menghapus staff' })
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun staff restoran Anda</p>
        </div>
        <Button
          onClick={() => setModal({ open: true, staff: null })}
          className="inline-flex items-center gap-2"
        >
          <UserPlus size={16} />
          Tambah Staff
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada staff. Tambahkan staff pertama Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Nama</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Login Terakhir
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((s) => (
                  <tr key={s.id} className={`hover:bg-gray-50 ${s.deleted_at ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {s.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{s.email}</td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={s.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {s.last_login_at
                        ? new Date(s.last_login_at).toLocaleDateString('id-ID')
                        : 'Belum pernah'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleToggle(s.id)}
                          disabled={working === s.id}
                          title={s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          className="text-gray-400 hover:text-orange-500 transition disabled:opacity-50"
                        >
                          {working === s.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : s.is_active ? (
                            <ToggleRight size={18} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => setModal({ open: true, staff: s })}
                          title="Edit"
                          className="text-gray-400 hover:text-blue-600 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={working === s.id}
                          title="Hapus"
                          className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <StaffModal
          initial={modal.staff}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
