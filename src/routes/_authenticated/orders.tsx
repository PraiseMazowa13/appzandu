import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Package } from "lucide-react";
import { listMyOrders } from "@/lib/orders.functions";
import { formatPrice } from "@/stores/cart";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Mes commandes — Lumen" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const fetchFn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchFn() });

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Mes commandes</h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 grid place-items-center gap-2 rounded-3xl border border-dashed p-10 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((o: any) => (
            <li key={o.id} className="rounded-3xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("fr-FR")}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">
                  {o.status}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {(o.order_items as any[]).map((it, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {it.product_name} × {it.quantity}
                    </span>
                    <span>{formatPrice(it.unit_price_cents * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display font-bold">{formatPrice(o.total_cents)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
