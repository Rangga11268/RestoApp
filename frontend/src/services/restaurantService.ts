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
}

export const getRestaurant = () =>
  api.get<{ data: RestaurantSettings }>("/restaurant").then((r) => r.data.data);

export const updateRestaurant = (data: FormData) =>
  api
    .post<{ data: RestaurantSettings }>("/restaurant", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);
