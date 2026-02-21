import api from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────

export interface DashboardToday {
  revenue: number;
  order_count: number;
  pending_orders: number;
  active_menus: number;
}

export interface ChartPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  total_qty: number;
  total_revenue: number;
}

export interface DashboardData {
  today: DashboardToday;
  chart: ChartPoint[];
  top_products: TopProduct[];
}

export interface SalesSummary {
  total_revenue: number;
  total_transactions: number;
  avg_per_day: number;
}

export interface SalesPoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface SalesData {
  summary: SalesSummary;
  chart: SalesPoint[];
}

export interface StaffStat {
  cashier_id: number;
  cashier_name: string;
  cashier_email: string | null;
  total_orders: number;
  total_revenue: number;
}

// ─── API calls ────────────────────────────────────────────

export async function getDashboardReport(): Promise<DashboardData> {
  const res = await api.get("/reports/dashboard");
  return res.data.data;
}

export async function getSalesReport(params?: {
  from?: string;
  to?: string;
  group_by?: "day" | "month";
}): Promise<SalesData> {
  const res = await api.get("/reports/sales", { params });
  return res.data.data;
}

export async function getTopProducts(params?: {
  from?: string;
  to?: string;
  limit?: number;
  sort_by?: "qty" | "revenue";
}): Promise<TopProduct[]> {
  const res = await api.get("/reports/top-products", { params });
  return res.data.data;
}

export async function getStaffPerformance(params?: {
  from?: string;
  to?: string;
}): Promise<StaffStat[]> {
  const res = await api.get("/reports/staff-performance", { params });
  return res.data.data;
}

// ─── Export helpers ───────────────────────────────────────

export interface ExportParams {
  from?: string;
  to?: string;
  group_by?: "day" | "month";
  limit?: number;
  sort_by?: "qty" | "revenue";
}

async function triggerBlobDownload(
  url: string,
  params: ExportParams,
  filename: string,
): Promise<void> {
  const res = await api.get(url, { params, responseType: "blob" });
  const href = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export function exportReportExcel(params: ExportParams): Promise<void> {
  const from = params.from ?? "";
  const to = params.to ?? "";
  const filename = `laporan-penjualan-${from}-${to}.xlsx`;
  return triggerBlobDownload("/reports/export/excel", params, filename);
}

export function exportReportPdf(params: ExportParams): Promise<void> {
  const from = params.from ?? "";
  const to = params.to ?? "";
  const filename = `laporan-penjualan-${from}-${to}.pdf`;
  return triggerBlobDownload("/reports/export/pdf", params, filename);
}
