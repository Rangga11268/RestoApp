import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicMenu, type PublicCategory } from "@/services/menuService";
import {
  ImageOff,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  X,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

type CartMap = Map<number, number>; // itemId → qty

interface Restaurant {
  name: string;
  address?: string;
  logo_url?: string | null;
  currency?: string;
}
interface TableInfo {
  id: number;
  name: string;
  capacity: number;
}

const fmt = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

// ─── Cart Drawer ──────────────────────────────────────────

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartMap;
  categories: PublicCategory[];
  currency?: string;
  tableId: string | null;
  slug: string;
  onOrderSuccess: (orderNumber: string) => void;
  onUpdateQty: (itemId: number, qty: number) => void;
}

function CartDrawer({
  open,
  onClose,
  cart,
  categories,
  currency,
  tableId,
  slug,
  onOrderSuccess,
  onUpdateQty,
}: CartDrawerProps) {
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allItems = useMemo(
    () => categories.flatMap((c) => c.active_menu_items ?? []),
    [categories],
  );

  const cartItems = useMemo(() => {
    const result: { id: number; name: string; price: number; qty: number }[] =
      [];
    cart.forEach((qty, id) => {
      const item = allItems.find((i) => i.id === id);
      if (item) result.push({ id, name: item.name, price: item.price, qty });
    });
    return result;
  }, [cart, allItems]);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  async function handleOrder() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/public/${slug}/orders`, {
        table_id: tableId ? Number(tableId) : null,
        order_type: tableId ? "dine_in" : "take_away",
        notes: notes || undefined,
        customer_name: customerName || undefined,
        items: cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.qty })),
      });
      onOrderSuccess(res.data.data.order_number);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal mengirim pesanan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-2xl z-40 max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">
            Keranjang ({cartItems.length} item)
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-orange-600 font-semibold">
                  {fmt(item.price, currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQty(item.id, item.qty - 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-100 hover:text-orange-600 transition"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-900">
                  {item.qty}
                </span>
                <button
                  onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition"
                >
                  <Plus size={12} />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                {fmt(item.price * item.qty, currency)}
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Nama (opsional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama kamu..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: tanpa pedas, extra saus..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-bold text-base text-gray-900">
              {fmt(subtotal, currency)}
            </span>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={handleOrder}
            disabled={loading || cartItems.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3.5 font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ChevronRight size={17} />
            )}
            {loading ? "Mengirim…" : "Pesan Sekarang"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Success screen ───────────────────────────────────────

function SuccessScreen({
  orderNumber,
  onReset,
}: {
  orderNumber: string;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <CheckCircle2 size={56} className="text-green-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan Dikirim!</h2>
      <p className="text-sm text-gray-500 mb-1">Nomor pesanan kamu:</p>
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 text-2xl font-bold text-orange-600 tracking-wide mb-6">
        {orderNumber}
      </div>
      <p className="text-xs text-gray-400 max-w-xs mb-8">
        Pesananmu sedang diproses. Mohon tunggu sebentar.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600"
      >
        Pesan Lagi
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const tableId = params.get("table");

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cart, setCart] = useState<CartMap>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getPublicMenu(slug, tableId ?? undefined)
      .then((data) => {
        setRestaurant(data.restaurant);
        setTable(data.table ?? null);
        const cats: PublicCategory[] = data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].id);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, tableId]);

  function updateQty(itemId: number, qty: number) {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(itemId);
      else next.set(itemId, qty);
      return next;
    });
  }

  const cartCount = useMemo(() => {
    let n = 0;
    cart.forEach((qty) => (n += qty));
    return n;
  }, [cart]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-5xl mb-4">🍽</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Menu tidak ditemukan
        </h2>
        <p className="text-sm text-gray-400">
          Restoran belum tersedia atau URL tidak valid.
        </p>
      </div>
    );

  if (orderNumber) {
    return (
      <SuccessScreen
        orderNumber={orderNumber}
        onReset={() => setOrderNumber(null)}
      />
    );
  }

  const activeItems =
    categories.find((c) => c.id === activeTab)?.active_menu_items ?? [];
  const allCats = categories.filter(
    (c) => c.active_menu_items && c.active_menu_items.length > 0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {restaurant?.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt="logo"
              className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              🍽
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate">
              {restaurant?.name}
            </p>
            {restaurant?.address && (
              <p className="text-xs text-gray-400 truncate">
                {restaurant.address}
              </p>
            )}
          </div>
        </div>

        {table && (
          <div className="bg-orange-500 text-white text-center text-sm py-1.5 px-4 font-medium">
            🪑 {table.name}
          </div>
        )}

        {allCats.length > 0 && (
          <div className="max-w-lg mx-auto">
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition",
                    activeTab === c.id
                      ? "bg-orange-500 text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-28">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Menu belum tersedia saat ini.</p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Tidak ada menu di kategori ini.
          </div>
        ) : (
          activeItems.map((item) => {
            const qty = cart.get(item.id) ?? 0;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden flex gap-3 shadow-sm"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-24 h-24 flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-300">
                    <ImageOff size={22} />
                  </div>
                )}
                <div className="flex flex-col justify-center py-3 pr-3 flex-1 min-w-0">
                  <div className="flex items-start gap-1">
                    <p className="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0">
                      {item.name}
                    </p>
                    {item.is_featured && (
                      <span className="text-amber-500 text-xs">⭐</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-orange-600 text-sm">
                      {fmt(item.price, restaurant?.currency)}
                    </p>
                    {item.preparation_time ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} /> {item.preparation_time} mnt
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2">
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="flex items-center gap-1 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-orange-600 transition"
                      >
                        <Plus size={12} /> Tambah
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, qty - 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-100 hover:text-orange-600 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold text-gray-900 w-4 text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, qty + 1)}
                          className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-4 text-center">
        <p className="text-xs text-gray-300">Powered by RestoApp</p>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 max-w-lg mx-auto px-4 z-20">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4 flex items-center justify-between px-5 shadow-xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
                <ShoppingCart size={16} />
              </div>
              <span className="font-semibold text-sm">{cartCount} item</span>
            </div>
            <span className="font-bold text-sm">Lihat Keranjang →</span>
          </button>
        </div>
      )}

      {slug && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          categories={categories}
          currency={restaurant?.currency}
          tableId={tableId}
          slug={slug}
          onOrderSuccess={(num) => {
            setOrderNumber(num);
            setCartOpen(false);
            setCart(new Map());
          }}
          onUpdateQty={updateQty}
        />
      )}
    </div>
  );
}
