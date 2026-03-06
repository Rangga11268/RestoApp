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
} from '@phosphor-icons/react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import QRCode from 'react-qr-code'
import Modal from '@/components/Modal'
import { Button, Input } from '@/components/ui'
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateQr,
  type Table,
} from '@/services/tableService'
import { Toast, confirmDelete, handleApiError } from '@/lib/swal'

const schema = z.object({
  name: z.string().min(1, 'Nama meja wajib diisi').max(50),
  capacity: z.coerce.number().min(1, 'Minimal 1 orang'),
  status: z.enum(['available', 'occupied', 'reserved']).optional(),
  is_active: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const STATUS_LABEL: Record<string, string> = {
  available: 'Tersedia',
  occupied: 'Terisi',
  reserved: 'Dipesan',
}
const STATUS_COLOR: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20',
  occupied: 'bg-rose-100 text-rose-700 ring-1 ring-rose-500/20',
  reserved: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/20',
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
    try {
      setTables(await getTables())
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
        Toast.fire({ icon: 'success', title: 'Meja berhasil diperbarui' })
      } else {
        await createTable(data)
        Toast.fire({ icon: 'success', title: 'Meja berhasil ditambahkan' })
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
      Toast.fire({ icon: 'success', title: 'Meja berhasil dihapus' })
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
    <div className="w-full max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Meja</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Kelola tata letak kapasitas & cetak QR Code meja otomatis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-600 shadow-sm hidden md:block">
            <span className="text-orange-500 mr-1">{tables.length}</span> Total Meja
          </div>
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/20 hover:scale-[1.02] rounded-xl px-5 transition-all text-sm font-bold border-0"
          >
            <Plus size={16} weight="bold" /> Tambah Meja Baru
          </Button>
        </div>
      </div>

      {/* Warning: akses via localhost */}
      {isLocalhost() && !import.meta.env.VITE_APP_URL && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50/80 backdrop-blur border border-amber-200/60 shadow-sm text-amber-800 rounded-2xl px-5 py-4 text-sm animate-pulse">
          <Warning size={20} weight="duotone" className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-extrabold tracking-tight text-amber-900">
              QR Code mungkin tidak bisa di-scan dari HP
            </p>
            <p className="text-amber-700 mt-1 font-medium">
              Kamu sedang mengakses via{' '}
              <code className="bg-white px-2 py-0.5 rounded-md font-mono text-amber-900 border border-amber-200 shadow-sm mx-1">
                localhost
              </code>
              . Gunakan Network IP (
              <code className="bg-white px-2 py-0.5 rounded-md font-mono text-amber-900 border border-amber-200 shadow-sm mx-1">
                http://192.168.x.x:5173
              </code>
              ) agar pelanggan restoran bisa melakukan akses ke link menu digital.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white/40 backdrop-blur rounded-3xl border border-gray-100 border-dashed">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-24 bg-white/50 backdrop-blur rounded-3xl border border-gray-100 border-dashed shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Chair size={36} weight="duotone" className="text-gray-300" />
          </div>
          <p className="font-extrabold text-gray-900 text-lg tracking-tight">
            Simulasi Ruang Makan Kosong
          </p>
          <p className="text-gray-400 text-sm font-medium mt-1 mb-5">
            Belum ada meja. Tambahkan spot agar pelanggan bisa scan QR.
          </p>
          <Button
            onClick={openCreate}
            variant="ghost"
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-sm font-bold rounded-xl px-5 py-2.5"
          >
            <Plus size={16} weight="bold" className="mr-2" /> Mulai Tambah Meja
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-3xl border shadow-sm hover:shadow-premium-hover flex flex-col transition-all duration-300 transform hover:-translate-y-1 ${!t.is_active ? 'opacity-50 grayscale hover:grayscale-0' : 'border-gray-100'}`}
            >
              {/* Header Box */}
              <div className="px-5 py-4 flex items-start justify-between border-b border-gray-50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{t.name}</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">{t.capacity} Kursi</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-extrabold ${STATUS_COLOR[t.status] ?? 'bg-gray-100 text-gray-500'}`}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {/* QR Centerpiece */}
              <div className="flex-1 flex flex-col items-center py-6 px-4 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-50/50 rounded-full blur-3xl -z-10 object-cover" />

                {t.qr_code ? (
                  <div
                    className="w-32 h-32 cursor-pointer flex items-center justify-center p-2 bg-white rounded-2xl shadow-premium border border-gray-100 hover:scale-105 transition-transform"
                    onClick={() => setQrTarget(t)}
                    title="Klik untuk perbesar"
                  >
                    <QRCode value={buildQrUrl(t.qr_code)} size={112} level="M" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-50 rounded-2xl flex border border-gray-100 border-dashed items-center justify-center text-gray-300">
                    <QrCode size={48} weight="duotone" />
                  </div>
                )}
                <div className="mt-5 w-full flex align-center gap-2">
                  <Button
                    onClick={() => doRegenerate(t)}
                    disabled={regenerating === t.id}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 bg-white border-gray-200 rounded-xl hover:bg-gray-50"
                    title="Update QR Code link"
                  >
                    <ArrowsClockwise
                      size={14}
                      weight="bold"
                      className={regenerating === t.id ? 'animate-spin text-orange-500' : ''}
                    />
                  </Button>
                  {t.qr_code && (
                    <Button
                      onClick={() => setQrTarget(t)}
                      variant="secondary"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 bg-white border-gray-200 rounded-xl hover:bg-gray-50 text-blue-600 hover:text-blue-700"
                    >
                      <DownloadSimple size={14} weight="bold" /> Download
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 rounded-b-3xl border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400">
                  {t.is_active ? 'Aktif' : 'Non-aktif'}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => openEdit(t)}
                    className="w-8 h-8 p-0 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50"
                  >
                    <Pencil size={15} weight="bold" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(t)}
                    className="w-8 h-8 p-0 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                  >
                    <Trash size={15} weight="bold" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal (Premium Inputs) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Ubah Atribut Meja' : 'Registrasi Meja Baru'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama/Nomor Meja</label>
            <Input
              {...register('name')}
              placeholder="cth: Meja 1 / VIP-A / Lt 2 Bar"
              className="rounded-xl border-gray-200 shadow-sm focus:border-orange-500"
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Kapasitas Maksimal (orang)
            </label>
            <Input
              {...register('capacity')}
              type="number"
              min={1}
              className="rounded-xl border-gray-200 shadow-sm focus:border-orange-500"
            />
            {errors.capacity && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{errors.capacity.message}</p>
            )}
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Status Penggunaan
              </label>
              <select
                {...register('status')}
                className="w-full rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors bg-white hover:bg-gray-50 cursor-pointer"
              >
                <option value="available">Tersedia (Kosong)</option>
                <option value="occupied">Terisi</option>
                <option value="reserved">Dipesan (Reservasi)</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              {...register('is_active')}
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 bg-white"
            />
            <span className="text-sm font-bold text-gray-800">Meja Dapat Digunakan (Aktif)</span>
          </label>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl font-bold py-2.5 bg-white border-2 border-gray-100 hover:border-gray-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 rounded-xl font-bold py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 border-0 shadow-md shadow-orange-500/30"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : editing ? 'Terapkan' : 'Simpan Meja'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR zoom modal (Premium Focus Box) */}
      <Modal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title={`Kode QR : ${qrTarget?.name}`}
        size="sm"
      >
        {qrTarget?.qr_code && (
          <div className="flex flex-col items-center gap-5 pt-2 pb-4">
            <div
              ref={qrModalRef}
              className="p-4 bg-white rounded-3xl border border-gray-100 shadow-premium"
            >
              <QRCode value={buildQrUrl(qrTarget.qr_code)} size={240} level="M" />
            </div>
            {/* URL Display */}
            <div className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100 w-full text-center overflow-auto max-w-[280px]">
              <p className="text-[11px] font-mono font-medium text-gray-500 whitespace-nowrap scrollbar-hide">
                {buildQrUrl(qrTarget.qr_code)}
              </p>
            </div>
            <Button
              onClick={() => downloadQrSvg(qrModalRef, qrTarget.name)}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold shadow-md shadow-orange-500/20"
            >
              <DownloadSimple size={16} weight="bold" /> Simpan Vector (SVG)
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
