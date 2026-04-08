import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicMenu, type PublicCategory } from "@/services/menuService";
import {
  ImageBroken,
  ShoppingCart,
  MapPin,
  ForkKnife,
  Storefront,
  CaretRight,
} from "@phosphor-icons/react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';

// Extracted Components
import MenuCard from "./components/MenuCard";
import SuccessScreen from "./components/SuccessScreen";
import { 
  CartPanel, 
  CartDrawer, 
  type CartItem, 
  type OrderFormProps 
} from "./components/OrderComponents";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

const fmt = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

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

  const allItems = useMemo(
    () => categories.flatMap((c) => c.active_menu_items ?? []),
    [categories]
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
    [cartItems]
  );

  const onOrderSuccess = (num: string) => {
    setOrderNumber(num);
    setCartOpen(false);
    setCart(new Map());
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
             <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-10" />
             <div className="relative bg-white rounded-3xl w-full h-full flex items-center justify-center shadow-xl border border-slate-100">
                <Storefront size={32} weight="duotone" className="text-primary animate-pulse" />
             </div>
          </div>
          <p className="text-xs font-black text-slate-400 tracking-[0.3em] uppercase animate-pulse">
            Elegance is Loading...
          </p>
        </div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans px-6">
        <div className="w-full max-w-lg bg-white rounded-[48px] shadow-premium flex flex-col items-center py-20 px-10 text-center border border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-slate-100">
             <ImageBroken size={48} weight="duotone" className="text-slate-200" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">
            Restaurant Not Found
          </h2>
          <p className="text-sm font-medium text-slate-400 max-w-[280px] leading-relaxed">
            We couldn't locate this restaurant. Please check the QR code or link and try again.
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
    <div className="min-h-screen bg-slate-50 font-sans relative selection:bg-primary/20 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto lg:px-8 lg:py-8 lg:flex lg:gap-8 min-h-screen">
        
        {/* ── LEFT SIDEBAR (Desktop) ──────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 sticky top-8 self-start bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-sm border border-slate-100 overflow-hidden" 
               style={{ maxHeight: "calc(100vh - 4rem)" }}>
          
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full" />
            
            <div className="relative z-10 text-center flex flex-col items-center">
                {restaurant?.logo_url ? (
                <img
                    src={restaurant.logo_url}
                    className="w-24 h-24 object-cover rounded-3xl shadow-xl border-4 border-white mb-6"
                />
                ) : (
                <div className="w-20 h-20 bg-primary flex items-center justify-center text-white rounded-3xl shadow-xl mb-6">
                    <Storefront size={40} weight="fill" />
                </div>
                )}
                <h1 className="font-black text-slate-900 text-2xl tracking-tighter leading-tight mb-2">
                {restaurant?.name}
                </h1>
                {restaurant?.address && (
                <p className="text-[11px] font-bold text-slate-400 flex items-start gap-2 leading-relaxed opacity-80 max-w-[200px]">
                    <MapPin size={16} weight="fill" className="text-primary mt-0.5" />
                    {restaurant.address}
                </p>
                )}
            </div>
            
            {table && (
              <div className="mt-8 bg-slate-900 text-white p-4 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl rounded-full" />
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Table Number</p>
                    <p className="text-lg font-black tracking-tight">{table.name}</p>
                 </div>
                 <ForkKnife size={24} weight="duotone" className="text-primary group-hover:rotate-12 transition-transform" />
              </div>
            )}
          </div>

          <div className="px-8 flex-1 overflow-y-auto custom-scrollbar pb-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 mt-4 pl-1">
              Categories
            </p>
            <nav className="space-y-3">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-2xl text-sm transition-all duration-300 group relative",
                    activeTab === c.id
                      ? "bg-primary text-white shadow-xl shadow-primary/20 font-black"
                      : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold",
                  )}
                >
                  {c.name}
                  {activeTab === c.id && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN CONTENT (Menu Grid) ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-36 lg:pb-8">
          
          {/* Mobile Hero Header */}
          <div className="lg:hidden relative bg-white pb-6 rounded-b-[48px] shadow-sm mb-6 overflow-hidden">
             {/* Abstract Cover */}
            <div className="h-48 w-full bg-slate-900 relative">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-amber-500/10 mix-blend-overlay" />
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary blur-[100px] rounded-full opacity-30" />
            </div>

            <div className="px-8 relative -mt-16 flex flex-col items-center text-center">
              {restaurant?.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  className="w-32 h-32 object-cover rounded-[40px] shadow-2xl border-[6px] border-white bg-white"
                />
              ) : (
                <div className="w-28 h-28 bg-primary rounded-[40px] flex items-center justify-center text-white shadow-2xl border-[6px] border-white">
                  <Storefront size={48} weight="fill" />
                </div>
              )}
              
              <div className="mt-4">
                <h1 className="font-ex-black text-2xl text-slate-900 tracking-tighter">
                  {restaurant?.name}
                </h1>
                {table && (
                   <span className="inline-block mt-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest shadow-xl">
                      Table {table.name}
                   </span>
                )}
              </div>
            </div>
            
            {/* Mobile horizontal category tabs (Boutique Style) */}
            <div className={cn(
                "sticky top-0 z-[50] transition-all duration-300 mt-8",
                isScrolled ? "bg-white/95 backdrop-blur-xl shadow-lg rounded-b-[32px] py-4" : "",
              )}>
              <div className="flex gap-4 px-8 overflow-x-auto scrollbar-hide snap-x no-scrollbar">
                {allCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={cn(
                      "flex-shrink-0 px-8 py-3.5 rounded-2xl text-xs transition-all snap-start shadow-sm",
                      activeTab === c.id
                        ? "bg-primary text-white shadow-xl shadow-primary/20 font-black scale-105"
                        : "bg-slate-50 border border-slate-100 text-slate-400 font-bold",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Category Title */}
          <div className="hidden lg:flex items-center justify-between mb-10 bg-white/60 backdrop-blur-xl px-10 py-8 rounded-[48px] shadow-sm border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 leading-none">Category</p>
              <h2 className="font-black text-4xl text-slate-900 tracking-tighter">
                {allCats.find((c) => c.id === activeTab)?.name ?? "Discovery"}
              </h2>
            </div>
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
               <ForkKnife size={28} weight="duotone" className="text-primary" />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="px-6 lg:px-0">
            {categories.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center py-40 bg-white rounded-[48px] border border-slate-100 shadow-sm opacity-50">
                <Storefront size={64} weight="duotone" className="text-slate-200 mb-6" />
                <p className="text-lg font-black text-slate-900 tracking-tight">Updating Menu...</p>
                <p className="text-sm font-medium text-slate-400 mt-2">Please refresh in a moment.</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[48px] border border-slate-100 text-slate-400 font-bold">
                No dishes found in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

        {/* ── RIGHT PANEL (Desktop Cart) ──────────────────────────────── */}
        <aside
          className="hidden lg:block w-[360px] flex-shrink-0 sticky top-8 self-start bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <CartPanel {...orderFormProps} />
        </aside>
      </div>

      {/* ── MOBILE Floating Cart Button ──────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-[60] lg:hidden animate-in slide-in-from-bottom duration-500">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-slate-900 text-white rounded-[32px] p-2.5 flex items-center justify-between shadow-2xl ring-4 ring-white active:scale-95 transition-all overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-primary opacity-0 group-active:opacity-10 transition-opacity" />
            
            <div className="flex items-center gap-4 pl-4 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ShoppingCart size={24} weight="fill" className="text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-slate-900 shadow-lg animate-bounce">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Total Order</span>
                <span className="font-extrabold text-lg text-white leading-none tracking-tight">
                  {fmt(cartTotal, restaurant?.currency)}
                </span>
              </div>
            </div>
            
            <div className="bg-primary text-white px-8 h-12 rounded-[24px] font-bold text-sm flex items-center gap-2 shadow-xl relative z-10">
              Checkout <CaretRight size={18} weight="bold" />
            </div>
          </button>
        </div>
      )}

      {/* ── MOBILE Cart Drawer ───────────────────────────────────────── */}
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
