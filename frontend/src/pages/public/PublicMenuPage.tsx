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
  MapPin,
  User,
  FileText,
  Utensils,
  Receipt,
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

type CartMap = Map<number, number>;

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
interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image_url?: string | null;
}

const fmt = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

// ─── Shared Order Form Hook ────────────────────────────────
interface OrderFormProps {
  cartItems: CartItem[];
  currency?: string;
  tableId: string | null;
  slug: string;
  onUpdateQty: (itemId: number, qty: number) => void;
  onOrderSuccess: (orderNumber: string) => void;
}

function useOrderForm({ cartItems, tableId, slug, onOrderSuccess }: OrderFormProps) {
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return { notes, setNotes, customerName, setCustomerName, loading, error, subtotal, handleOrder };
}

// ─── Desktop Cart Panel ────────────────────────────────────
function CartPanel(props: OrderFormProps) {
  const { cartItems, currency, tableId, onUpdateQty } = props;
  const { notes, setNotes, customerName, setCustomerName, loading, error, subtotal, handleOrder } =
    useOrderForm(props);

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <ShoppingCart size={16} className="text-orange-500" />
          Pesanan Kamu
        </h2>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg w-fit">
          <Utensils size={11} />
          {tableId ? "Dine-in" : "Take-away"}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ShoppingCart size={20} className="text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-400">Belum ada pesanan</p>
            <p className="text-xs text-gray-300 mt-0.5">Pilih menu untuk mulai memesan</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-11 h-11 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                  <ImageOff size={13} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-orange-600 font-bold">{fmt(item.price, currency)}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-1 py-1 border border-gray-100 flex-shrink-0">
                <button
                  onClick={() => onUpdateQty(item.id, item.qty - 1)}
                  className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-orange-600 transition-colors"
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-bold text-gray-900 w-3 text-center">{item.qty}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order form + total */}
      <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3 bg-gray-50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User size={13} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama pemesan (Opsional)"
            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
        <div className="relative">
          <div className="absolute top-2.5 left-3 pointer-events-none">
            <FileText size={13} className="text-gray-400" />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan pesanan (Opsional)"
            rows={2}
            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Total Pembayaran</span>
          <span className="font-black text-sm text-gray-900">{fmt(subtotal, currency)}</span>
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}
        <button
          onClick={handleOrder}
          disabled={loading || cartItems.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
          {loading ? "Mengirim…" : "Buat Pesanan"}
        </button>
      </div>
    </div>
  );
}

