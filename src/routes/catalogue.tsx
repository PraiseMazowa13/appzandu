import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
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

type SortKey = "featured" | "price_asc" | "price_desc" | "promo";

function CataloguePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);
  const PAGE_SIZE = 12;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products],
  );
  const priceMax = useMemo(
    () => products.reduce((m, p) => Math.max(m, p.price_cents), 0) || 1_000_000,
    [products],
  );

  const activeFilters =
    (cat !== "all" ? 1 : 0) + (maxPrice !== null ? 1 : 0) + (sort !== "featured" ? 1 : 0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pmax = maxPrice ?? priceMax;
    const list = products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (p.price_cents > pmax) return false;
      if (needle && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
    switch (sort) {
      case "price_asc":
        return [...list].sort((a, b) => a.price_cents - b.price_cents);
      case "price_desc":
        return [...list].sort((a, b) => b.price_cents - a.price_cents);
      case "promo":
        return [...list].sort((a, b) => {
          const ap = a.compare_at_price_cents && a.compare_at_price_cents > a.price_cents ? 1 : 0;
          const bp = b.compare_at_price_cents && b.compare_at_price_cents > b.price_cents ? 1 : 0;
          return bp - ap;
        });
      default:
        return list;
    }
  }, [products, q, cat, maxPrice, priceMax, sort]);

  const reset = () => {
    setCat("all");
    setMaxPrice(null);
    setSort("featured");
  };

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

        <div className="mb-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit..."
              className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFilters > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucun produit ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm md:items-center md:justify-center md:p-6"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-background shadow-float md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-black">Filtres</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Trier par
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "featured", l: "Recommandés" },
                    { v: "promo", l: "Promotions" },
                    { v: "price_asc", l: "Prix croissant" },
                    { v: "price_desc", l: "Prix décroissant" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setSort(o.v as SortKey)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                        sort === o.v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Catégorie
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCat("all")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      cat === "all"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    Toutes
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCat(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        cat === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Prix maximum
                  </p>
                  <span className="text-xs font-bold tabular-nums">
                    ≤ {(maxPrice ?? priceMax).toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={priceMax}
                  step={1000}
                  value={maxPrice ?? priceMax}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
              <button
                onClick={reset}
                className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 rounded-full bg-gradient-hero px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
              >
                Voir {filtered.length} produit{filtered.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteShell>
  );
}
