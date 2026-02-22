import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, Download, QrCode, AlertTriangle } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import QRCode from 'react-qr-code'
import Modal from '@/components/Modal'
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
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-red-100 text-red-700',
  reserved: 'bg-amber-100 text-amber-700',
}

/**
 * Ubah path (/menu/slug?table=1) jadi URL lengkap.
 * Pakai VITE_APP_URL dari .env jika di-set, fallback ke window.location.origin.
 * Jika admin buka dari localhost, QR akan berisi localhost (tidak bisa di-scan HP).
 * Solusi: akses halaman ini via Network IP (http://192.168.x.x:5173) atau set VITE_APP_URL.
 */
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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meja</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tables.length} meja terdaftar</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Tambah Meja
        </button>
      </div>

      {/* Warning: akses via localhost — QR tidak bisa di-scan dari HP */}
      {isLocalhost() && !import.meta.env.VITE_APP_URL && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">QR Code tidak bisa di-scan dari HP</p>
            <p className="text-amber-700 mt-0.5">
              Kamu sedang mengakses via <code className="bg-amber-100 px-1 rounded">localhost</code>
              . Akses halaman ini melalui <strong>Network IP</strong> (lihat output Vite:{' '}
              <code className="bg-amber-100 px-1 rounded">http://192.168.x.x:5173</code>) agar QR
              berisi URL yang bisa dijangkau HP.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">🪑</div>
          <p className="text-gray-500 text-sm">
            Belum ada meja. Tambahkan meja agar pelanggan bisa scan QR.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            + Tambah meja pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-xl border overflow-hidden transition hover:shadow-sm ${!t.is_active ? 'opacity-60' : 'border-gray-200'}`}
            >
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.capacity} kursi</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status] ?? 'bg-gray-100 text-gray-500'}`}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {/* QR preview */}
              <div className="flex flex-col items-center py-4 px-3">
                {t.qr_code ? (
                  <div
                    className="w-28 h-28 cursor-pointer flex items-center justify-center p-1 bg-white"
                    onClick={() => setQrTarget(t)}
                    title="Klik untuk perbesar"
                  >
                    <QRCode value={buildQrUrl(t.qr_code)} size={104} level="M" />
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                    <QrCode size={36} />
                  </div>
                )}

                <div className="flex gap-2 mt-3 w-full">
                  <button
                    onClick={() => doRegenerate(t)}
                    disabled={regenerating === t.id}
                    className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={regenerating === t.id ? 'animate-spin' : ''} />{' '}
                    QR Baru
                  </button>
                  {t.qr_code && (
                    <button
                      onClick={() => setQrTarget(t)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 text-gray-600"
                    >
                      <Download size={12} /> Download
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 px-3 py-2 flex justify-end gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Meja' : 'Tambah Meja'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Meja</label>
            <input
              {...register('name')}
              placeholder="cth: Meja 1 / VIP-A"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapasitas (orang)
            </label>
            <input
              {...register('capacity')}
              type="number"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {errors.capacity && (
              <p className="text-xs text-red-500 mt-1">{errors.capacity.message}</p>
            )}
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="available">Tersedia</option>
                <option value="occupied">Terisi</option>
                <option value="reserved">Dipesan</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input {...register('is_active')} type="checkbox" className="rounded" />
            Aktif
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Meja'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR zoom modal */}
      <Modal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title={`QR Code — ${qrTarget?.name}`}
        size="sm"
      >
        {qrTarget?.qr_code && (
          <div className="flex flex-col items-center gap-4">
            {/* URL yang tertanam di QR — berguna untuk copy/share */}
            <p className="text-xs text-gray-400 break-all text-center">
              {buildQrUrl(qrTarget.qr_code)}
            </p>
            <div ref={qrModalRef} className="p-3 bg-white rounded-lg border border-gray-200">
              <QRCode value={buildQrUrl(qrTarget.qr_code)} size={200} level="M" />
            </div>
            <button
              onClick={() => downloadQrSvg(qrModalRef, qrTarget.name)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Download size={14} /> Download SVG
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
