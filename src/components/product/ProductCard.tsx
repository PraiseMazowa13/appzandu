import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCart, formatPrice } from "@/stores/cart";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  category: string | null;
};

export function ProductCard({ product, large = false }: { product: Product; large?: boolean }) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-card ${large ? "row-span-2" : ""}`}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="flex flex-1 flex-col">
        <div
          className={`relative w-full overflow-hidden bg-gradient-soft ${large ? "aspect-[4/5]" : "aspect-square"}`}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="text-5xl font-bold text-primary/30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          {product.category && (
            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">
              {product.category}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</h3>
          <div className="flex items-end justify-between gap-2">
            <span className="font-display text-base font-bold text-foreground">
              {formatPrice(product.price_cents)}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          add({
            id: product.id,
            name: product.name,
            price_cents: product.price_cents,
            image_url: product.image_url,
          });
          open();
        }}
        aria-label="Ajouter au panier"
        className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-hero text-primary-foreground shadow-soft transition-transform active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
