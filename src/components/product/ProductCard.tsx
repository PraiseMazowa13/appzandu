import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart, formatPrice } from "@/stores/cart";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  image_url: string | null;
  badge: string | null;
};

function badgeStyle(badge: string) {
  const b = badge.toLowerCase();
  if (b.includes("promo")) return "bg-primary text-primary-foreground";
  if (b.includes("best")) return "bg-foreground text-background";
  if (b.includes("nouveau") || b.includes("new")) return "bg-emerald-500 text-white";
  return "bg-accent text-accent-foreground";
}

function badgeIcon(badge: string) {
  const b = badge.toLowerCase();
  if (b.includes("promo")) return "🔥";
  if (b.includes("best")) return "⭐";
  if (b.includes("nouveau") || b.includes("new")) return "✨";
  return "";
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const outOfStock = product.stock <= 0;
  const hasPromo =
    product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;
  const discountPct = hasPromo
    ? Math.round(
        ((product.compare_at_price_cents! - product.price_cents) /
          product.compare_at_price_cents!) *
          100,
      )
    : 0;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition hover:shadow-float"
    >
      <Link
        to="/produit/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-gradient-soft"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl font-black text-primary/30">
            {product.name.charAt(0)}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-soft ${badgeStyle(product.badge)}`}
            >
              {badgeIcon(product.badge)} {product.badge}
            </span>
          )}
          {outOfStock && (
            <span className="inline-flex rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-background">
              Rupture
            </span>
          )}
        </div>
        {hasPromo && discountPct >= 5 && (
          <span className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground shadow-soft">
            -{discountPct}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          {product.category && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {product.category}
            </span>
          )}
          <h3 className="mt-0.5 line-clamp-1 font-display text-base font-bold">{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-black text-foreground">
            {formatPrice(product.price_cents)}
          </span>
          {hasPromo && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {formatPrice(product.compare_at_price_cents!)}
            </span>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            to="/produit/$id"
            params={{ id: product.id }}
            className="grid place-items-center rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Voir détails
          </Link>
          <button
            disabled={outOfStock}
            onClick={() => {
              add(
                {
                  id: product.id,
                  name: product.name,
                  price_cents: product.price_cents,
                  image_url: product.image_url,
                },
                1,
              );
              toast.success("Ajouté au panier");
              openCart();
            }}
            className="grid place-items-center gap-1 rounded-full bg-gradient-hero px-3 py-2 text-xs font-bold text-primary-foreground shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Ajouter
            </span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
