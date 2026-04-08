import { useState } from "react";
import { 
  ShoppingCart, 
  ForkKnife, 
  Minus, 
  Plus, 
  Receipt, 
  CircleNotch, 
  X, 
  CaretRight,
  ImageBroken
} from "@phosphor-icons/react";
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from "@/lib/axios";


export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image_url?: string | null;
}

export interface OrderFormProps {
  cartItems: CartItem[];
  currency?: string;
  tableId: string | null;
  slug: string;
  onUpdateQty: (itemId: number, qty: number) => void;
  onOrderSuccess: (orderNumber: string) => void;
}

const fmt = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

// ─── Shared Order Form Hook ────────────────────────────────
export function useOrderForm({
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
    if (cartItems.length === 0) return;
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
          ?.message ?? "Failed to send order.";
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
export function CartPanel(props: OrderFormProps) {
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
    <div className="flex flex-col h-full bg-white">
      <div className="px-8 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-md">
        <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-3 tracking-tighter uppercase tracking-widest text-xs">
          <ShoppingCart size={18} weight="duotone" className="text-primary" />
          My Orders
        </h2>
        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-lg w-fit tracking-widest uppercase border border-primary/10">
          <ForkKnife size={14} weight="bold" />
          {tableId ? "Dine In" : "Take Away"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center h-full opacity-40">
            <ShoppingCart size={48} weight="duotone" className="text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-900 tracking-tight">Empty Cart</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 group animate-in">
              <div className="relative flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" />
                ) : (
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                    <ImageBroken size={24} />
                   </div>
                )}
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-sm font-extrabold text-slate-900 line-clamp-2 tracking-tight leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-primary font-black">{fmt(item.price, currency)}</p>
                  <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-danger active:scale-90"><Minus size={10} weight="bold" /></button>
                    <span className="text-xs font-black text-slate-900 w-3 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 active:scale-90"><Plus size={10} weight="bold" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-8 pb-8 pt-6 border-t border-slate-50 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="space-y-3">
          <Input 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="Your Name (Optional)" 
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Order Notes..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
          />
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 border-dashed">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pay</span>
          <span className="font-black text-2xl text-slate-900 tracking-tighter">
            {fmt(subtotal, currency)}
          </span>
        </div>

        {error && <p className="text-xs font-bold text-danger bg-danger/5 p-3 rounded-xl border border-danger/10 text-center animate-in">{error}</p>}

        <Button
          onClick={handleOrder}
          disabled={loading || cartItems.length === 0}
          className="w-full py-4 rounded-2xl shadow-xl shadow-primary/20 font-bold tracking-tight"
        >
          {loading ? <CircleNotch size={20} className="animate-spin" /> : <Receipt size={20} weight="bold" className="mr-2" />}
          {loading ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}

// ─── Mobile Cart Drawer (Redesigned as Bottom Sheet) ──────────────────────────
export function CartDrawer({
  open,
  onClose,
  ...rest
}: OrderFormProps & { open: boolean; onClose: () => void }) {
  const { cartItems, currency, onUpdateQty } = rest;
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
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] lg:hidden transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-[40px] z-[70] max-h-[90vh] flex flex-col shadow-2xl lg:hidden animate-in slide-in-from-bottom duration-500">
        <div className="w-full flex justify-center py-4 bg-white rounded-t-[40px]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-8 py-2 border-b border-slate-50">
          <div>
            <h2 className="font-black text-xl text-slate-900 tracking-tight">Cart</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{cartItems.length} items</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"><X size={20} weight="bold" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
           {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              {item.image_url ? (
                <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" />
              ) : (
                 <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100"><ImageBroken size={24} /></div>
              )}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-tight">{item.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-primary font-black">{fmt(item.price, currency)}</p>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 p-0 border border-slate-100"><Minus size={12} weight="bold" /></button>
                    <span className="text-xs font-black text-slate-900 w-4 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-md p-0"><Plus size={12} weight="bold" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-8 pb-14 pt-6 bg-white border-t border-slate-100 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" />
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
          </div>

          <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-1.5 pl-6 shadow-xl overflow-hidden relative border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Payable</span>
              <span className="font-extrabold text-xl text-white tracking-tighter leading-none">{fmt(subtotal, currency)}</span>
            </div>
            
            <Button
              onClick={handleOrder}
              disabled={loading || cartItems.length === 0}
              className="px-4 h-8 font-black text-[9px] relative z-10 shadow-lg shadow-primary/20 rounded-lg"
            >
              {loading ? <CircleNotch size={12} className="animate-spin" /> : <div className="flex items-center gap-1.5"><span>CHECKOUT</span> <CaretRight size={12} weight="bold" /></div>}
            </Button>
          </div>
          {error && <p className="text-xs font-bold text-danger text-center animate-shake">{error}</p>}
        </div>
      </div>
    </>
  );
}
