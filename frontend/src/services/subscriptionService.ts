import api from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────

export interface SubscriptionPlan {
  id: number;
  name: string;
  price_monthly: number;
  max_staff: number;
  max_menu_items: number;
  max_tables: number;
  features: string[];
}

export interface CurrentSubscription {
  id: number;
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  starts_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  days_remaining: number;
  is_active: boolean;
  is_expiring: boolean;
  plan: SubscriptionPlan | null;
}

// ─── API calls ────────────────────────────────────────────

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await api.get("/subscription/plans");
  return res.data.data;
}

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  const res = await api.get("/subscription/current");
  return res.data.data;
}

export async function subscribe(
  planId: number,
  months = 1,
): Promise<CurrentSubscription> {
  const res = await api.post("/subscription/subscribe", {
    plan_id: planId,
    months,
  });
  return res.data.data;
}

export async function cancelSubscription(): Promise<CurrentSubscription> {
  const res = await api.post("/subscription/cancel");
  return res.data.data;
}
