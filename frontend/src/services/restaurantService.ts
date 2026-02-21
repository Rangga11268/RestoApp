import api from "@/lib/axios";

export interface RestaurantSettings {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  timezone: string;
  currency: string;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  subscription?: {
    status: string;
    ends_at: string;
    days_remaining: number;
    plan: {
      name: string;
      price_monthly: number;
      max_staff: number;
      max_menu_items: number;
      max_tables: number;
    };
  };
}

export const getRestaurant = () =>
  api.get<{ data: RestaurantSettings }>("/restaurant").then((r) => r.data.data);

export const updateRestaurant = (data: FormData) =>
  api
    .post<{ data: RestaurantSettings }>("/restaurant", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);
