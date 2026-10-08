import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, Truck, ShieldCheck, Smartphone, Star } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products.functions";

const productsQO = queryOptions({ queryKey: ["products", "all"], queryFn: () => listProducts() });
const selectBannerProduct = (products: Awaited<ReturnType<typeof listProducts>>) => products.find(p => p.image_url && p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents) ?? products.find(p => p.image_url);
export const Route = createFileRoute("/")({
  head: ({ loaderData }) => ({ meta: [
    { title: "Zandu — Boutique en ligne RDC" },
    { name: "description", content: "Découvrez les produits Zandu et commandez en RDC avec Mobile Money." },
    { property: "og:title", content: "Zandu — Boutique en ligne RDC" },
    { property: "og:description", content: "Vos essentiels, vos offres et vos nouveautés en RDC." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(selectBannerProduct(loaderData ?? [])?.image_url?.startsWith("https://") ? [
      { property: "og:image", content: selectBannerProduct(loaderData ?? [])?.image_url ?? "" },
      { name: "twitter:image", content: selectBannerProduct(loaderData ?? [])?.image_url ?? "" },
    ] : []),
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: HomePage,
  errorComponent: () => <SiteShell><div className="p-8 text-center text-muted-foreground">Erreur de chargement.</div></SiteShell>,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = [...new Set(products.map(p => p.category).filter((c): c is string => Boolean(c)))];
  const featured = products.filter(p => (!category || p.category === category) && p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 9);
  const maxDiscount = products.reduce((max, p) => p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents ? Math.max(max, Math.round((1 - p.price_cents / p.compare_at_price_cents) * 100)) : max, 0);
  const bannerProduct = selectBannerProduct(products);

  return <SiteShell>
    <div>
      {/* 1. Recherche + hero — bande crème dégradée */}
      <section className="border-b border-border/60 bg-gradient-soft pb-7 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <form onSubmit={e => e.preventDefault()} role="search" className="mb-5 flex h-12 items-center gap-3 rounded-full bg-card px-4 shadow-card">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input aria-label="Rechercher des produits" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full border-l" title="Filtres du catalogue"><Link to="/catalogue" aria-label="Filtres du catalogue"><SlidersHorizontal /></Link></Button>
          </form>
          <div className="relative isolate min-h-48 overflow-hidden rounded-3xl bg-muted md:min-h-72">
            {bannerProduct?.image_url && <img src={bannerProduct.image_url} alt={bannerProduct.name} className="absolute inset-0 h-full w-full object-cover object-center md:object-right" />}
            <div className="relative flex min-h-48 w-2/3 flex-col items-start justify-center bg-background/90 px-5 py-6 md:min-h-72 md:w-1/2 md:px-10">
              <span className="mb-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Boutique RDC</span>
              <h1 className="font-display text-3xl font-black md:text-5xl">Zandu</h1>
              <p className="mt-2 text-base font-bold md:text-xl">{maxDiscount > 0 ? `Soldes jusqu’à −${maxDiscount}%` : "La sélection du moment"}</p>
              <Button asChild className="mt-4 h-10 rounded-full bg-gradient-hero px-5 font-bold shadow-soft"><Link to="/catalogue">Découvrir <ArrowRight /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Catégories — bande claire */}
      {categories.length > 0 && <section className="border-b border-border/60 bg-background py-5">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Catégories</h2>
          <nav aria-label="Catégories" className="flex gap-4 overflow-x-auto pb-3 md:gap-7">
            <Button variant="ghost" onClick={() => setCategory(null)} aria-pressed={category === null} className="h-auto w-16 shrink-0 flex-col gap-2 p-0 hover:bg-transparent md:w-20">
              <span className={`grid h-14 w-14 place-items-center rounded-full border-2 md:h-18 md:w-18 ${category === null ? "border-primary bg-accent text-primary" : "border-transparent bg-muted"}`}><SlidersHorizontal className="h-5 w-5" /></span><span className="text-xs">Tout</span>
            </Button>
            {categories.map(c => { const image = products.find(p => p.category === c && p.image_url)?.image_url; return <Button key={c} variant="ghost" onClick={() => setCategory(category === c ? null : c)} aria-pressed={category === c} className="h-auto w-16 shrink-0 flex-col gap-2 p-0 hover:bg-transparent md:w-20">
              <span className={`h-14 w-14 overflow-hidden rounded-full border-2 md:h-18 md:w-18 ${category === c ? "border-primary" : "border-transparent"}`}>{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-muted text-lg">{c.charAt(0)}</span>}</span>
              <span className="min-h-8 w-full whitespace-normal text-center text-[11px] leading-4">{c}</span>
            </Button>; })}
          </nav>
        </div>
      </section>}

      {/* 3. Bande promo — dégradé corail */}
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <p className="font-display text-lg font-black md:text-xl">{maxDiscount > 0 ? `Soldes jusqu’à −${maxDiscount}%` : "La sélection Zandu du moment"}</p>
          <Button asChild variant="ghost" className="h-9 shrink-0 rounded-full bg-primary-foreground/15 px-4 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/25"><Link to="/catalogue">J’en profite <ArrowRight /></Link></Button>
        </div>
      </section>

      {/* 4. Produits — bande chaude */}
      <section className="bg-surface-warm py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold md:text-2xl">{category ?? (search ? "Résultats" : "Pour vous")}</h2><Button asChild variant="link" className="shrink-0 px-0 text-xs"><Link to="/catalogue">Tout voir <ArrowRight /></Link></Button></div>
          {featured.length ? <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5">{featured.map(p => <ProductCard key={p.id} product={p} />)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">Aucun produit trouvé.</p>}
        </div>
      </section>

      {/* 5. Avantages — bande sombre */}
      <section className="bg-surface-deep py-8 text-surface-deep-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-4 md:grid-cols-4 md:px-8">
          {[{ icon: Truck, label: "Livraison rapide" }, { icon: ShieldCheck, label: "Paiement sécurisé" }, { icon: Smartphone, label: "Mobile Money" }, { icon: Star, label: "Qualité vérifiée" }].map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-foreground/10 text-primary"><Icon className="h-4 w-4" /></span>
            <span className="text-xs font-semibold">{label}</span>
          </div>)}
        </div>
      </section>
    </div>
  </SiteShell>;
}
