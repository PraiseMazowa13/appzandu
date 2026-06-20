import { Link } from "@tanstack/react-router";
import { Plus, Flame, Truck } from "lucide-react";
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
  free_shipping?: boolean | null;
};

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

  const showFreeShipping = product.free_shipping && !hasPromo;

  return (
    <article className="group flex flex-col">
      <Link
        to="/produit/$id"
        params={{ id: product.id }}
        aria-label={`Voir ${product.name}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-gradient-soft"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl font-black text-primary/30">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Top-left pill badge */}
        {hasPromo && discountPct >= 5 ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-soft">
            <Flame className="h-3 w-3" /> -{discountPct}%
          </span>
        ) : showFreeShipping ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-background shadow-soft">
            <Truck className="h-3 w-3" /> Livraison<br />offerte
          </span>
        ) : product.badge ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
            {product.badge}
          </span>
        ) : null}

        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-bold uppercase text-background">
            Rupture
          </span>
        )}

        {/* Bottom-right round add button */}
        <button
          disabled={outOfStock}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
          aria-label="Ajouter au panier"
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background text-primary shadow-float transition hover:scale-110 hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </Link>

      <Link to="/produit/$id" params={{ id: product.id }} className="mt-2 block">
        <h3 className="line-clamp-2 font-display text-[12px] font-black uppercase leading-tight tracking-wide md:text-[13px]">
          {product.name}
        </h3>
      </Link>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-sm font-black text-foreground md:text-base">
          {formatPrice(product.price_cents)}
        </span>
        {hasPromo && (
          <span className="text-[10px] font-medium text-muted-foreground line-through md:text-xs">
            {formatPrice(product.compare_at_price_cents!)}
          </span>
        )}
      </div>
    </article>
  );
}
