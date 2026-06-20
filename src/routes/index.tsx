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
  const featured = products.slice(0, 6);

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Flame className="h-3.5 w-3.5" /> Boutique en ligne RDC
            </span>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Vos essentiels,
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                livrés en un éclair
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Découvrez une sélection de produits triés sur le volet, livrés rapidement
              partout en RDC. Paiement Mobile Money sécurisé.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-hero px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-95"
              >
                Explorer le catalogue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/a-propos"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
              >
                À propos de Zandu
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
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/80 p-4 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Produit vedette
                </p>
                <p className="mt-0.5 font-display text-base font-bold">
                  {featured[0]?.name ?? "Découvrez nos nouveautés"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-soft md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                  Offre limitée
                </p>
                <h2 className="mt-1 font-display text-2xl font-black md:text-3xl">
                  🔥 -10% + Livraison offerte
                </h2>
                <p className="mt-1 text-sm opacity-90">
                  Sur une sélection de produits, jusqu'à épuisement des stocks.
                </p>
              </div>
              <Link
                to="/catalogue"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-bold text-foreground shadow-soft hover:bg-card"
              >
                J'en profite <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Top sélection
              </p>
              <h2 className="mt-1 font-display text-2xl font-black md:text-3xl">
                Produits vedettes
              </h2>
            </div>
            <Link
              to="/catalogue"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:inline-flex"
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucun produit pour le moment. Ajoutez-en depuis l'administration.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="bg-card/40 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-2xl font-black md:text-3xl">
            Pourquoi choisir Zandu ?
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Truck, label: "Livraison rapide", desc: "Partout en RDC" },
              { icon: ShieldCheck, label: "Paiement sécurisé", desc: "100% protégé" },
              { icon: Smartphone, label: "Mobile Money", desc: "Orange, Airtel, M-Pesa" },
              { icon: Star, label: "Produits de qualité", desc: "Sélection vérifiée" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-3xl border border-border bg-card p-5 text-center shadow-card md:p-6"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-sm font-bold md:text-base">{label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
