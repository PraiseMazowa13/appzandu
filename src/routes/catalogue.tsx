import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";

const productsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue — Zandu" },
      { name: "description", content: "Découvrez tous les produits disponibles chez Zandu." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: CataloguePage,
});

function CataloguePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products],
  );
  const priceMax = useMemo(
    () => products.reduce((m, p) => Math.max(m, p.price_cents), 0) || 1_000_000,
    [products],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pmax = maxPrice > 0 ? maxPrice : priceMax;
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (p.price_cents > pmax) return false;
      if (needle && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [products, q, cat, maxPrice, priceMax]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black md:text-4xl">Catalogue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} disponible
            {filtered.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card md:grid-cols-[1fr_auto_auto] md:gap-4 md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit..."
              className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={priceMax}
              step={1000}
              value={maxPrice || priceMax}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="h-11 w-32 accent-primary"
            />
            <span className="whitespace-nowrap text-xs font-semibold tabular-nums">
              ≤ {(maxPrice || priceMax).toLocaleString("fr-FR")} FC
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucun produit ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
