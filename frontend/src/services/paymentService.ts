import api from "@/lib/axios";
import type { Order } from "./orderService";

// ─── Types ───────────────────────────────────────────────

export type PaymentMethod =
  | "cash"
  | "debit_card"
  | "credit_card"
  | "qris"
  | "transfer";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: number;
  order_id: number;
  cashier_id: number | null;
  method: PaymentMethod;
  amount: number;
  change_amount: number;
  status: PaymentStatus;
  transaction_ref: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  cashier?: { id: number; name: string };
}

export interface StorePaymentPayload {
  order_id: number;
  method: PaymentMethod;
  amount: number;
  transaction_ref?: string;
  notes?: string;
}

export interface SnapTokenResult {
  snap_token: string;
  client_key: string;
  snap_url: string;
}

// ─── Labels ──────────────────────────────────────────────

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Tunai",
  debit_card: "Kartu Debit",
  credit_card: "Kartu Kredit",
  qris: "QRIS",
  transfer: "Transfer Bank",
};

export const METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: "💵",
  debit_card: "💳",
  credit_card: "💳",
  qris: "📱",
  transfer: "🏦",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Menunggu",
  paid: "Lunas",
  failed: "Gagal",
  refunded: "Direfund",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

// ─── API calls ───────────────────────────────────────────

/** Process a cash / manual payment */
export async function processPayment(
  payload: StorePaymentPayload,
): Promise<Order> {
  const res = await api.post("/payments", payload);
  return res.data.data;
}

/** Get payment detail */
export async function getPayment(id: number): Promise<Payment> {
  const res = await api.get(`/payments/${id}`);
  return res.data.data;
}

/** Refund a payment (owner only) */
export async function refundPayment(id: number): Promise<Payment> {
  const res = await api.patch(`/payments/${id}/refund`);
  return res.data.data;
}

/** Get payment history (paginated) */
export async function getPaymentHistory(params?: {
  page?: number;
  per_page?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  date?: string;
}): Promise<{
  data: Payment[];
  meta: { current_page: number; last_page: number; total: number };
}> {
  const res = await api.get("/payments/history", { params });
  return { data: res.data.data, meta: res.data.meta };
}

/** Get Midtrans Snap token for QRIS / digital payment */
export async function getMidtransSnapToken(
  orderId: number,
): Promise<SnapTokenResult> {
  const res = await api.post("/payments/midtrans/snap-token", {
    order_id: orderId,
  });
  return res.data.data;
}
