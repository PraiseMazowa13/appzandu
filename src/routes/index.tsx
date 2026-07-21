import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, Smartphone, Star, ArrowRight, Flame } from "lucide-react";
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

  return (
    <SiteShell>
      {/* HERO — simple */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Flame className="h-3.5 w-3.5" /> Boutique RDC
            </span>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Vos essentiels,
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                livrés en un éclair
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Produits sélectionnés, livraison rapide en RDC, paiement Mobile Money.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-hero px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-95"
              >
                Voir le catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-hero opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-float">
              {featured[0]?.image_url ? (
                <img
                  src={featured[0].image_url}
                  alt={featured[0].name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] bg-gradient-soft" />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-black md:text-3xl">
              Nos produits
            </h2>
            <Link
              to="/catalogue"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:inline-flex"
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
              <div className="grid grid-cols-3 gap-3 md:gap-5">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/catalogue"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background shadow-float transition hover:bg-primary"
                >
                  Voir plus de produits
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ADVANTAGES — compact */}
      <section className="border-t border-border bg-card/40 px-4 py-8 md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {[
            { icon: Truck, label: "Livraison rapide" },
            { icon: ShieldCheck, label: "Paiement sécurisé" },
            { icon: Smartphone, label: "Mobile Money" },
            { icon: Star, label: "Qualité vérifiée" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-card"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-xs font-bold md:text-sm">{label}</h3>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
