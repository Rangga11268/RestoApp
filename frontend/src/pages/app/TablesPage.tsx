import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash,
  ArrowsClockwise,
  DownloadSimple,
  QrCode,
  Warning,
  Chair,
  Users,
  Printer,
} from '@phosphor-icons/react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import QRCode from 'react-qr-code'
import Modal from '@/components/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateQr,
  type Table,
} from '@/services/tableService'
import { Toast, confirmDelete, handleApiError } from '@/lib/swal'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const schema = z.object({
  name: z.string().min(1, 'Nama meja wajib diisi').max(50),
  capacity: z.coerce.number().min(1, 'Minimal 1 orang'),
  status: z.enum(['available', 'occupied', 'reserved']).optional(),
  is_active: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
}

function buildQrUrl(path: string): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin
  return base + path
}

function isLocalhost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

function downloadQrSvg(svgRef: React.RefObject<HTMLDivElement | null>, tableName: string) {
  const svgEl = svgRef.current?.querySelector('svg')
  if (!svgEl) return
  const serialized = new XMLSerializer().serializeToString(svgEl)
  const blob = new Blob([serialized], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `qr-${tableName}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Table | null>(null)
  const [qrTarget, setQrTarget] = useState<Table | null>(null)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const qrModalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setTables(await getTables())
    } catch {
      setError('Gagal memuat meja. Periksa koneksi server.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', capacity: 4, status: 'available', is_active: true })
    setModalOpen(true)
  }
  const openEdit = (t: Table) => {
    setEditing(t)
    reset({
      name: t.name,
      capacity: t.capacity,
      status: t.status as FormData['status'],
      is_active: t.is_active,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateTable(editing.id, data)
        Toast.fire({ icon: 'success', title: 'Table updated successfully' })
      } else {
        await createTable(data)
        Toast.fire({ icon: 'success', title: 'Table added successfully' })
      }
      setModalOpen(false)
      await load()
    } catch (err: unknown) {
      handleApiError(err)
    }
  }

  const handleDelete = async (t: Table) => {
    const result = await confirmDelete(t.name)
    if (!result.isConfirmed) return
    try {
      await deleteTable(t.id)
      Toast.fire({ icon: 'success', title: 'Table deleted successfully' })
      await load()
    } catch (err: unknown) {
      handleApiError(err)
    }
  }

  const doRegenerate = async (t: Table) => {
    setRegenerating(t.id)
    try {
      const updated = await regenerateQr(t.id)
      setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, qr_code: updated.qr_code } : x)))
      if (qrTarget?.id === t.id) setQrTarget({ ...qrTarget, qr_code: updated.qr_code })
    } finally {
      setRegenerating(null)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 selection:bg-accent/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Layout Management</Badge>
           <h1 className="text-4xl font-semibold text-ink tracking-tighter">Dining Tables</h1>
           <p className="text-sm font-medium text-ink-2 mt-1">
             Organize your restaurant floor and print smart QR codes for each table.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-surface border border-rule-light rounded-lg text-sm font-bold text-ink-2 hidden md:flex items-center gap-2">
            <span className="text-accent font-semibold">{tables.length}</span> Active Tables
          </div>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="rounded-lg px-6 bg-surface border-rule-light hidden md:flex"
          >
            <Printer size={20} weight="bold" className="mr-2" /> Print All QR
          </Button>
          <Button
            onClick={openCreate}
            className="rounded-lg px-6"
          >
            <Plus size={20} weight="bold" className="mr-2" /> Add Table
          </Button>
        </div>
      </div>

      {/* Warning: localhost access */}
      {isLocalhost() && !import.meta.env.VITE_APP_URL && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200/50 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900 flex-shrink-0">
              <Warning size={24} weight="bold" />
          </div>
          <div>
            <p className="font-semibold tracking-tight text-amber-900 uppercase text-[10px] tracking-[0.2em] mb-1 leading-none">Developer Notice</p>
            <p className="text-sm text-amber-900 font-bold leading-relaxed">
              QR Codes might not work on mobile devices while using <code className="bg-white px-1.5 rounded-md border border-amber-200">localhost</code>. 
              Please access via your network IP for mobile testing.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {error ? (
        <div className="flex items-start gap-4 p-5 bg-danger/5 border border-danger/10 rounded-lg">
          <Warning size={24} weight="bold" className="text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-danger text-xs uppercase tracking-widest mb-1">Gagal memuat data</p>
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
          <button onClick={load} className="text-danger hover:text-danger/70 font-bold text-xs uppercase tracking-widest shrink-0 self-start">
            Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface border border-rule rounded-lg overflow-hidden animate-pulse">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-40 bg-surface/50 backdrop-blur rounded-[48px] border border-rule-light border-dashed flex flex-col items-center">
          <div className="w-24 h-24 bg-paper-2 rounded-full flex items-center justify-center mb-6">
            <Chair size={48} weight="bold" className="text-slate-200" />
          </div>
          <p className="font-semibold text-lg text-ink tracking-tight">
            Empty Floor Plan
          </p>
          <p className="text-ink-2 text-sm font-medium mt-2 mb-8 max-w-[280px]">
            Ready to digitize? Add your first table and we'll generate the QR code automatically.
          </p>
          <Button
            onClick={openCreate}
            variant="secondary"
            className="rounded-lg px-8"
          >
            <Plus size={18} weight="bold" className="mr-2" /> Start Creating
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tables.map((t) => (
            <Card
              key={t.id}
              animated
              className={cn(
                  "p-0 flex flex-col overflow-hidden group transition-all",
                  !t.is_active && "opacity-60 grayscale"
              )}
            >
              {/* Header Card */}
              <div className="p-6 pb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-md font-semibold text-ink tracking-tighter">{t.name}</h3>
                  <div className="flex items-center gap-1.5 text-ink-2 mt-1">
                      <Users size={14} weight="bold" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t.capacity} Seats</span>
                  </div>
                </div>
                <Badge 
                    variant={t.status === 'available' ? 'success' : t.status === 'occupied' ? 'danger' : 'warning'}
                    className="text-[10px]"
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </Badge>
              </div>

              {/* QR Centerpiece */}
              <div className="px-6 py-6 flex flex-col items-center relative">
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-b from-transparent to-paper-2 opacity-40 -z-10 transition-colors",
                    t.status === 'occupied' ? 'to-danger/5' : t.status === 'available' ? 'to-success/5' : 'to-warning/5'
                )} />

                {t.qr_code ? (
                  <div
                    className="w-40 h-40 cursor-pointer flex items-center justify-center p-3 bg-surface rounded-xl border border-rule-light group-hover:scale-105 transition-transform"
                    onClick={() => setQrTarget(t)}
                  >
                    <QRCode value={buildQrUrl(t.qr_code)} size={136} level="M" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-paper-2 rounded-xl border border-rule-light border-dashed flex items-center justify-center text-slate-200">
                    <QrCode size={56} weight="bold" />
                  </div>
                )}
                
                <div className="mt-8 w-full flex gap-3">
                  <button
                    onClick={() => doRegenerate(t)}
                    disabled={regenerating === t.id}
                    className="flex-1 flex items-center justify-center h-10 bg-paper-2 text-ink-2 rounded-lg hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
                  >
                    <ArrowsClockwise
                      size={16}
                      weight="bold"
                      className={regenerating === t.id ? 'animate-spin' : ''}
                    />
                  </button>
                  {t.qr_code && (
                    <button
                      onClick={() => setQrTarget(t)}
                      className="flex-[2] flex items-center justify-center gap-2 h-10 bg-accent text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg hover:bg-accent-hover transition-all"
                    >
                      <DownloadSimple size={16} weight="bold" /> Download
                    </button>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-auto px-6 py-4 bg-paper-2/50 border-t border-rule-light flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-ink-2">
                  {t.is_active ? 'Active' : 'Disabled'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="w-10 h-10 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2 hover:text-accent hover:border-primary/20 transition-all"
                  >
                    <Pencil size={16} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="w-10 h-10 rounded-lg bg-surface border border-rule-light flex items-center justify-center text-ink-2 hover:text-danger hover:border-danger/20 transition-all"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Table Attributes' : 'Register New Table'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2">Table Identity</label>
              <Input
                {...register('name')}
                placeholder="cth: Table 5 / VIP A"
              />
              {errors.name && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2">Seating Capacity</label>
              <Input
                {...register('capacity')}
                type="number"
                min={1}
              />
              {errors.capacity && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.capacity.message}</p>
              )}
            </div>

            {editing && (
              <div>
                <label className="block text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2">Usage Status</label>
                <div className="relative">
                    <select
                        {...register('status')}
                        className="w-full h-12 rounded-lg border border-rule px-5 text-sm font-bold text-ink focus:ring-4 focus:ring-primary/10 focus:border-accent transition-all bg-paper-2 appearance-none cursor-pointer"
                    >
                        <option value="available">Available (Empty)</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                    </select>
                </div>
              </div>
            )}

            <label className="flex items-center gap-4 p-4 bg-paper-2 border border-rule-light rounded-lg cursor-pointer hover:bg-paper-2 transition-all group">
                <div className="relative flex-shrink-0">
                    <input
                        {...register('is_active')}
                        type="checkbox"
                        className="w-6 h-6 rounded-lg border-slate-300 text-accent focus:ring-accent/15 bg-surface transition-all cursor-pointer"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-ink tracking-tight leading-none mb-1">Active for Public</span>
                    <span className="text-[11px] font-medium text-ink-2">Allow customers to order from this table.</span>
                </div>
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-[2] rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : editing ? 'Update Changes' : 'Save Table'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR zoom modal */}
      <Modal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title={`Table QR : ${qrTarget?.name}`}
        size="sm"
      >
        {qrTarget?.qr_code && (
          <div className="flex flex-col items-center gap-8 py-6">
            <div
              ref={qrModalRef}
              className="p-8 bg-surface rounded-[40px] border border-rule-light shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <QRCode value={buildQrUrl(qrTarget.qr_code)} size={280} level="M" />
            </div>
            
            <div className="bg-paper-2 rounded-lg px-6 py-3.5 border border-rule-light w-full group relative overflow-hidden">
              <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-2">Public Link Access</p>
              <p className="text-xs font-mono font-bold text-ink truncate">
                {buildQrUrl(qrTarget.qr_code)}
              </p>
            </div>
            
            <Button
              onClick={() => downloadQrSvg(qrModalRef, qrTarget.name)}
              className="w-full flex items-center justify-center gap-3 h-14 font-black rounded-[28px] shadow-2xl shadow-primary/20"
            >
              <DownloadSimple size={20} weight="bold" /> Download Vector (SVG)
            </Button>
          </div>
        )}
      </Modal>

      {/* Print Template (Hidden from screen) */}
      <div id="qr-print-gallery" className="hidden print:block fixed inset-0 bg-white z-[999]">
         <style>{`
            @media print {
              header, nav, aside, .no-print, button, .modal-backdrop, [role="dialog"] { 
                display: none !important; 
              }
              body { background: white !important; margin: 0; padding: 0; }
              #qr-print-gallery { 
                display: block !important; 
                position: absolute; left: 0; top: 0; width: 100%;
              }
              .qr-card-print {
                page-break-inside: avoid;
                break-inside: avoid;
                border: 2px solid #f1f5f9;
                padding: 40px;
                text-align: center;
                border-radius: 40px;
                margin-bottom: 20px;
              }
            }
         `}</style>

         <div className="p-10">
            <div className="grid grid-cols-2 gap-8">
               {tables.filter(t => t.is_active && t.qr_code).map((t) => (
                  <div key={t.id} className="qr-card-print flex flex-col items-center">
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-ink tracking-tighter">{t.name}</h2>
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mt-1">Scan to Order</p>
                      </div>
                      <div className="p-6 border-4 border-slate-900 rounded-[40px] mb-6">
                        <QRCode value={buildQrUrl(t.qr_code!)} size={180} level="M" />
                      </div>
                      <div className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest leading-tight">
                         Proudly Powered by RestoApp SaaS<br/>
                         Premium Digital Dining Experience
                      </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
