import api from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "cooking"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "dine_in" | "take_away" | "delivery";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  price_snapshot: number;
  subtotal: number;
  notes: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  table_id: number | null;
  cashier_id: number | null;
  order_type: OrderType;
  status: OrderStatus;
  notes: string | null;
  customer_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_status: PaymentStatus;
  public_token: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  table?: { id: number; name: string } | null;
  cashier?: { id: number; name: string } | null;
  restaurant?: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string;
  } | null;
  payment?: {
    id: number;
    method: import("./paymentService").PaymentMethod;
    amount: number;
    change_amount: number;
    status: import("./paymentService").PaymentStatus;
    transaction_ref: string | null;
    notes: string | null;
    paid_at: string | null;
  } | null;
}

export interface PaginatedOrders {
  data: Order[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  order_type?: OrderType;
  date?: string;
  per_page?: number;
  page?: number;
}

export interface CreateOrderPayload {
  table_id?: number | null;
  order_type: OrderType;
  notes?: string;
  customer_name?: string;
  items: {
    menu_item_id: number;
    quantity: number;
    notes?: string;
  }[];
}

// ─── API calls ────────────────────────────────────────────

export const getOrders = (filters?: OrderFilters) =>
  api.get<PaginatedOrders>("/orders", { params: filters }).then((r) => r.data);

export const getOrder = (id: number) =>
  api.get<{ data: Order }>(`/orders/${id}`).then((r) => r.data.data);

export const createOrder = (payload: CreateOrderPayload) =>
  api.post<{ data: Order }>("/orders", payload).then((r) => r.data.data);

export const updateOrderStatus = (id: number, status: OrderStatus) =>
  api
    .patch<{ data: Order }>(`/orders/${id}/status`, { status })
    .then((r) => r.data.data);

export const cancelOrder = (id: number) => api.delete(`/orders/${id}`);

// ─── Status helpers ───────────────────────────────────────

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  cooking: "Dimasak",
  ready: "Siap",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  cooking: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Makan di tempat",
  take_away: "Bawa pulang",
  delivery: "Delivery",
};
