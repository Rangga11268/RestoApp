import api from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: "manager" | "cashier" | "kitchen";
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
}

export interface StaffFormData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role: "manager" | "cashier" | "kitchen";
  phone?: string;
}

// ─── API calls ────────────────────────────────────────────

export async function getStaff(): Promise<StaffMember[]> {
  const res = await api.get("/staff");
  return res.data.data;
}

export async function createStaff(data: StaffFormData): Promise<StaffMember> {
  const res = await api.post("/staff", data);
  return res.data.data;
}

export async function updateStaff(
  id: number,
  data: Partial<StaffFormData>,
): Promise<StaffMember> {
  const res = await api.put(`/staff/${id}`, data);
  return res.data.data;
}

export async function toggleStaff(id: number): Promise<StaffMember> {
  const res = await api.patch(`/staff/${id}/toggle`);
  return res.data.data;
}

export async function deleteStaff(id: number): Promise<void> {
  await api.delete(`/staff/${id}`);
}
