export const ORDER_STATUSES = ["received", "preparing", "shipped", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "Préparée",
  shipped: "Expédiée",
  delivered: "Livrée",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  received: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

/** Maps legacy/DB values onto the 4 tracked statuses. */
export function normalizeStatus(raw: string | null | undefined): OrderStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "delivered" || s === "completed") return "delivered";
  if (s === "shipped") return "shipped";
  if (s === "preparing" || s === "confirmed" || s === "paid") return "preparing";
  return "received";
}

export function statusIndex(raw: string | null | undefined): number {
  return ORDER_STATUSES.indexOf(normalizeStatus(raw));
}
