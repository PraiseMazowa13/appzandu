import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Truck, Shield } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { ProductCard, type Product } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zandu — Vos essentiels, livrés en un éclair" },
      {
        name: "description",
        content: "Zandu, votre boutique express : commandez vos essentiels et recevez-les rapidement, simplement, à petit prix.",
      },
      { property: "og:title", content: "Zandu — Vos essentiels, livrés en un éclair" },
      { property: "og:description", content: "Livraison rapide, prix accessibles, expérience fluide." },
    ],
  }),
  component: Index,
});

function Index() {
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const products = (data ?? []) as Product[];
  const trending = products.slice(0, 6);
  const newArrivals = products.slice(6, 12);

  return (
    <MobileShell>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mt-3 overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-soft sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative max-w-xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <Zap className="h-3 w-3" /> Livraison express
          </span>
          <h1 className="font-display text-3xl font-black leading-[1.05] sm:text-5xl">
            Zandu : vos essentiels,<br className="hidden sm:block" /> livrés en un éclair.
          </h1>
          <p className="max-w-md text-sm text-primary-foreground/90 sm:text-base">
            Une nouvelle façon de faire vos achats du quotidien. Simple, rapide,
            accessible — Zandu vous accompagne partout, à tout moment.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background shadow-float transition-transform hover:scale-[1.02]"
            >
              Explorer le catalogue <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-4 text-xs font-medium text-primary-foreground/90">
              <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Livraison rapide</span>
              <span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Paiement sûr</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tendances */}
      <Section title="Tendances" subtitle="Les plus vus de la semaine" link="/shop" isLoading={isLoading} products={trending} />

      {/* Nouveautés */}
      {newArrivals.length > 0 && (
        <Section title="Nouveautés" subtitle="Fraîchement ajoutés au catalogue" link="/shop" isLoading={false} products={newArrivals} />
      )}

      {products.length === 0 && !isLoading && (
        <div className="mt-6 rounded-3xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun produit disponible pour le moment.
        </div>
      )}
    </MobileShell>
  );
}

function Section({
  title,
  subtitle,
  link,
  isLoading,
  products,
}: {
  title: string;
  subtitle: string;
  link: string;
  isLoading: boolean;
  products: Product[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        </div>
        <Link to={link} className="shrink-0 text-xs font-semibold text-primary hover:underline sm:text-sm">
          Tout voir →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      )}
    </section>
  );
}
