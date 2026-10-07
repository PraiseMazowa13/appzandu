import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, formatPrice } from "@/stores/cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function CartSheet() {
  const { items, isOpen, close, setQty, remove, totalCents } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="flex w-full flex-col rounded-l-3xl bg-muted p-0 sm:max-w-md">
        <SheetHeader className="px-5 py-6 text-center">
          <SheetTitle className="font-display text-xl">Mon panier</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Votre panier est vide</p>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex gap-3 rounded-2xl bg-card p-3 shadow-card"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-soft">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary/40">{item.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-semibold">{item.name}</h4>
                        <Button variant="ghost" size="icon" aria-label={`Retirer ${item.name}`} onClick={() => remove(item.id)} className="h-6 w-6 text-primary hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                          <Button variant="ghost" size="icon"
                            aria-label={`Diminuer ${item.name}`} onClick={() => setQty(item.id, item.quantity - 1)}
                            className="grid h-6 w-6 place-items-center rounded-full bg-background"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button variant="ghost" size="icon"
                            aria-label={`Augmenter ${item.name}`} onClick={() => setQty(item.id, item.quantity + 1)}
                            className="grid h-6 w-6 place-items-center rounded-full bg-background"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-display text-sm font-bold">
                          {formatPrice(item.price_cents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="rounded-t-3xl bg-card px-5 py-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-xl font-bold">{formatPrice(totalCents())}</span>
            </div>
            <Button
              size="lg"
              className="h-12 w-full rounded-full bg-gradient-hero text-primary-foreground shadow-soft"
              onClick={() => {
                close();
                navigate({ to: "/commande" });
              }}
            >
              Passer la commande
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
