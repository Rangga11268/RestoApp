import { useEffect, useState } from 'react'
import {
  UserPlus,
  Pencil,
  Trash,
  ToggleLeft,
  ToggleRight,
  CircleNotch,
  ChefHat,
  UserGear,
  CreditCard,
  EnvelopeSimple,
  Phone,
  ClockCounterClockwise,
  UserCircle,
  Key,
  ArrowsClockwise,
  CheckCircle,
} from "@phosphor-icons/react"
import Modal from '@/components/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
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
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Constants ─────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  manager: {
    label: 'Manager',
    icon: UserGear,
    color: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  cashier: {
    label: 'Cashier',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  kitchen: {
    label: 'Kitchen',
    icon: ChefHat,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
}

const emptyForm: StaffFormData = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'cashier',
  phone: '',
}

// ─── Main page ────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  
  const [form, setForm] = useState<StaffFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [working, setWorking] = useState<number | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const data = await getStaff()
      setStaff(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const openCreate = () => {
    setEditingStaff(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s)
    setForm({
      name: s.name,
      email: s.email,
      role: s.role,
      phone: s.phone ?? '',
      password: '',
      password_confirmation: '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Valid email is required'
    if (!editingStaff && !form.password) e.password = 'Password is required for new staff'
    if (form.password && form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password && form.password !== form.password_confirmation)
      e.password_confirmation = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (editingStaff) {
        const updated = await updateStaff(editingStaff.id, form)
        setStaff((prev) => prev.map((s) => (s.id === editingStaff.id ? updated : s)))
        Toast.fire({ icon: 'success', title: 'Member profiles updated' })
      } else {
        const created = await createStaff(form)
        setStaff((prev) => [...prev, created])
        Toast.fire({ icon: 'success', title: 'New member welcomed!' })
      }
      setModalOpen(false)
    } catch (err: any) {
      const res = err.response?.data
      if (res?.errors) {
        const fieldErrors: Record<string, string> = {}
        Object.entries(res.errors).forEach(([k, v]: any) => { fieldErrors[k] = v[0] })
        setErrors(fieldErrors)
      } else {
        Toast.fire({ icon: 'error', title: 'Error', text: res?.message || 'Failed to save' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (s: StaffMember) => {
    setWorking(s.id)
    try {
      const updated = await toggleStaff(s.id)
      setStaff((prev) => prev.map((x) => (x.id === s.id ? updated : x)))
      Toast.fire({ 
          icon: 'success', 
          title: `Account ${updated.is_active ? 'Activated' : 'Suspended'}`,
          timer: 1500,
          showConfirmButton: false
      })
    } finally {
      setWorking(null)
    }
  }

  const handleDelete = async (s: StaffMember) => {
    const result = await confirmDelete(s.name)
    if (!result.isConfirmed) return
    setWorking(s.id)
    try {
      await deleteStaff(s.id)
      setStaff((prev) => prev.filter((x) => x.id !== s.id))
      Toast.fire({ icon: 'success', title: 'Account removed' })
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in selection:bg-primary/20">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Admin & Ops</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Team Directory</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Manage access levels and monitor staff activity.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hidden md:flex items-center gap-2">
            <span className="text-primary font-black">{staff.length}</span> Active Members
          </div>
          <Button
            onClick={openCreate}
            className="shadow-xl shadow-primary/20 rounded-2xl px-6"
          >
            <UserPlus size={20} weight="bold" className="mr-2" /> Invite Member
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
          <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
          <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Directory...</span>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-40 bg-white/50 backdrop-blur rounded-[48px] border border-slate-100 border-dashed flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <UserCircle size={48} weight="duotone" className="text-slate-200" />
          </div>
          <p className="font-black text-2xl text-slate-900 tracking-tight">
            Team is Empty
          </p>
          <p className="text-slate-400 text-sm font-medium mt-2 mb-8 max-w-[280px]">
            You're currently flying solo! Add your staff to delegate tasks and see performance.
          </p>
          <Button
            onClick={openCreate}
            variant="secondary"
            className="rounded-2xl px-8"
          >
            <UserPlus size={18} weight="bold" className="mr-2" /> Start Onboarding
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staff.map((s) => {
            const Config = ROLE_CONFIG[s.role] || { label: s.role, icon: UserCircle, color: 'bg-slate-100' }
            const Icon = Config.icon
            return (
              <Card
                key={s.id}
                animated
                className={cn(
                    "p-0 flex flex-col overflow-hidden group transition-all duration-300",
                    !s.is_active && "opacity-60 grayscale"
                )}
              >
                {/* Visual Header */}
                <div className="p-8 pb-4 flex items-start gap-6">
                    <div className="relative">
                         <div className="w-20 h-20 rounded-[28px] bg-slate-900 border-4 border-white shadow-2xl flex items-center justify-center text-white text-2xl font-black">
                            {s.name[0].toUpperCase()}
                         </div>
                         <div className={cn(
                             "absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg",
                             s.is_active ? "bg-success text-white" : "bg-slate-200 text-slate-400"
                         )}>
                             {s.is_active ? <CheckCircle size={14} weight="bold" /> : <ToggleLeft size={14} weight="bold" />}
                         </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter truncate">{s.name}</h3>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", Config.color)}>
                                {Config.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="px-8 py-4 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-slate-400">
                        <EnvelopeSimple size={16} weight="bold" className="text-slate-200" />
                        <span className="text-xs font-bold truncate">{s.email}</span>
                    </div>
                    {s.phone && (
                         <div className="flex items-center gap-2.5 text-slate-400">
                            <Phone size={16} weight="bold" className="text-slate-200" />
                            <span className="text-xs font-bold">{s.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 text-slate-400">
                        <ClockCounterClockwise size={16} weight="bold" className="text-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-tight">
                            Last Active: {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : 'Never'}
                        </span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 p-6 pt-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
                    <button
                        onClick={() => handleToggle(s)}
                        disabled={working === s.id}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            s.is_active 
                                ? "bg-white border-slate-100 text-slate-400 hover:text-danger hover:border-danger/10"
                                : "bg-success/5 border-success/10 text-success hover:bg-success hover:text-white"
                        )}
                    >
                        {working === s.id ? (
                            <CircleNotch size={14} className="animate-spin" />
                        ) : s.is_active ? (
                            <ToggleRight size={18} weight="fill" />
                        ) : (
                            "Activate"
                        )}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openEdit(s)}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 transition-all"
                        >
                            <Pencil size={18} weight="bold" />
                        </button>
                        <button
                            onClick={() => handleDelete(s)}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-danger hover:border-danger/20 transition-all"
                        >
                            <Trash size={18} weight="bold" />
                        </button>
                    </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Staff Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? 'Update Member Profile' : 'Onboard New Staff'}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Identity</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full Name"
                className="h-12 font-bold"
              />
              {errors.name && <p className="text-[10px] font-black text-danger mt-2 pl-1">⚠ {errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Email</label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@work.com"
                        className="h-12 font-bold"
                    />
                    {errors.email && <p className="text-[10px] font-black text-danger mt-2 pl-1">⚠ {errors.email}</p>}
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Work Phone</label>
                    <Input
                        value={form.phone}
                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="08xx..."
                        className="h-12 font-bold"
                    />
                </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Organizational Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-12 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 bg-slate-50 cursor-pointer appearance-none outline-none"
              >
                <option value="manager">Manager / Admin</option>
                <option value="cashier">Frontend Cashier</option>
                <option value="kitchen">Kitchen Staff</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {editingStaff ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative">
                         <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="••••••••"
                            className="h-12 font-bold"
                        />
                        <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm</label>
                    <Input
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                        placeholder="••••••••"
                        className="h-12 font-bold"
                    />
                </div>
            </div>
            {errors.password && <p className="text-[10px] font-black text-danger pl-1">⚠ {errors.password}</p>}
            {errors.password_confirmation && <p className="text-[10px] font-black text-danger pl-1">⚠ {errors.password_confirmation}</p>}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                variant="primary" 
                className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20" 
                disabled={saving}
            >
              {saving ? <CircleNotch size={20} className="animate-spin" /> : editingStaff ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function CheckCircle({ size, className, weight }: any) {
    return <UserCircle size={size} className={className} weight={weight || "bold"} />
}
