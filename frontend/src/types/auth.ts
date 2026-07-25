export type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "customer";

export interface RestaurantData {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logo_url: string | null;
  settings: Record<string, unknown> | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  restaurant: RestaurantData | null;
}
