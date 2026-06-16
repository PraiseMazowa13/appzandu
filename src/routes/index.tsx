import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { ProductCard, type Product } from "@/components/product/ProductCard";
import { listProducts } from "@/lib/products.functions";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — L'essentiel de la tech" },
      {
        name: "description",
        content: "Découvrez notre sélection d'objets tech minimalistes : audio, wearables, accessoires de bureau.",
      },
      { property: "og:title", content: "Lumen — L'essentiel de la tech" },
      { property: "og:description", content: "Une boutique minimaliste pour les objets tech essentiels." },
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

  const products = data ?? [];
  const featured = products[0];
  const rest = products.slice(1);

  return (
    <MobileShell>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-3 overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground shadow-soft"
      >
        <div className="grid grid-cols-5 items-center gap-2 p-5">
          <div className="col-span-3 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Nouvelle collection
            </div>
            <h1 className="font-display text-2xl font-extrabold leading-tight">
              L'essentiel<br />de la tech.
            </h1>
            <p className="text-xs text-primary-foreground/80">
              Sélection minimaliste, livraison rapide.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("grid");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-4 py-2 text-xs font-semibold text-background shadow-soft"
            >
              Découvrir <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="col-span-2">
            <img
              src={heroImg}
              alt="Sélection de produits tech"
              width={400}
              height={400}
              className="h-32 w-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </motion.section>

      <section id="grid" className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Produits phares</h2>
          <span className="text-xs text-muted-foreground">{products.length} articles</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            Aucun produit disponible pour le moment.
          </div>
        ) : (
          <>
            {/* Bento grid: featured large + 2 small */}
            {featured && (
              <div className="mb-3 grid grid-cols-2 gap-3">
                <ProductCard product={featured as Product} large />
                <div className="flex flex-col gap-3">
                  {rest.slice(0, 2).map((p) => (
                    <ProductCard key={p.id} product={p as Product} />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {rest.slice(2).map((p) => (
                <ProductCard key={p.id} product={p as Product} />
              ))}
            </div>
          </>
        )}
      </section>
    </MobileShell>
  );
}
