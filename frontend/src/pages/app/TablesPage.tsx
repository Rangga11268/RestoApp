import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  QrCode,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateQr,
  type Table,
} from "@/services/tableService";

const schema = z.object({
  name: z.string().min(1, "Nama meja wajib diisi").max(50),
  capacity: z.coerce.number().min(1, "Minimal 1 orang"),
  status: z.enum(["available", "occupied", "reserved"]).optional(),
  is_active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_LABEL: Record<string, string> = {
  available: "Tersedia",
  occupied: "Terisi",
  reserved: "Dipesan",
};
const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  reserved: "bg-amber-100 text-amber-700",
};

function downloadSvg(qr: string, name: string) {
  const svg = atob(qr.replace(/^data:image\/svg\+xml;base64,/, ""));
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `qr-${name}.svg`;
  a.click();
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [qrTarget, setQrTarget] = useState<Table | null>(null);
  const [serverError, setServerError] = useState("");
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const load = async () => {
    setLoading(true);
    try {
      setTables(await getTables());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", capacity: 4, status: "available", is_active: true });
    setServerError("");
    setModalOpen(true);
  };
  const openEdit = (t: Table) => {
    setEditing(t);
    reset({
      name: t.name,
      capacity: t.capacity,
      status: t.status as FormData["status"],
      is_active: t.is_active,
    });
    setServerError("");
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      if (editing) await updateTable(editing.id, data);
      else await createTable(data);
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? "Terjadi kesalahan.");
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTable(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? "Gagal menghapus meja.");
      setDeleteTarget(null);
    }
  };

  const doRegenerate = async (t: Table) => {
    setRegenerating(t.id);
    try {
      const updated = await regenerateQr(t.id);
      setTables((prev) =>
        prev.map((x) =>
          x.id === t.id ? { ...x, qr_code: updated.qr_code } : x,
        ),
      );
      if (qrTarget?.id === t.id)
        setQrTarget({ ...qrTarget, qr_code: updated.qr_code });
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meja</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tables.length} meja terdaftar
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Tambah Meja
        </button>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {serverError}
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
              className={`bg-white rounded-xl border overflow-hidden transition hover:shadow-sm ${!t.is_active ? "opacity-60" : "border-gray-200"}`}
            >
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.capacity} kursi</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {/* QR preview */}
              <div className="flex flex-col items-center py-4 px-3">
                {t.qr_code ? (
                  <img
                    src={
                      t.qr_code.startsWith("data:")
                        ? t.qr_code
                        : `data:image/svg+xml;base64,${t.qr_code}`
                    }
                    alt={`QR ${t.name}`}
                    className="w-28 h-28 cursor-pointer"
                    onClick={() => setQrTarget(t)}
                    title="Klik untuk perbesar"
                  />
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
                    <RefreshCw
                      size={12}
                      className={regenerating === t.id ? "animate-spin" : ""}
                    />{" "}
                    QR Baru
                  </button>
                  {t.qr_code && (
                    <button
                      onClick={() => downloadSvg(t.qr_code!, t.name)}
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
                  onClick={() => setDeleteTarget(t)}
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
        title={editing ? "Edit Meja" : "Tambah Meja"}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Meja
            </label>
            <input
              {...register("name")}
              placeholder="cth: Meja 1 / VIP-A"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapasitas (orang)
            </label>
            <input
              {...register("capacity")}
              type="number"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {errors.capacity && (
              <p className="text-xs text-red-500 mt-1">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="available">Tersedia</option>
                <option value="occupied">Terisi</option>
                <option value="reserved">Dipesan</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              {...register("is_active")}
              type="checkbox"
              className="rounded"
            />
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
              {isSubmitting
                ? "Menyimpan..."
                : editing
                  ? "Simpan Perubahan"
                  : "Tambah Meja"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Meja"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Yakin ingin menghapus meja <strong>{deleteTarget?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={doDelete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
          >
            Hapus
          </button>
        </div>
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
            <img
              src={
                qrTarget.qr_code.startsWith("data:")
                  ? qrTarget.qr_code
                  : `data:image/svg+xml;base64,${qrTarget.qr_code}`
              }
              alt={`QR ${qrTarget.name}`}
              className="w-56 h-56"
            />
            <button
              onClick={() => downloadSvg(qrTarget.qr_code!, qrTarget.name)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Download size={14} /> Download SVG
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
