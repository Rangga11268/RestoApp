import api from "@/lib/axios";

export interface Table {
  id: number;
  name: string;
  capacity: number;
  qr_code: string | null;
  status: "available" | "occupied" | "reserved" | "inactive";
  is_active: boolean;
}

export const getTables = () =>
  api.get<{ data: Table[] }>("/tables").then((r) => r.data.data);

export const createTable = (data: {
  name: string;
  capacity: number;
  is_active?: boolean;
}) => api.post<{ data: Table }>("/tables", data).then((r) => r.data.data);

export const updateTable = (id: number, data: Partial<Table>) =>
  api.put<{ data: Table }>(`/tables/${id}`, data).then((r) => r.data.data);

export const deleteTable = (id: number) => api.delete(`/tables/${id}`);

export const regenerateQr = (id: number) =>
  api
    .post<{ data: { qr_code: string } }>(`/tables/${id}/regenerate-qr`)
    .then((r) => r.data.data);
