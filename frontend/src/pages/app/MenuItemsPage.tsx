import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ImageOff,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItem,
  deleteMenuItem,
  getCategories,
  type MenuItem,
  type Category,
} from "@/services/menuService";

const schema = z.object({
  category_id: z.coerce.number().min(1, "Pilih kategori"),
  name: z.string().min(1, "Nama wajib diisi").max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  preparation_time: z.coerce.number().min(0).optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [serverError, setServerError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldErr,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [its, cats] = await Promise.all([
        getMenuItems(filterCat ? { category_id: filterCat } : {}),
        getCategories(),
      ]);
      setItems(its);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterCat]);

  const openCreate = () => {
    setEditing(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    reset({
      category_id: 0,
      name: "",
      description: "",
      price: 0,
      preparation_time: 0,
      is_available: true,
      is_featured: false,
    });
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setImagePreview(item.image_url);
    if (fileRef.current) fileRef.current.value = "";
    reset({
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      preparation_time: item.preparation_time,
      is_available: item.is_available,
      is_featured: item.is_featured,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, String(v ?? "")));
    if (fileRef.current?.files?.[0])
      fd.append("image", fileRef.current.files[0]);

    try {
      if (editing) {
        await updateMenuItem(editing.id, fd);
      } else {
        await createMenuItem(fd);
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
          setFieldErr(k as keyof FormData, { message: v[0] }),
        );
      } else {
        setServerError(res?.message ?? "Terjadi kesalahan.");
      }
    }
  };

  const doToggle = async (item: MenuItem) => {
    await toggleMenuItem(item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: !i.is_available } : i,
      ),
    );
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenuItem(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? "Gagal menghapus menu.");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} item menu
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus size={16} /> Tambah Menu
          </button>
        </div>
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
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">🍽</div>
          <p className="text-gray-500 text-sm">
            Belum ada menu. Mulai tambahkan menu restoran Anda.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            + Tambah menu pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-300">
                  <ImageOff size={28} />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {item.name}
                  </p>
                  {item.is_featured && (
                    <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      ⭐
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.category?.name}
                </p>
                <p className="text-orange-600 font-bold text-sm mt-1">
                  {formatCurrency(item.price)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => doToggle(item)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition ${item.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {item.is_available ? (
                      <>
                        <ToggleRight size={12} /> Tersedia
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={12} /> Habis
                      </>
                    )}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Menu" : "Tambah Menu"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Menu
              </label>
              <input
                {...register("name")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                placeholder="cth: Nasi Goreng Spesial"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                {...register("category_id")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value={0}>-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga (Rp)
              </label>
              <input
                {...register("price")}
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                placeholder="0"
              />
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi <span className="text-gray-400">(opsional)</span>
              </label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waktu Masak (menit)
              </label>
              <input
                {...register("preparation_time")}
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto Menu{" "}
                <span className="text-gray-400">(opsional, max 2MB)</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImagePreview(URL.createObjectURL(f));
                }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>

            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  {...register("is_available")}
                  type="checkbox"
                  className="rounded"
                />
                Tersedia
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  {...register("is_featured")}
                  type="checkbox"
                  className="rounded"
                />
                ⭐ Unggulan
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editing
                  ? "Simpan Perubahan"
                  : "Tambah Menu"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Menu"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Yakin ingin menghapus menu <strong>{deleteTarget?.name}</strong>?
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
    </div>
  );
}
