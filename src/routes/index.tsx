import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, Smartphone, Star, ArrowRight, Sparkles, Zap, BadgePercent } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";

const productsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zandu — Boutique en ligne RDC" },
      { name: "description", content: "Vos essentiels livrés rapidement partout en RDC. Paiement Mobile Money sécurisé." },
      { property: "og:title", content: "Zandu — Boutique en ligne RDC" },
      { property: "og:description", content: "Vos essentiels livrés rapidement partout en RDC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: HomePage,
  errorComponent: () => (
    <SiteShell>
      <div className="p-8 text-center text-muted-foreground">Erreur de chargement.</div>
    </SiteShell>
  ),
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const featured = products.slice(0, 9);

  // Real max discount across active products (0 if none)
  const maxDiscount = products.reduce((max, p) => {
    if (!p.compare_at_price_cents || p.compare_at_price_cents <= p.price_cents) return max;
    const pct = Math.round(
      ((p.compare_at_price_cents - p.price_cents) / p.compare_at_price_cents) * 100,
    );
    return Math.max(max, pct);
  }, 0);

  return (
    <SiteShell>
      {/* HERO — carte dégradée corail pleine largeur */}
      <section className="px-3 pt-3 md:px-8 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-hero p-6 shadow-float md:p-12"
        >
          {/* Blobs décoratifs */}
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          {/* Cartes verre flottantes */}
          <div className="absolute -bottom-8 -right-6 hidden h-40 w-40 rotate-12 rounded-3xl border border-white/25 bg-white/10 backdrop-blur-xl md:block" />
          <div className="absolute right-16 top-10 hidden h-20 w-20 -rotate-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl md:block" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
              </span>
              Boutique RDC · Livraison 24h
            </span>

            <h1 className="mt-5 max-w-xl font-display text-4xl font-black leading-[1.08] tracking-tight text-primary-foreground md:text-6xl">
              Qualité au meilleur{" "}
              <span className="italic text-primary-foreground/80">prix.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/90 md:text-base">
              Produits sélectionnés, livraison express partout en RDC. Payez en toute sécurité par Mobile Money.
            </p>

            {/* Double CTA */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="group inline-flex items-center gap-2 rounded-2xl bg-background px-6 py-3.5 text-sm font-black text-primary shadow-float transition hover:scale-[1.02] active:scale-95"
              >
                Acheter maintenant
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              {maxDiscount > 0 && (
                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-primary-foreground backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                >
                  <BadgePercent className="h-4 w-4" />
                  Jusqu'à -{maxDiscount}%
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between md:mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> Tendances du moment
              </span>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Nos produits{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">phares</span>
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
                Sélectionnés pour vous — qualité vérifiée, livraison rapide.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="story-link inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary"
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucun produit pour le moment.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>

              {/* Bannière promo sombre */}
              <div className="relative mt-10 overflow-hidden rounded-[2.5rem] bg-foreground p-6 shadow-float md:mt-14 md:p-10">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/40 blur-[70px]" />
                <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary/20 blur-[60px]" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="text-background">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-background/15 bg-background/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur">
                      <Zap className="h-3 w-3" /> Promo spéciale
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-black leading-tight md:text-3xl">
                      {maxDiscount > 0
                        ? `Jusqu'à -${maxDiscount}% sur une sélection`
                        : "Découvrez toute la collection Zandu"}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-background/70">
                      Des dizaines de produits vérifiés, à petits prix, prêts à être livrés chez vous.
                    </p>
                  </div>
                  <Link
                    to="/catalogue"
                    className="group inline-flex shrink-0 items-center gap-2 self-start rounded-2xl bg-gradient-hero px-6 py-3.5 text-sm font-black text-primary-foreground shadow-float transition hover:scale-[1.02] active:scale-95 md:self-center"
                  >
                    Explorer les offres
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* AVANTAGES — pastilles dégradées */}
      <section className="border-t border-border bg-gradient-soft px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {[
            { icon: Truck, label: "Livraison rapide" },
            { icon: ShieldCheck, label: "Paiement sécurisé" },
            { icon: Smartphone, label: "Mobile Money" },
            { icon: Star, label: "Qualité vérifiée" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-hero text-primary-foreground shadow-soft">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-display text-xs font-bold md:text-sm">{label}</h3>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
