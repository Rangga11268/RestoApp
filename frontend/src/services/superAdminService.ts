import api from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────

export interface PlatformStats {
  restaurants: { total: number; active: number; inactive: number };
  users: number;
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    inactive: number;
  };
  revenue: { this_month: number; total: number };
  growth: { month: string; count: number }[];
}

export interface RestaurantListItem {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  owner: { id: number; name: string; email: string } | null;
  subscription: {
    status: string;
    ends_at: string | null;
    days_remaining: number;
    plan: string | null;
  } | null;
}

export interface RestaurantDetail extends RestaurantListItem {
  users_count: number;
  menu_items_count: number;
  tables_count: number;
  orders_count: number;
  address: string | null;
  logo_url: string | null;
  timezone: string;
  currency: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ActivityLogItem {
  id: number;
  action: string;
  subject_type: string;
  subject_id: number | null;
  properties: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  restaurant_id: number | null;
  user: { id: number; name: string; email: string; role: string } | null;
}

// ─── API calls ────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await api.get("/superadmin/stats");
  return res.data.data;
}

export async function getAdminRestaurants(params?: {
  search?: string;
  status?: string;
  subscription?: string;
  page?: number;
}): Promise<PaginatedResult<RestaurantListItem>> {
  const res = await api.get("/superadmin/restaurants", { params });
  return res.data.data;
}

export async function getAdminRestaurant(
  id: number,
): Promise<RestaurantDetail> {
  const res = await api.get(`/superadmin/restaurants/${id}`);
  return res.data.data;
}

export async function toggleAdminRestaurant(
  id: number,
): Promise<{ id: number; is_active: boolean }> {
  const res = await api.patch(`/superadmin/restaurants/${id}/toggle`);
  return res.data.data;
}

export async function getActivityLogs(params?: {
  search?: string;
  restaurant_id?: number;
  page?: number;
}): Promise<PaginatedResult<ActivityLogItem>> {
  const res = await api.get("/superadmin/logs", { params });
  return res.data.data;
}
