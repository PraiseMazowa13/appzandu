import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Flame, Truck } from "lucide-react";
import { useCart, formatPrice, discountedPrice } from "@/stores/cart";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  discount_percent?: number | null;
  free_shipping?: boolean | null;
};

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);

  const discount = product.discount_percent ?? 0;
  const hasDiscount = discount > 0;
  const finalPrice = hasDiscount ? discountedPrice(product.price_cents, discount) : product.price_cents;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col"
    >
      <Link to="/product/$id" params={{ id: product.id }} className="flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-soft shadow-card">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="text-4xl font-bold text-primary/30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Badge marketing */}
          {hasDiscount ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-soft">
              <Flame className="h-2.5 w-2.5" /> -{discount}%
            </span>
          ) : product.free_shipping ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-[9px] font-bold leading-tight text-background shadow-soft">
              <Truck className="h-2.5 w-2.5" /> LIVRAISON<br/>OFFERTE
            </span>
          ) : null}

          {/* Floating + button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              add({
                id: product.id,
                name: product.name,
                price_cents: finalPrice,
                image_url: product.image_url,
              });
              open();
            }}
            aria-label="Ajouter au panier"
            className="absolute -bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background text-primary shadow-float ring-1 ring-border transition-transform active:scale-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className={`mt-3 flex flex-col gap-1 px-0.5 ${compact ? "" : ""}`}>
          <h3 className="line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-foreground sm:text-xs">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xs font-extrabold text-foreground sm:text-sm">
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.price_cents)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