// ─── Mobile Cart Drawer ────────────────────────────────────
function CartDrawer({ open, onClose, ...rest }: OrderFormProps & { open: boolean; onClose: () => void }) {
  const { cartItems, currency, tableId, onUpdateQty } = rest;
  const { notes, setNotes, customerName, setCustomerName, loading, error, subtotal, handleOrder } =
    useOrderForm(rest);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 max-h-[90vh] flex flex-col shadow-2xl lg:hidden">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Keranjang Pesanan</h2>
            <p className="text-xs text-gray-500">{cartItems.length} item terpilih</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm font-semibold">
            <Utensils size={14} />
            {tableId ? "Makan di Tempat (Dine-in)" : "Bawa Pulang (Take-away)"}
          </div>
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 flex-shrink-0">
                  <ImageOff size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-sm text-orange-600 font-bold">{fmt(item.price, currency)}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1.5 py-1 border border-gray-100 flex-shrink-0">
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-4 bg-gray-50 rounded-t-3xl border-t border-gray-100 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-gray-400" />
            </div>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama Pemesan (Opsional)"
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
          </div>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText size={16} className="text-gray-400" />
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pesanan (Opsional)" rows={2}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none" />
          </div>
          <div className="flex justify-between items-end pt-2">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Total Pembayaran</p>
              <p className="font-black text-xl text-gray-900">{fmt(subtotal, currency)}</p>
            </div>
            <button onClick={handleOrder} disabled={loading || cartItems.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Pesan <ChevronRight size={18} /></>}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">{error}</p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────
function SuccessScreen({ orderNumber, onReset }: { orderNumber: string; onReset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          Pesananmu telah kami terima dan sedang disiapkan oleh dapur.
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 w-full max-w-xs mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Nomor Pesanan</p>
          <div className="text-3xl font-black text-orange-600 tracking-widest">{orderNumber}</div>
        </div>
        <button
          onClick={onReset}
          className="w-full max-w-xs py-3.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all"
        >
          Pesan Menu Lainnya
        </button>
      </div>
    </div>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────
function MenuCard({
  item,
  qty,
  currency,
  onUpdateQty,
}: {
  item: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    image_url?: string | null;
    is_featured?: boolean;
    preparation_time?: number | null;
  };
  qty: number;
  currency?: string;
  onUpdateQty: (id: number, qty: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80 hover:shadow-md transition-all duration-200 group">
      <div className="relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300">
            <ImageOff size={28} />
          </div>
        )}
        {item.is_featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            ⭐ Favorit
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="font-black text-orange-600 text-sm">{fmt(item.price, currency)}</p>
            {item.preparation_time && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
                <Clock size={9} /> {item.preparation_time} mnt
              </span>
            )}
          </div>
          {qty === 0 ? (
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all border border-orange-200 hover:border-orange-500"
            >
              + Tambah
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 border border-gray-200">
              <button
                onClick={() => onUpdateQty(item.id, qty - 1)}
                className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold text-gray-900 w-3 text-center">{qty}</span>
              <button
                onClick={() => onUpdateQty(item.id, qty + 1)}
                className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        const status = (err as { response?: { status?: number } })?.response?.status;
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

  const allItems = useMemo(() => categories.flatMap((c) => c.active_menu_items ?? []), [categories]);

  const cartItems = useMemo<CartItem[]>(() => {
    const result: CartItem[] = [];
    cart.forEach((qty, id) => {
      const item = allItems.find((i) => i.id === id);
      if (item) result.push({ id, name: item.name, price: item.price, qty, image_url: item.image_url });
    });
    return result;
  }, [cart, allItems]);

  const cartCount = useMemo(() => {
    let n = 0;
    cart.forEach((qty) => (n += qty));
    return n;
  }, [cart]);

  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.price * i.qty, 0),
    [cartItems],
  );

  const onOrderSuccess = (num: string) => {
    setOrderNumber(num);
    setCartOpen(false);
    setCart(new Map());
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium animate-pulse">Memuat menu...</p>
        </div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-4xl">🍽</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Tidak Ditemukan</h2>
          <p className="text-gray-500 max-w-xs">Maaf, restoran yang kamu cari belum tersedia atau URL tidak valid.</p>
        </div>
      </div>
    );

  if (orderNumber) return <SuccessScreen orderNumber={orderNumber} onReset={() => setOrderNumber(null)} />;

  const activeItems = categories.find((c) => c.id === activeTab)?.active_menu_items ?? [];
  const allCats = categories.filter((c) => c.active_menu_items && c.active_menu_items.length > 0);
  const orderFormProps: OrderFormProps = {
    cartItems,
    currency: restaurant?.currency,
    tableId,
    slug: slug!,
    onUpdateQty: updateQty,
    onOrderSuccess,
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-8 lg:flex lg:gap-5 min-h-screen">

        {/* ── LEFT SIDEBAR (desktop only) ──────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 flex-shrink-0 sticky top-8 self-start bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gradient-to-b from-orange-50 to-white border-b border-gray-100">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="logo" className="w-14 h-14 object-cover rounded-xl shadow-sm border border-white mb-3" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-sm mb-3">🍽</div>
            )}
            <h1 className="font-extrabold text-gray-900 text-sm leading-tight">{restaurant?.name}</h1>
            {restaurant?.address && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                <MapPin size={11} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <span className="line-clamp-3">{restaurant.address}</span>
              </p>
            )}
            {table && (
              <div className="mt-3 inline-flex items-center gap-1 bg-orange-500 text-white text-xs py-1 px-2.5 rounded-full font-bold">
                <Utensils size={11} />
                Meja {table.name}
              </div>
            )}
          </div>
          <nav className="p-3 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 mt-1">Kategori</p>
            {allCats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeTab === c.id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CENTER (menu grid) ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden bg-white">
            <div className="relative">
              <div className="absolute inset-0 h-28 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
              <div className="px-5 pt-6 pb-4 relative flex items-start gap-4">
                {restaurant?.logo_url ? (
                  <img src={restaurant.logo_url} alt="logo" className="w-14 h-14 object-cover rounded-2xl shadow-sm border border-white flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-sm flex-shrink-0">🍽</div>
                )}
                <div className="min-w-0 flex-1 pt-1">
                  <h1 className="font-extrabold text-lg text-gray-900 truncate">{restaurant?.name}</h1>
                  {restaurant?.address && (
                    <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-1">{restaurant.address}</span>
                    </p>
                  )}
                  {table && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-700 text-xs py-1 px-2 rounded-lg font-bold">
                      <Utensils size={11} /> Meja {table.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Mobile horizontal category tabs */}
            <div className={cn("sticky top-0 z-30 bg-white/80 backdrop-blur-md transition-all duration-200", isScrolled ? "shadow-sm border-b border-gray-100" : "")}>
              <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide snap-x">
                {allCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all snap-start",
                      activeTab === c.id ? "bg-gray-900 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop category heading */}
          <div className="hidden lg:flex items-baseline justify-between mb-5">
            <div>
              <h2 className="font-black text-2xl text-gray-900">
                {allCats.find((c) => c.id === activeTab)?.name ?? "Menu"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{activeItems.length} pilihan tersedia</p>
            </div>
          </div>

          {/* Menu grid */}
          <div className="px-4 lg:px-0 py-5 lg:py-0 pb-32 lg:pb-8">
            {categories.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4 opacity-40">📋</div>
                <p className="text-sm font-medium">Menu belum tersedia saat ini.</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-sm font-medium">Tidak ada menu di kategori ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                {activeItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    qty={cart.get(item.id) ?? 0}
                    currency={restaurant?.currency}
                    onUpdateQty={updateQty}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block text-center pb-8">
            <p className="text-xs font-medium text-gray-400">
              Powered by <span className="font-bold text-gray-500">RestoApp</span>
            </p>
          </div>
        </main>

        {/* ── RIGHT PANEL (desktop cart, always visible) ───────────────── */}
        <aside
          className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 sticky top-8 self-start bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
          <CartPanel {...orderFormProps} />
        </aside>
      </div>

      {/* ── MOBILE floating cart button ──────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 z-20 lg:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl p-1.5 flex items-center justify-between shadow-2xl shadow-gray-900/25 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 pl-3">
              <div className="relative">
                <ShoppingCart size={20} className="text-orange-400" />
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-gray-900">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total Pesanan</span>
                <span className="font-bold text-sm">{fmt(cartTotal, restaurant?.currency)}</span>
              </div>
            </div>
            <div className="bg-orange-500 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1">
              Keranjang <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* ── MOBILE cart drawer (bottom sheet) ───────────────────────── */}
      {slug && (
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...orderFormProps} />
      )}
    </div>
  );
}

