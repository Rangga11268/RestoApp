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
      <div className="min-h-screen flex items-center justify-center bg-paper-2 font-sans">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
             <div className="relative bg-surface rounded-xl w-full h-full flex items-center justify-center border border-rule-light">
                <Storefront size={32} weight="bold" className="text-accent" />
             </div>
          </div>
          <p className="text-xs font-semibold text-ink-2 tracking-wider uppercase">
            Elegance is Loading...
          </p>
        </div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-2 font-sans px-6">
        <div className="w-full max-w-lg bg-surface rounded-lg flex flex-col items-center py-20 px-10 text-center border border-gray-200">
          <div className="w-24 h-24 bg-paper-2 rounded-full flex items-center justify-center mb-8 shadow-inner border border-rule-light">
             <ImageBroken size={48} weight="bold" className="text-ink-2" />
          </div>
          <h2 className="text-3xl font-semibold text-ink mb-4 tracking-tighter">
            Restaurant Not Found
          </h2>
          <p className="text-sm font-medium text-ink-2 max-w-[280px] leading-relaxed">
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
    <div className="min-h-screen bg-paper-2 font-sans relative selection:bg-accent/20 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto lg:px-8 lg:py-8 lg:flex lg:gap-8 min-h-screen">
        
        {/* ── LEFT SIDEBAR (Desktop) ──────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 sticky top-8 self-start bg-surface/80 rounded-lg border border-rule-light overflow-hidden" 
               style={{ maxHeight: "calc(100vh - 4rem)" }}>
          
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-[80px] rounded-full" />
            
            <div className="relative z-10 text-center flex flex-col items-center">
                {restaurant?.logo_url ? (
                <img
                    src={restaurant.logo_url}
                    className="w-24 h-24 object-cover rounded-xl  border-white mb-6"
                />
                ) : (
                <div className="w-20 h-20 bg-accent flex items-center justify-center text-white rounded-xl mb-6">
                    <Storefront size={40} weight="bold" />
                </div>
                )}
                <h1 className="font-semibold text-ink text-2xl tracking-tighter leading-tight mb-2">
                {restaurant?.name}
                </h1>
                {restaurant?.address && (
                <p className="text-[11px] font-bold text-ink-2 flex items-start gap-2 leading-relaxed opacity-80 max-w-[200px]">
                    <MapPin size={16} weight="bold" className="text-accent mt-0.5" />
                    {restaurant.address}
                </p>
                )}
            </div>
            
            {table && (
              <div className="mt-8 bg-ink text-white p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-accent/20 blur-2xl rounded-full" />
                 <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider opacity-40 mb-1">Table Number</p>
                    <p className="text-lg font-semibold tracking-tight">{table.name}</p>
                 </div>
                 <ForkKnife size={24} weight="bold" className="text-accent" />
              </div>
            )}
          </div>

          <div className="px-8 flex-1 overflow-y-auto custom-scrollbar pb-10">
            <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-wider mb-6 mt-4 pl-1">
              Categories
            </p>
            <nav className="space-y-3">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-lg text-sm group relative",
                    activeTab === c.id
                      ? "bg-accent text-white font-semibold"
                      : "text-ink-2 hover:bg-paper-2 hover:text-ink font-bold",
                  )}
                >
                  {c.name}
                  {activeTab === c.id && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN CONTENT (Menu Grid) ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-36 lg:pb-8">
          
          {/* Mobile Hero Header */}
          <div className="lg:hidden relative bg-surface pb-6 rounded-b-xl mb-6 overflow-hidden">
             {/* Abstract Cover */}
            <div className="h-48 w-full bg-ink relative">
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent blur-[100px] rounded-full opacity-30" />
            </div>

            <div className="px-8 relative -mt-16 flex flex-col items-center text-center">
              {restaurant?.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  className="w-32 h-32 object-cover rounded-lg border-[6px] border-white bg-white"
                />
              ) : (
                <div className="w-28 h-28 bg-accent rounded-lg flex items-center justify-center text-white border-[6px] border-white">
                  <Storefront size={48} weight="bold" />
                </div>
              )}
              
              <div className="mt-4">
                <h1 className="font-ex-black text-2xl text-ink tracking-tighter">
                  {restaurant?.name}
                </h1>
                {table && (
                   <span className="inline-block mt-2 px-4 py-1.5 rounded-full bg-ink text-white text-[11px] font-semibold uppercase tracking-widest">
                      Table {table.name}
                   </span>
                )}
              </div>
            </div>
            
            {/* Mobile horizontal category tabs (Boutique Style) */}
            <div className={cn(
                "sticky top-0 z-[50] mt-8",
                isScrolled ? "bg-surface/95 rounded-b-lg py-4" : "",
              )}>
              <div className="flex gap-4 px-8 overflow-x-auto scrollbar-hide snap-x no-scrollbar">
                {allCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className={cn(
                      "flex-shrink-0 px-8 py-3.5 rounded-lg text-xs snap-start",
                      activeTab === c.id
                        ? "bg-accent text-white font-semibold scale-105"
                        : "bg-paper-2 border border-rule-light text-ink-2 font-bold",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Category Title */}
          <div className="hidden lg:flex items-center justify-between mb-10 bg-surface/60 px-10 py-8 rounded-xl border border-rule-light">
            <div>
              <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2 leading-none">Category</p>
              <h2 className="font-semibold text-4xl text-ink tracking-tighter">
                {allCats.find((c) => c.id === activeTab)?.name ?? "Discovery"}
              </h2>
            </div>
            <div className="w-16 h-16 bg-ink rounded-xl flex items-center justify-center text-white">
               <ForkKnife size={28} weight="bold" className="text-accent" />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="px-6 lg:px-0">
            {categories.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center py-40 bg-surface rounded-xl border border-rule-light opacity-50">
                <Storefront size={64} weight="bold" className="text-ink-2 mb-6" />
                <p className="text-lg font-semibold text-ink tracking-tight">Updating Menu...</p>
                <p className="text-sm font-medium text-ink-2 mt-2">Please refresh in a moment.</p>
              </div>
            ) : activeItems.length === 0 ? (
              <div className="text-center py-32 bg-surface rounded-xl border border-rule-light text-ink-2 font-bold">
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
          className="hidden lg:block w-[360px] flex-shrink-0 sticky top-8 self-start bg-surface/80 rounded-lg border border-rule-light overflow-hidden"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <CartPanel {...orderFormProps} />
        </aside>
      </div>

      {/* ── MOBILE Floating Cart Button ──────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-[60] lg:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-ink text-white rounded-lg p-2.5 flex items-center justify-between overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-accent opacity-0 group-active:opacity-10 transition-opacity" />
            
            <div className="flex items-center gap-4 pl-4 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={24} weight="bold" className="text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-semibold w-6 h-6 rounded-full flex items-center justify-center border-ink">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-ink-2 font-semibold uppercase tracking-widest leading-none mb-1">Total Order</span>
                <span className="font-semibold text-lg text-white leading-none tracking-tight">
                  {fmt(cartTotal, restaurant?.currency)}
                </span>
              </div>
            </div>
            
            <div className="bg-accent text-white px-8 h-12 rounded-lg font-bold text-sm flex items-center gap-2 relative z-10">
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
