import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/services/menuService";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  description: z.string().max(500).optional(),
  sort_order: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", sort_order: 0, is_active: true });
    setModalOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    reset({
      name: cat.name,
      description: cat.description ?? "",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      if (editing) {
        await updateCategory(editing.id, data);
      } else {
        await createCategory(data);
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      const res = (
        err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        }
      )?.response?.data;
      if (res?.errors) {
        Object.entries(res.errors).forEach(([k, v]) =>
          setFieldError(k as keyof FormData, { message: v[0] }),
        );
      } else {
        setError(res?.message ?? "Terjadi kesalahan.");
      }
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "Gagal menghapus kategori.");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} kategori terdaftar
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-500 text-sm">Belum ada kategori menu.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            + Tambah kategori pertama
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  Deskripsi
                </th>
                <th className="px-4 py-3 text-center">Item</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-300">
                    <GripVertical size={16} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {cat.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {cat.menu_items_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cat.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                        <ToggleRight size={14} />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                        <ToggleLeft size={14} />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Kategori" : "Tambah Kategori"}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kategori
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              placeholder="cth: Makanan Utama"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
              placeholder="Deskripsi singkat..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutan tampil
            </label>
            <input
              {...register("sort_order")}
              type="number"
              min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              {...register("is_active")}
              type="checkbox"
              id="is_active"
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Aktif
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editing
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kategori"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Yakin ingin menghapus kategori <strong>{deleteTarget?.name}</strong>?
          Aksi ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={doDelete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}
