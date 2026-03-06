import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicMenu, type PublicCategory } from "@/services/menuService";
import {
  ImageBroken,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  X,
  CaretRight,
  CheckCircle,
  CircleNotch,
  MapPin,
  User,
  FileText,
  ForkKnife,
  Receipt,
  Storefront,
} from "@phosphor-icons/react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button, Input } from '@/components/ui'

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

function useOrderForm({
  cartItems,
  tableId,
  slug,
  onOrderSuccess,
}: OrderFormProps) {
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  async function handleOrder() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/public/${slug}/orders`, {
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

  return {
    notes,
    setNotes,
    customerName,
    setCustomerName,
    loading,
    error,
    subtotal,
    handleOrder,
  };
}

// ─── Desktop Cart Panel ────────────────────────────────────
function CartPanel(props: OrderFormProps) {
  const { cartItems, currency, tableId, onUpdateQty } = props;
  const {
    notes,
    setNotes,
    customerName,
    setCustomerName,
    loading,
    error,
    subtotal,
    handleOrder,
  } = useOrderForm(props);

  return (
    <div
      className="flex flex-col h-full bg-white/60 backdrop-blur-xl"
      style={{ maxHeight: "calc(100vh - 4rem)" }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white/80">
        <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2 tracking-tight">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
            <ShoppingCart size={18} weight="duotone" />
          </div>
          Keranjang Saya
        </h2>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full w-fit tracking-wide uppercase border border-orange-100">
          <ForkKnife size={12} weight="bold" />
          {tableId ? "Makan di Tempat" : "Bawa Pulang"}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 border-dashed">
              <ShoppingCart size={24} weight="duotone" className="text-gray-300" />
            </div>
            <p className="text-sm font-black text-gray-900 tracking-tight mt-2">
              Keranjang masih kosong
            </p>
            <p className="text-xs text-gray-400 mt-1.5 max-w-[180px] leading-relaxed font-medium">
              Yuk, intip menu kami dan temukan makanan favoritmu!
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 group">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 border-dashed flex-shrink-0">
                  <ImageBroken size={20} weight="duotone" />
                </div>
              )}
              <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                <p className="text-sm font-bold text-gray-900 line-clamp-2 tracking-tight leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1">
                   <p className="text-sm text-orange-500 font-extrabold tracking-tight">
                    {fmt(item.price, currency)}
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50/80 rounded-full px-1.5 py-1 border border-gray-200/60 shadow-inner flex-shrink-0">
                    <Button
                      onClick={() => onUpdateQty(item.id, item.qty - 1)}
                      variant="ghost"
                      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors p-0 active:scale-95"
                    >
                      <Minus size={12} weight="bold" />
                    </Button>
                    <span className="text-xs font-black text-gray-900 w-3 text-center">
                      {item.qty}
                    </span>
                    <Button
                      onClick={() => onUpdateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors p-0 shadow-md shadow-orange-500/30 active:scale-95 border-0"
                    >
                      <Plus size={12} weight="bold" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order form + total */}
      <div className="px-6 pb-6 pt-5 border-t border-gray-100 space-y-4 bg-white/90">
        <div className="space-y-3">
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
               <User size={15} weight="duotone" className="text-gray-400" />
             </div>
             <Input
               type="text"
               value={customerName}
               onChange={(e) => setCustomerName(e.target.value)}
               placeholder="Nama Kamu (Opsional)"
               className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
             />
           </div>
           <div className="relative">
             <div className="absolute top-3 left-3.5 pointer-events-none">
               <FileText size={15} weight="duotone" className="text-gray-400" />
             </div>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Catatan restoran (Opsional)"
               rows={2}
               className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none font-medium custom-scrollbar"
             />
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 border-dashed">
          <span className="text-sm font-semibold text-gray-500">Total Pembayaran</span>
          <span className="font-black text-2xl text-gray-900 tracking-tight">
            {fmt(subtotal, currency)}
          </span>
        </div>
        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center shadow-sm">
            {error}
          </p>
        )}
        <Button
          onClick={handleOrder}
          disabled={loading || cartItems.length === 0}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm font-black rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 border-0 hover:-translate-y-0.5 transition-all text-white"
        >
          {loading ? <CircleNotch size={18} className="animate-spin" /> : <Receipt size={18} weight="bold" />}
          {loading ? "Memproses..." : "Konfirmasi Pesanan"}
        </Button>
      </div>
    </div>
  );
}

// ─── Mobile Cart Drawer ────────────────────────────────────
function CartDrawer({
  open,
  onClose,
  ...rest
}: OrderFormProps & { open: boolean; onClose: () => void }) {
  const { cartItems, currency, tableId, onUpdateQty } = rest;
  const {
    notes,
    setNotes,
    customerName,
    setCustomerName,
    loading,
    error,
    subtotal,
    handleOrder,
  } = useOrderForm(rest);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-[2rem] z-50 max-h-[90vh] flex flex-col shadow-2xl shadow-black/50 lg:hidden transform transition-transform duration-300">
        <div className="w-full flex justify-center pt-3 pb-2 bg-white rounded-t-[2rem]">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-50">
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">
              Keranjang Saya
            </h2>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wider mt-0.5">
              {cartItems.length} menu dipilih
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-9 h-9 rounded-full p-0 text-gray-400 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={18} weight="bold" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 px-4 py-2.5 rounded-xl text-xs font-bold ring-1 ring-orange-500/20">
            <ForkKnife size={14} weight="duotone" />
            {tableId ? "Makan di Tempat (Dine-in)" : "Bawa Pulang (Take-away)"}
          </div>
          
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 border-dashed flex-shrink-0">
                    <ImageBroken size={20} weight="duotone" />
                  </div>
                )}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 tracking-tight leading-tight">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-sm text-orange-500 font-extrabold tracking-tight">
                      {fmt(item.price, currency)}
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50/80 rounded-full px-1.5 py-1 border border-gray-200/60 shadow-inner flex-shrink-0">
                      <Button
                        onClick={() => onUpdateQty(item.id, item.qty - 1)}
                        variant="ghost"
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors p-0 border border-gray-100"
                      >
                        <Minus size={12} weight="bold" />
                      </Button>
                      <span className="text-xs font-black text-gray-900 w-3 text-center">
                        {item.qty}
                      </span>
                      <Button
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors p-0 shadow-md shadow-orange-500/40 border-0"
                      >
                        <Plus size={12} weight="bold" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 pb-6 pt-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                 <User size={15} weight="duotone" className="text-gray-400" />
               </div>
               <Input
                 type="text"
                 value={customerName}
                 onChange={(e) => setCustomerName(e.target.value)}
                 placeholder="Nama Kamu"
                 className="w-full pl-10 pr-3 py-3 text-sm rounded-xl bg-gray-50 border-gray-200 focus:bg-white font-medium"
               />
             </div>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                 <FileText size={15} weight="duotone" className="text-gray-400" />
               </div>
               <Input
                 type="text"
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Catatan..."
                 className="w-full pl-10 pr-3 py-3 text-sm rounded-xl bg-gray-50 border-gray-200 focus:bg-white font-medium"
               />
             </div>
          </div>

          <div className="flex justify-between items-end pt-2">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pesanan</p>
              <p className="font-black text-2xl text-gray-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                {fmt(subtotal, currency)}
              </p>
            </div>
            <Button
              onClick={handleOrder}
              disabled={loading || cartItems.length === 0}
              variant="primary"
              className="px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-xl shadow-orange-500/30 border-0 text-white active:scale-95 transition-transform"
            >
              {loading ? <CircleNotch size={18} className="animate-spin" /> : <>Pesan Sekarang <CaretRight size={18} weight="bold" /></>}
            </Button>
          </div>
          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center shadow-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────
function SuccessScreen({
  orderNumber,
  onReset,
}: {
  orderNumber: string;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden font-sans">
       {/* Decorative Gradient Background */}
       <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
       <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl md:rounded-[3rem] min-h-screen md:min-h-[600px] shadow-2xl shadow-gray-200/50 flex flex-col items-center justify-center px-8 py-12 text-center relative z-10 border border-white/50">
        
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
           <div className="w-28 h-28 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 relative z-10">
             <CheckCircle size={56} weight="fill" className="text-white" />
           </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
          Hore! Pesanan Masuk
        </h2>
        <p className="text-sm font-medium text-gray-500 mb-8 max-w-[260px] leading-relaxed">
          Dapur kami sudah menerima pesananmu dan sedang dipersiapkan. Harap tunggu!
        </p>

        <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-8 w-full mb-10 shadow-sm relative overflow-hidden">
          {/* Ticket styling elements */}
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2 shadow-inner drop-shadow-sm border-r border-gray-200 opacity-50" />
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gray-50 rounded-full -translate-y-1/2 shadow-inner drop-shadow-sm border-l border-gray-200 opacity-50" />

          <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2">
            No. Antrean / Pesanan
          </p>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 tracking-widest filter drop-shadow-sm">
            {orderNumber}
          </div>
        </div>

        <Button onClick={onReset} variant="primary" className="w-full py-4 text-sm font-bold rounded-2xl bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-900/20 border-0 transition-transform active:scale-95">
          Kembali ke Menu Utama
        </Button>
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
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group flex flex-col hover:-translate-y-1 relative ring-1 ring-gray-100 hover:ring-orange-100">
      <div className="relative overflow-hidden aspect-[4/3] p-1.5">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-300">
            <ForkKnife size={40} weight="duotone" />
          </div>
        )}
        
        {/* Soft dark gradient overlay for text readability if we had text on top, but here just for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {item.is_featured && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 border border-white">
            <span className="text-orange-500">★</span> Pilihan Utama
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-10 bg-white">
        <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2 tracking-tight">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs font-semibold text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        
        <div className="mt-auto pt-5 flex items-end justify-between">
          <div>
            <p className="font-black text-orange-600 text-xl tracking-tight leading-none drop-shadow-sm">
              {fmt(item.price, currency)}
            </p>
            {item.preparation_time && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md mt-2 border border-gray-100 tracking-wider">
                <Clock size={10} weight="bold" /> ±{item.preparation_time}m
              </span>
            )}
          </div>
          
          <div className="flex-shrink-0">
             {qty === 0 ? (
                <Button
                  onClick={() => onUpdateQty(item.id, 1)}
                  variant="primary"
                  className="bg-gray-900 text-white hover:bg-black text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Tambah
                </Button>
              ) : (
                <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-1 border border-orange-100/50 shadow-inner">
                  <Button
                    onClick={() => onUpdateQty(item.id, qty - 1)}
                    variant="ghost"
                    className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-orange-600 transition-all p-0 border border-gray-100 active:scale-95"
                  >
                    <Minus size={14} weight="bold" />
                  </Button>
                  <span className="text-sm font-black text-orange-600 w-3 text-center">
                    {qty}
                  </span>
                  <Button
                    onClick={() => onUpdateQty(item.id, qty + 1)}
                    className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all p-0 shadow-md shadow-orange-500/40 border-0 active:scale-95"
                  >
                    <Plus size={14} weight="bold" />
                  </Button>
                </div>
              )}
          </div>
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

  const allItems = useMemo(
    () => categories.flatMap((c) => c.active_menu_items ?? []),
    [categories],
  );

  const cartItems = useMemo<CartItem[]>(() => {
    const result: CartItem[] = [];
    cart.forEach((qty, id) => {
      const item = allItems.find((i) => i.id === id);
      if (item)
        result.push({
          id,
          name: item.name,
          price: item.price,
          qty,
          image_url: item.image_url,
        });
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
             <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20" />
             <div className="relative bg-white rounded-full w-full h-full flex items-center justify-center shadow-lg border border-gray-100">
                <Storefront size={28} weight="duotone" className="text-orange-500 animate-pulse" />
             </div>
          </div>
          <p className="text-sm font-bold text-gray-400 tracking-wider uppercase animate-pulse">
            Membuka Buku Menu...
          </p>
        </div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans px-6">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium flex flex-col items-center py-16 px-8 text-center border border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100">
             <ImageBroken size={40} weight="duotone" className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            Toko Tidak Ditemukan
          </h2>
          <p className="text-sm font-medium text-gray-500 max-w-[250px] leading-relaxed">
            Maaf, halaman restoran atau warung yang kamu kunjungi tidak valid. Harap periksa ulang tautan barcode.
          </p>
        </div>
      </div>
    );

  if (orderNumber)
    return (
      <SuccessScreen
        orderNumber={orderNumber}
        onReset={() => setOrderNumber(null)}
      />
    );

  const activeItems =
    categories.find((c) => c.id === activeTab)?.active_menu_items ?? [];
  const allCats = categories.filter(
    (c) => c.active_menu_items && c.active_menu_items.length > 0,
  );
  const orderFormProps: OrderFormProps = {
    cartItems,
    currency: restaurant?.currency,
    tableId,
    slug: slug!,
    onUpdateQty: updateQty,
    onOrderSuccess,
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans relative">
      <div className="max-w-[1400px] mx-auto lg:px-6 lg:py-6 lg:flex lg:gap-6 min-h-screen">
        
        {/* ── LEFT SIDEBAR (desktop only) ──────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-[260px] xl:w-[280px] flex-shrink-0 sticky top-6 self-start bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden" 
               style={{ maxHeight: "calc(100vh - 3rem)" }}>
          
          <div className="p-6 relative bg-gradient-to-b from-orange-50/50 to-white/10">
            {/* Header pattern detail */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/5 blur-3xl rounded-full" />
            
            {restaurant?.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt="logo"
                className="w-16 h-16 object-cover rounded-2xl shadow-premium border-2 border-white mb-4 relative z-10"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-premium mb-4 relative z-10">
                <Storefront size={32} weight="duotone" />
              </div>
            )}
            <h1 className="font-black text-gray-900 text-xl tracking-tight leading-none mb-2 relative z-10">
              {restaurant?.name}
            </h1>
            {restaurant?.address && (
              <p className="text-[11px] font-bold text-gray-400 flex items-start gap-1.5 leading-relaxed relative z-10">
                <MapPin
                  size={14} weight="duotone"
                  className="mt-0.5 flex-shrink-0 text-orange-400"
                />
                <span className="line-clamp-3">{restaurant.address}</span>
              </p>
            )}
            {table && (
              <div className="mt-4 inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 shadow-sm text-xs py-1.5 px-3 rounded-xl font-bold relative z-10">
                <ForkKnife size={12} weight="bold" />
                Meja Nomor <span className="text-orange-500 font-black">{table.name}</span>
              </div>
            )}
          </div>

          <div className="px-5 pb-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <nav className="p-4 pt-2 space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pb-6">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2 mb-3 mt-1">
              Jelajahi Menu
            </p>
            {allCats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-2xl text-sm transition-all duration-300",
                  activeTab === c.id
                    ? "bg-gray-900 text-white shadow-xl shadow-gray-900/20 font-black translate-x-1"
                    : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold",
                )}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CENTER (menu grid) ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-36 lg:pb-8">
          
          {/* Mobile header (Floating Banner Style) */}
          <div className="lg:hidden relative bg-white pb-3 rounded-b-[2rem] shadow-sm mb-4">
             {/* Abstract Cover */}
            <div className="h-32 w-full bg-gradient-to-br from-orange-400 to-amber-500 relative overflow-hidden rounded-b-[2rem]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full mix-blend-overlay" />
               <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="px-5 relative -mt-10 mb-4 flex gap-4">
              {restaurant?.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt="logo"
                  className="w-20 h-20 object-cover rounded-[1.25rem] shadow-premium border-4 border-white flex-shrink-0 bg-white"
                />
              ) : (
                <div className="w-20 h-20 bg-white rounded-[1.25rem] flex items-center justify-center text-orange-500 shadow-premium border-4 border-white flex-shrink-0">
                  <Storefront size={32} weight="duotone" />
                </div>
              )}
              <div className="pt-10 flex-1 min-w-0">
                <h1 className="font-black text-xl text-gray-900 truncate tracking-tight pr-2">
                  {restaurant?.name}
                </h1>
                {restaurant?.address && (
                  <p className="text-xs font-medium text-gray-400 mt-0.5 truncate pr-2">
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>

            {table && (
              <div className="px-6 mb-4">
                 <div className="inline-flex w-full justify-center items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/50 text-orange-700 text-[11px] uppercase tracking-wider py-2 px-4 rounded-xl font-black shadow-inner">
                   <ForkKnife size={14} weight="bold" /> Layanan Meja — {table.name}
                 </div>
              </div>
            )}
            
            {/* Mobile horizontal category tabs (Pill Shaped) */}
            <div
              className={cn(
                "sticky top-0 z-30 transition-all duration-300 mt-2",
                isScrolled ? "bg-white/90 backdrop-blur-xl shadow-sm rounded-b-[2rem] py-2" : "",
              )}
            >
              <div className="flex gap-2.5 px-6 py-1 overflow-x-auto scrollbar-hide snap-x">
                {allCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={cn(
                      "flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs transition-all snap-start",
                      activeTab === c.id
                        ? "bg-gray-900 text-white shadow-xl font-bold"
                        : "bg-gray-50 border border-gray-100 text-gray-500 font-semibold hover:bg-gray-100",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop category heading */}
          <div className="hidden lg:flex items-center justify-between mb-6 bg-white/60 backdrop-blur-xl px-8 py-5 rounded-[2rem] shadow-sm border border-gray-100/50">
            <div>
              <h2 className="font-black text-3xl text-gray-900 tracking-tight">
                {allCats.find((c) => c.id === activeTab)?.name ?? "Menu"}
              </h2>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {activeItems.length} Pilihan Menu
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl text-gray-400">
               <ForkKnife size={24} weight="duotone" />
            </div>
          </div>

          {/* Menu grid */}
          <div className="px-5 lg:px-0">
            {categories.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center py-24 text-gray-400 bg-white/50 backdrop-blur rounded-[2rem] ring-1 ring-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-inner">
                  <ImageBroken size={32} weight="duotone" />
                </div>
                <p className="text-base font-black text-gray-600">
                  Menu Sedang Disiapkan
                </p>
                <p className="text-sm font-semibold mt-1">Harap cek kembali nanti.</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div className="text-center py-20 bg-white/50 backdrop-blur rounded-[2rem] ring-1 ring-gray-100 shadow-sm text-gray-400 font-semibold">
                Tidak ada menu di kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
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

        </main>

        {/* ── RIGHT PANEL (desktop cart, always visible) ───────────────── */}
        <aside
          className="hidden lg:block w-[320px] xl:w-[350px] flex-shrink-0 sticky top-6 self-start bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden"
          style={{ height: "calc(100vh - 3rem)" }}
        >
          <CartPanel {...orderFormProps} />
        </aside>
      </div>

      {/* ── MOBILE floating cart button ──────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm z-20 lg:hidden">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full bg-gray-900/95 backdrop-blur-xl text-white rounded-[1.5rem] p-2 flex items-center justify-between shadow-2xl shadow-gray-900/30 transition-all border border-gray-700/50 active:scale-95"
          >
            <div className="flex items-center gap-3.5 pl-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} weight="fill" className="text-orange-400" />
                </div>
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                  Total
                </span>
                <span className="font-black text-base text-white leading-none">
                  {fmt(cartTotal, restaurant?.currency)}
                </span>
              </div>
            </div>
            <div className="bg-orange-500 hover:bg-orange-400 text-white px-5 h-[44px] rounded-xl font-bold text-sm flex items-center gap-1 transition-colors">
              Lihat <CaretRight size={16} weight="bold" />
            </div>
          </Button>
        </div>
      )}

      {/* ── MOBILE cart drawer (bottom sheet) ───────────────────────── */}
      {slug && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          {...orderFormProps}
        />
      )}
    </div>
  );
}
