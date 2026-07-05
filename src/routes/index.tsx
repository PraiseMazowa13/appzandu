import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Truck,
  ShieldCheck,
  Smartphone,
  Star,
  ArrowRight,
  Flame,
  Sparkles,
  Headphones,
  BadgePercent,
  Quote,
} from "lucide-react";
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
  const featured = products.slice(0, 9);
  const promos = products
    .filter(
      (p) => p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents,
    )
    .slice(0, 6);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[]),
  ).slice(0, 6);

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
              Découvrez une sélection de produits triés sur le volet, livrés
              rapidement partout en RDC. Paiement Mobile Money sécurisé.
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

            {/* Trust row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {[
                    "bg-primary",
                    "bg-primary-glow",
                    "bg-accent",
                  ].map((c) => (
                    <span
                      key={c}
                      className={`inline-block h-6 w-6 rounded-full border-2 border-background ${c}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">+500 clients</span> satisfaits
              </div>
              <div className="flex items-center gap-1">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-foreground">4.9/5</span>
              </div>
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
              <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
                <Sparkles className="h-3 w-3" /> Nouveau
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/80 p-4 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Produit vedette
                </p>
                <p className="mt-0.5 font-display text-base font-bold">
                  {featured[0]?.name ?? "Découvrez nos nouveautés"}
                </p>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -left-3 top-6 hidden rounded-2xl bg-card p-3 shadow-float md:flex md:items-center md:gap-2"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Livraison
                </p>
                <p className="text-xs font-bold">24-48h</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-3 bottom-16 hidden rounded-2xl bg-card p-3 shadow-float md:flex md:items-center md:gap-2"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <BadgePercent className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Promo
                </p>
                <p className="text-xs font-bold">Jusqu'à -40%</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="px-4 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:px-0">
              {categories.map((cat, i) => (
                <Link
                  key={cat}
                  to="/catalogue"
                  className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-float md:shrink"
                >
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-soft ${
                      i % 2 === 0 ? "bg-gradient-hero" : "bg-foreground"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold">
                    {cat}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROMO BANNER */}
      <section className="mt-6 px-4 md:mt-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-soft md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
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
            <>
              <div className="grid grid-cols-3 gap-3 md:gap-5">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
              <div className="mt-10 flex justify-center">
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

      {/* PROMO DEALS */}
      {promos.length > 0 && (
        <section className="px-4 pb-14 md:px-8 md:pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
                  <Flame className="h-3.5 w-3.5" /> Bons plans
                </p>
                <h2 className="mt-1 font-display text-2xl font-black md:text-3xl">
                  En promotion
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {promos.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ADVANTAGES */}
      <section className="bg-card/40 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-xl font-black md:text-2xl">
            Pourquoi choisir Zandu ?
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {[
              { icon: Truck, label: "Livraison rapide", desc: "Partout en RDC" },
              { icon: ShieldCheck, label: "Paiement sécurisé", desc: "100% protégé" },
              { icon: Smartphone, label: "Mobile Money", desc: "Orange, Airtel, M-Pesa" },
              { icon: Star, label: "Qualité vérifiée", desc: "Sélection triée" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-card md:flex-col md:gap-2 md:p-4 md:text-center"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft md:h-10 md:w-10">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xs font-bold md:text-sm">
                    {label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground md:text-xs">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Ils nous font confiance
            </p>
            <h2 className="mt-1 font-display text-2xl font-black md:text-3xl">
              Avis clients
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Grâce M.",
                city: "Kinshasa",
                text: "Livraison ultra rapide et produit conforme. Je recommande à 100% !",
              },
              {
                name: "Patrick K.",
                city: "Lubumbashi",
                text: "Le paiement Mobile Money a fonctionné sans souci. Service au top.",
              },
              {
                name: "Sarah L.",
                city: "Goma",
                text: "Des produits de qualité à des prix corrects. Ma boutique préférée.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="relative rounded-3xl border border-border bg-card p-6 shadow-card"
              >
                <Quote className="absolute right-4 top-4 h-6 w-6 text-primary/20" />
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                  "{t.text}"
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero font-display text-sm font-black text-primary-foreground">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER / CTA */}
      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-float md:p-12">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-hero opacity-20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <Headphones className="h-3.5 w-3.5" /> Besoin d'aide ?
                </div>
                <h2 className="mt-3 font-display text-2xl font-black leading-tight md:text-3xl">
                  Notre équipe est là pour vous, 7j/7.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Une question sur un produit, une commande ou la livraison ?
                  Écrivez-nous, on répond vite.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/243000000000"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-hero px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-95"
                  >
                    Contacter sur WhatsApp
                  </a>
                  <Link
                    to="/catalogue"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted"
                  >
                    Voir le catalogue
                  </Link>
                </div>
              </div>
              <div className="hidden justify-end md:flex">
                <div className="relative">
                  <div className="grid h-40 w-40 place-items-center rounded-[2rem] bg-gradient-hero text-primary-foreground shadow-float">
                    <Headphones className="h-16 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
