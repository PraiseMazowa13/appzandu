import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { ProductCard, type Product } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Catalogue — Zandu" },
      { name: "description", content: "Découvrez tous les produits Zandu : grille rapide, prix accessibles, ajout au panier en un clic." },
      { property: "og:title", content: "Catalogue — Zandu" },
      { property: "og:description", content: "Explorez nos produits et commandez en quelques secondes." },
    ],
  }),
  component: ShopPage,
});

type Sort = "recent" | "price_asc" | "price_desc" | "available";

function ShopPage() {
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const products = useMemo(() => {
    let list = (data ?? []) as Product[];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.category ?? "").toLowerCase().includes(needle),
      );
    }
    if (sort === "price_asc") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    if (sort === "price_desc") list = [...list].sort((a, b) => b.price_cents - a.price_cents);
    if (sort === "available") list = list.filter((p) => p.stock > 0);
    return list;
  }, [data, q, sort]);

  return (
    <MobileShell>
      <div className="mt-3 space-y-4">
        <div>
          <h1 className="font-display text-2xl font-black sm:text-3xl">Catalogue</h1>
          <p className="text-sm text-muted-foreground">Trouvez votre produit en quelques secondes.</p>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher votre produit..."
              className="h-12 w-full rounded-full border-0 bg-card pl-11 pr-10 text-sm shadow-card outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground"
                aria-label="Effacer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full shadow-card transition ${showFilters ? "bg-gradient-hero text-primary-foreground" : "bg-card text-foreground ring-1 ring-border"}`}
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-3xl bg-card p-3 shadow-card">
            {([
              { id: "recent", label: "Nouveautés" },
              { id: "price_asc", label: "Prix ↑" },
              { id: "price_desc", label: "Prix ↓" },
              { id: "available", label: "En stock" },
            ] as { id: Sort; label: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${sort === opt.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 3-column compact grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Aucun produit ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        )}

        <p className="pb-6 text-center text-xs text-muted-foreground">
          {products.length} {products.length > 1 ? "produits" : "produit"}
        </p>
      </div>
    </MobileShell>
  );
}
