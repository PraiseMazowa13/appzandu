import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
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
      { property: "og:image", content: loaderData?.image_url ?? "" },
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
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-soft shadow-card">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-square w-full object-cover"
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

          <div className="flex flex-col">
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
                  {formatPrice(product.compare_at_price_cents!)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              {product.description ?? "Aucune description."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-3 py-1 font-semibold ${
                  product.stock > 0
                    ? "bg-emerald-100 text-emerald-800"
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

            <button
              disabled={product.stock <= 0}
              onClick={() => {
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price_cents: product.price_cents,
                    image_url: product.image_url,
                  },
                  1,
                );
                toast.success("Ajouté au panier");
                openCart();
              }}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-hero px-6 py-4 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
