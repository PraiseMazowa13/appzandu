import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/products.functions";
import { useCart, formatPrice } from "@/stores/cart";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: `Produit — Zandu` },
      { name: "description", content: `Détails du produit sur Zandu.` },
      { property: "og:title", content: `Produit — Zandu` },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-muted-foreground">Produit introuvable.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center text-destructive">{error.message}</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const fetchProduct = useServerFn(getProduct);
  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct({ data: { id } }),
  });
  const { add, open } = useCart();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Chargement…</div>;
  }
  if (!data) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Produit introuvable.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 overflow-hidden rounded-3xl bg-gradient-soft shadow-card"
      >
        <div className="aspect-square w-full">
          {data.image_url ? (
            <img src={data.image_url} alt={data.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="text-7xl font-bold text-primary/30">{data.name.charAt(0)}</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-5 space-y-3">
        {data.category && (
          <span className="inline-block rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
            {data.category}
          </span>
        )}
        <h1 className="font-display text-2xl font-extrabold leading-tight">{data.name}</h1>
        <p className="font-display text-2xl font-bold text-primary">{formatPrice(data.price_cents)}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        <p className="text-xs text-muted-foreground">{data.stock} en stock</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl px-5 pb-6 pt-3">
        <Button
          size="lg"
          className="w-full rounded-2xl bg-gradient-hero text-primary-foreground shadow-float"
          onClick={() => {
            add({
              id: data.id,
              name: data.name,
              price_cents: data.price_cents,
              image_url: data.image_url,
            });
            open();
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter au panier
        </Button>
      </div>
    </div>
  );
}
