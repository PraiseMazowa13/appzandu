import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getProduct } from "@/lib/products.functions";
import { useCart, formatPrice } from "@/stores/cart";
import { toast } from "sonner";

const productQO = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });

export const Route = createFileRoute("/produit/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQO(params.id));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Produit"} — Zandu` },
      { name: "description", content: loaderData?.description ?? "Produit Zandu" },
      { property: "og:title", content: `${loaderData?.name ?? "Produit"} — Zandu` },
      { property: "og:description", content: loaderData?.description ?? "Découvrez ce produit chez Zandu." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.image_url?.startsWith("https://") ? [
        { property: "og:image", content: loaderData.image_url },
        { name: "twitter:image", content: loaderData.image_url },
      ] : []),
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="p-10 text-center text-muted-foreground">Produit introuvable.</div>
    </SiteShell>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQO(id));
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "details">("description");

  if (!product) return null;

  const hasPromo =
    product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center text-6xl font-black text-primary/30">
                {product.name.charAt(0)}
              </div>
            )}
            {product.badge && (
              <span className="absolute left-4 top-4 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                {product.badge}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col rounded-3xl bg-card p-5 md:p-7">
            {product.category && (
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {product.category}
              </span>
            )}
            <h1 className="mt-2 font-display text-3xl font-black md:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-black">
                {formatPrice(product.price_cents)}
              </span>
              {hasPromo && (
                <span className="text-base font-medium text-muted-foreground line-through">
                  {formatPrice((product.compare_at_price_cents ?? product.price_cents))}
                </span>
              )}
            </div>
            <div role="tablist" aria-label="Informations produit" className="mt-6 flex gap-2 border-b pb-3">
              <Button role="tab" aria-selected={tab === "description"} aria-controls="product-description" id="description-tab" variant={tab === "description" ? "default" : "ghost"} className="rounded-full" onClick={() => setTab("description")}>Description</Button>
              <Button role="tab" aria-selected={tab === "details"} aria-controls="product-details" id="details-tab" variant={tab === "details" ? "default" : "ghost"} className="rounded-full" onClick={() => setTab("details")}>Détails</Button>
            </div>
            {tab === "description" ? <p role="tabpanel" id="product-description" aria-labelledby="description-tab" className="mt-4 min-h-24 text-sm leading-relaxed text-muted-foreground">{product.description ?? "Aucune description."}</p> : <dl role="tabpanel" id="product-details" aria-labelledby="details-tab" className="mt-4 min-h-24 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Catégorie</dt><dd>{product.category ?? "Autres"}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Disponibilité</dt><dd>{product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Livraison</dt><dd>{product.free_shipping ? "Offerte" : "À confirmer"}</dd></div></dl>}

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-3 py-1 font-semibold ${
                  product.stock > 0
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {product.stock > 0 ? `✓ En stock (${product.stock})` : "Rupture de stock"}
              </span>
              {product.free_shipping && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
                  <Truck className="h-3 w-3" /> Livraison offerte
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-semibold text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Paiement sécurisé
              </span>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-full bg-foreground p-2 text-background">
              <div className="flex h-10 shrink-0 items-center rounded-full border border-background/40">
                <Button variant="ghost" size="icon" aria-label="Diminuer la quantité" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-9 w-9 rounded-full"><Minus /></Button>
                <span className="w-6 text-center text-sm font-bold" aria-live="polite">{quantity}</span>
                <Button variant="ghost" size="icon" aria-label="Augmenter la quantité" disabled={quantity >= product.stock} onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="h-9 w-9 rounded-full"><Plus /></Button>
              </div>
            <Button
              disabled={product.stock <= 0}
              onClick={() => {
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price_cents: product.price_cents,
                    image_url: product.image_url,
                  },
                  Math.min(quantity, product.stock),
                );
                toast.success("Ajouté au panier");
                openCart();
              }}
              className="h-11 min-w-0 flex-1 rounded-full bg-gradient-hero px-3 text-xs font-bold text-primary-foreground shadow-soft sm:text-sm"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter au panier
            </Button>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
