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
    <div className="flex flex-col h-full bg-surface">
      <div className="px-8 py-6 border-b border-paper-2 bg-surface/80">
        <h2 className="font-semibold text-ink text-lg flex items-center gap-3 tracking-tighter uppercase tracking-widest text-xs">
          <ShoppingCart size={18} weight="bold" className="text-accent" />
          My Orders
        </h2>
        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-accent bg-accent/5 px-3 py-1.5 rounded-lg w-fit tracking-widest uppercase border border-accent/10">
          <ForkKnife size={14} weight="bold" />
          {tableId ? "Dine In" : "Take Away"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center h-full opacity-40">
            <ShoppingCart size={48} weight="bold" className="text-ink-2 mb-4" />
            <p className="text-sm font-bold text-ink tracking-tight">Empty Cart</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 group">
              <div className="relative flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} className="w-16 h-16 rounded-lg object-cover border border-rule-light" />
                ) : (
                   <div className="w-16 h-16 rounded-lg bg-paper-2 flex items-center justify-center text-ink-2 border border-rule-light">
                    <ImageBroken size={24} />
                   </div>
                )}
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink line-clamp-2 tracking-tight leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-accent font-semibold">{fmt(item.price, currency)}</p>
                  <div className="flex items-center gap-2.5 bg-paper-2 rounded-xl p-1 border border-rule-light">
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center text-ink-2 hover:text-danger"><Minus size={10} weight="bold" /></button>
                    <span className="text-xs font-semibold text-ink w-3 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center text-white"><Plus size={10} weight="bold" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-8 pb-8 pt-6 border-t border-paper-2 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
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
            className="w-full bg-paper-2 border border-rule rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent resize-none"
          />
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-paper-2 border-dashed">
          <span className="text-xs font-bold text-ink-2 uppercase tracking-widest">Total Pay</span>
          <span className="font-semibold text-2xl text-ink tracking-tighter">
            {fmt(subtotal, currency)}
          </span>
        </div>

        {error && <p className="text-xs font-bold text-danger bg-danger/5 p-3 rounded-xl border border-danger/10 text-center">{error}</p>}

        <Button
          onClick={handleOrder}
          disabled={loading || cartItems.length === 0}
          className="w-full py-4 rounded-lg font-bold tracking-tight"
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
      <div className="fixed inset-0 bg-ink/40 z-[60] lg:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 w-full bg-surface rounded-t-lg z-[70] max-h-[90vh] flex flex-col lg:hidden">
        <div className="w-full flex justify-center py-4 bg-surface rounded-t-[40px]">
          <div className="w-12 h-1.5 bg-ink-2 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-8 py-2 border-b border-paper-2">
          <div>
            <h2 className="font-semibold text-xl text-ink tracking-tight">Cart</h2>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-0.5">{cartItems.length} items</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-lg bg-paper-2 text-ink-2 flex items-center justify-center hover:bg-paper-2"><X size={20} weight="bold" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
           {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              {item.image_url ? (
                <img src={item.image_url} className="w-16 h-16 rounded-lg object-cover border border-rule-light" />
              ) : (
                 <div className="w-16 h-16 rounded-lg bg-paper-2 flex items-center justify-center text-ink-2 border border-rule-light"><ImageBroken size={24} /></div>
              )}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink line-clamp-2 leading-tight">{item.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-accent font-semibold">{fmt(item.price, currency)}</p>
                  <div className="flex items-center gap-3 bg-paper-2 rounded-xl p-1 border border-rule-light">
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-ink-2 p-0 border border-rule-light"><Minus size={12} weight="bold" /></button>
                    <span className="text-xs font-semibold text-ink w-4 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white p-0"><Plus size={12} weight="bold" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-8 pb-14 pt-6 bg-surface border-t border-rule-light space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" />
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
          </div>

          <div className="flex justify-between items-center bg-ink rounded-lg p-1.5 pl-6 overflow-hidden relative border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 flex flex-col">
              <span className="text-[8px] font-semibold text-ink-2 uppercase tracking-widest mb-0.5">Payable</span>
              <span className="font-semibold text-xl text-white tracking-tighter leading-none">{fmt(subtotal, currency)}</span>
            </div>
            
            <Button
              onClick={handleOrder}
              disabled={loading || cartItems.length === 0}
              className="px-4 h-8 font-bold text-[9px] relative z-10 rounded-lg"
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
