import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Flame, Truck, Heart } from "lucide-react";
import { useCart, formatPrice } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: favIds } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const isFav = !!favIds?.includes(product.id);

  const outOfStock = product.stock <= 0;
  const comparePrice = product.compare_at_price_cents;
  const hasPromo = comparePrice !== null && comparePrice > product.price_cents;
  const discountPct = hasPromo
    ? Math.round(
        (((comparePrice ?? product.price_cents) - product.price_cents) /
          (comparePrice ?? product.price_cents)) *
          100,
      )
    : 0;

  const showFreeShipping = product.free_shipping && !hasPromo;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card p-1.5 shadow-card md:p-3">
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
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-soft md:left-2 md:top-2 md:px-2.5 md:py-1 md:text-[11px]">
            <Flame className="h-2.5 w-2.5 md:h-3 md:w-3" /> -{discountPct}%
          </span>
        ) : showFreeShipping ? (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-foreground/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-background shadow-soft md:left-2 md:top-2 md:px-2.5 md:py-1 md:text-[10px]">
            <Truck className="h-2.5 w-2.5 md:h-3 md:w-3" /> Livraison<br />offerte
          </span>
        ) : product.badge ? (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft md:left-2 md:top-2 md:px-2.5 md:py-1 md:text-[10px]">
            {product.badge}
          </span>
        ) : null}

        {outOfStock && (
          <span className="absolute right-1.5 top-8 rounded-full bg-foreground/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-background md:right-2 md:top-10 md:px-2 md:text-[10px]">
            Rupture
          </span>
        )}

        {/* Favorite heart */}
        <Button variant="ghost" size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              toast.message("Connectez-vous pour sauvegarder vos favoris");
              navigate({ to: "/auth" });
              return;
            }
            toggleFav.mutate(product.id);
          }}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full shadow-soft transition md:right-2 md:top-2 md:h-8 md:w-8 ${
            isFav
              ? "bg-primary text-primary-foreground"
              : "bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <Heart className={`h-3 w-3 md:h-3.5 md:w-3.5 ${isFav ? "fill-current" : ""}`} />
        </Button>

        {/* Bottom-right round add button */}
        <Button variant="ghost" size="icon"
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
          className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition hover:scale-110 hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 md:bottom-2 md:right-2 md:h-9 md:w-9"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={3} />
        </Button>
      </Link>

      <Link to="/produit/$id" params={{ id: product.id }} className="mt-2 block min-h-7 md:min-h-9">
        <h3 className="line-clamp-2 font-display text-[10px] font-bold leading-snug sm:text-[11px] md:text-[13px]">
          {product.name}
        </h3>
      </Link>

      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1 md:mt-1">
        <span className="font-display text-xs font-black text-foreground md:text-base">
          {formatPrice(product.price_cents)}
        </span>
        {hasPromo && (
          <span className="text-[9px] font-medium text-muted-foreground line-through md:text-xs">
            {formatPrice((comparePrice ?? product.price_cents))}
          </span>
        )}
      </div>
    </article>
  );
}
