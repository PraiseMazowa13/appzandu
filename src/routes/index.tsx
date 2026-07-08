import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
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
  Search,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Heart,
  Zap,
  ChevronDown,
  PlayCircle,
  Check,
} from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";

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

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Catalogue soigné",
    desc: "Une sélection de produits triés à la main, mise à jour chaque semaine.",
  },
  {
    icon: Truck,
    title: "Livraison express",
    desc: "Livré partout en RDC en 24 à 48h, suivi de commande en temps réel.",
  },
  {
    icon: Smartphone,
    title: "Mobile Money",
    desc: "Payez en toute sécurité via Orange, Airtel ou M-Pesa.",
  },
  {
    icon: Heart,
    title: "Favoris & historique",
    desc: "Retrouvez vos coups de cœur et suivez toutes vos commandes.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement protégé",
    desc: "Vos transactions sont chiffrées et vérifiées à chaque étape.",
  },
  {
    icon: Headphones,
    title: "Support 7j/7",
    desc: "Une équipe disponible sur WhatsApp pour vous accompagner.",
  },
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Choisissez",
    desc: "Parcourez le catalogue et ajoutez vos produits au panier.",
  },
  {
    icon: CreditCard,
    title: "Commandez",
    desc: "Validez votre commande et payez via Mobile Money en un clic.",
  },
  {
    icon: PackageCheck,
    title: "Recevez",
    desc: "On vous livre chez vous, rapidement et en toute simplicité.",
  },
] as const;

const FAQS = [
  {
    q: "Où livrez-vous ?",
    a: "Nous livrons dans toutes les grandes villes de la RDC : Kinshasa, Lubumbashi, Goma, Bukavu, Matadi et plus encore. Les délais varient de 24h à 72h selon la ville.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons Orange Money, Airtel Money, M-Pesa et le paiement à la livraison dans certaines zones.",
  },
  {
    q: "Puis-je retourner un produit ?",
    a: "Oui, vous disposez de 7 jours pour nous retourner un produit non conforme. Contactez notre support pour organiser le retour.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Connectez-vous à votre espace client pour voir le statut de vos commandes en temps réel et télécharger vos factures.",
  },
  {
    q: "Le service client est-il disponible ?",
    a: "Oui, notre équipe est joignable 7j/7 sur WhatsApp au 0895 975 170.",
  },
] as const;

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const featured = products.slice(0, 9);
  const promos = products
    .filter((p) => p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents)
    .slice(0, 6);
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[]),
  ).slice(0, 6);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SiteShell>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:px-8 md:py-24">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Flame className="h-3.5 w-3.5" /> Nouveau en RDC
            </span>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Vos essentiels,
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                livrés en un éclair.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Zandu simplifie vos achats du quotidien : commande en 2 minutes,
              paiement Mobile Money, livraison rapide partout en RDC.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-hero px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-95"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:bg-muted"
              >
                <PlayCircle className="h-4 w-4 text-primary" />
                Voir la démonstration
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["bg-primary", "bg-primary-glow", "bg-accent"].map((c) => (
                    <span
                      key={c}
                      className={`inline-block h-6 w-6 rounded-full border-2 border-background ${c}`}
                    />
                  ))}
                </div>
                <span>
                  <span className="font-bold text-foreground">+500 clients</span> satisfaits
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-foreground">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right column — Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-hero opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-4 shadow-float">
              {/* Fake browser bar */}
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <div className="ml-3 flex-1 rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">
                  zandu.app / catalogue
                </div>
              </div>

              {/* Mock header */}
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-primary-foreground">
                    <Zap className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="font-display text-sm font-black">Zandu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-full bg-background" />
                  <span className="relative h-6 w-6 rounded-full bg-background">
                    <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      3
                    </span>
                  </span>
                </div>
              </div>

              {/* Mock product grid */}
              <div className="grid grid-cols-3 gap-2">
                {featured.slice(0, 6).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="overflow-hidden rounded-xl bg-muted"
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square bg-gradient-soft" />
                    )}
                  </motion.div>
                ))}
                {featured.length < 6 &&
                  Array.from({ length: 6 - featured.length }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-gradient-soft" />
                  ))}
              </div>

              {/* Mock stat strip */}
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-soft px-3 py-2">
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">
                    Total panier
                  </p>
                  <p className="font-display text-sm font-black">45 000 FC</p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">
                  Payer
                </span>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -left-3 top-14 hidden rounded-2xl bg-card p-3 shadow-float md:flex md:items-center md:gap-2"
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
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="absolute -right-3 bottom-14 hidden rounded-2xl bg-card p-3 shadow-float md:flex md:items-center md:gap-2"
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

      {/* ============ CATEGORIES ============ */}
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
                  <span className="whitespace-nowrap text-xs font-bold">{cat}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FEATURES ============ */}
      <section id="fonctionnalites" className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Fonctionnalités
            </p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
              Tout ce qu'il faut pour bien acheter
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Une expérience simple, rapide et sécurisée, pensée pour vous.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-float"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft transition group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ POURQUOI ZANDU ============ */}
      <section className="border-y border-border bg-gradient-soft px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Pourquoi Zandu
            </p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
              La façon la plus simple d'acheter en RDC
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Fini les allers-retours en boutique, les négociations et les paiements
              en cash. Avec Zandu, tout se passe depuis votre téléphone.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Sélection vérifiée : plus de produits contrefaits.",
                "Prix transparents : pas de mauvaise surprise à la caisse.",
                "Livraison suivie : vous savez toujours où en est votre commande.",
                "Support humain : une vraie équipe à votre écoute.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-foreground/90">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "500+", label: "Clients actifs" },
              { value: "24h", label: "Délai moyen" },
              { value: "4.9★", label: "Note moyenne" },
              { value: "7j/7", label: "Support" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <p className="font-display text-3xl font-black text-primary md:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section id="comment-ca-marche" className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              En 3 étapes
            </p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
              Commandez en moins de 2 minutes
            </h2>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-11 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative flex h-full flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-card"
              >
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
                  <s.icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-foreground text-xs font-black text-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      {featured.length > 0 && (
        <section className="px-4 pb-16 md:px-8 md:pb-24">
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
          </div>
        </section>
      )}

      {/* ============ PROMOS ============ */}
      {promos.length > 0 && (
        <section className="px-4 pb-16 md:px-8 md:pb-24">
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

      {/* ============ TESTIMONIALS ============ */}
      <section className="border-y border-border bg-gradient-soft px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Témoignages
            </p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
              Ils achètent déjà avec Zandu
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
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
                className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <Quote className="absolute right-4 top-4 h-6 w-6 text-primary/20" />
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
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

      {/* ============ FAQ ============ */}
      <section id="faq" className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              FAQ
            </p>
            <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Vous n'avez pas trouvé votre réponse ?{" "}
              <a
                href="https://wa.me/243895975170"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Contactez-nous
              </a>
              .
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-sm font-bold md:text-base">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="px-4 pb-20 md:px-8 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-8 text-primary-foreground shadow-float md:p-14">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
                  Prêt à passer votre première commande ?
                </h2>
                <p className="mt-3 text-sm opacity-90 md:text-base">
                  Créez votre compte en 30 secondes et profitez de la livraison
                  express partout en RDC.
                </p>
              </div>
              <div className="flex flex-wrap justify-start gap-3 md:justify-end">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-bold text-foreground shadow-soft hover:bg-card"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-primary-foreground backdrop-blur hover:bg-white/20"
                >
                  Explorer le catalogue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
