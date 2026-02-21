import api from "@/lib/axios";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  menu_items_count?: number;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  sort_order: number;
  category?: Category;
}

// ─── Categories ─────────────────────────────────────────

export const getCategories = () =>
  api.get<{ data: Category[] }>("/menu/categories").then((r) => r.data.data);

export const createCategory = (data: Partial<Category>) =>
  api
    .post<{ data: Category }>("/menu/categories", data)
    .then((r) => r.data.data);

export const updateCategory = (id: number, data: Partial<Category>) =>
  api
    .put<{ data: Category }>(`/menu/categories/${id}`, data)
    .then((r) => r.data.data);

export const deleteCategory = (id: number) =>
  api.delete(`/menu/categories/${id}`);

export const reorderCategories = (
  items: { id: number; sort_order: number }[],
) => api.patch("/menu/categories/reorder", { items });

// ─── Menu Items ──────────────────────────────────────────

export const getMenuItems = (
  params?: Record<string, string | number | boolean>,
) =>
  api
    .get<{ data: MenuItem[] }>("/menu/items", { params })
    .then((r) => r.data.data);

export const createMenuItem = (data: FormData) =>
  api
    .post<{ data: MenuItem }>("/menu/items", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);

export const updateMenuItem = (id: number, data: FormData) =>
  api
    .post<{ data: MenuItem }>(`/menu/items/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);

export const toggleMenuItem = (id: number) =>
  api
    .patch<{
      data: { id: number; is_available: boolean };
    }>(`/menu/items/${id}/toggle`)
    .then((r) => r.data.data);

export const deleteMenuItem = (id: number) => api.delete(`/menu/items/${id}`);

// ─── Public Menu ─────────────────────────────────────────

export interface PublicCategory extends Category {
  active_menu_items: MenuItem[];
}

export const getPublicMenu = (slug: string, tableId?: string) =>
  api
    .get<{
      data: {
        restaurant: {
          name: string;
          slug: string;
          logo_url: string | null;
          timezone: string;
          currency: string;
        };
        table: {
          id: number;
          name: string;
          capacity: number;
          status: string;
        } | null;
        categories: PublicCategory[];
      };
    }>(`/public/${slug}/menu`, { params: tableId ? { table: tableId } : {} })
    .then((r) => r.data.data);
