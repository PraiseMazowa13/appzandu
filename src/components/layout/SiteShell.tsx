import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, Zap, X, Home, LayoutGrid, Heart, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, type ReactNode } from "react";
import { useCart } from "@/stores/cart";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/commande", label: "Commande" },
  { to: "/a-propos", label: "À propos" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const openCart = useCart((s) => s.open);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-20 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
              <Zap className="h-4 w-4" strokeWidth={3} />
            </span>
            <span>Zandu</span>
          </Link>

          <nav className="ml-8 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={user ? "/compte" : "/auth"}
              aria-label="Mon compte"
              className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-muted/70"
            >
              <UserIcon className="h-4 w-4" />
            </Link>
            <Button variant="ghost" size="icon"
              onClick={openCart}
              aria-label="Ouvrir le panier"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-muted/70"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-muted/70 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-background p-6 shadow-float"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-black">Menu</span>
                <Button variant="ghost" size="icon"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="mt-8 flex flex-col gap-2">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-3 text-base font-semibold text-foreground hover:bg-muted"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link
                  to={user ? "/compte" : "/auth"}
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-2xl bg-gradient-hero px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft"
                >
                  👤 {user ? "Mon compte" : "Se connecter"}
                </Link>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      <footer className="pb-24 md:pb-0 border-t border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:px-8">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-black">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
                <Zap className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              Zandu
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Vos essentiels, livrés en un éclair partout en RDC.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold">Navigation</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-foreground">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold">Contact</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>📞 0895 975 170</li>
              <li>💬 WhatsApp disponible</li>
              <li>💳 Mobile Money accepté</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zandu — Tous droits réservés
        </div>
      </footer>
      <nav aria-label="Navigation rapide" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center">
          <Button asChild variant="ghost" size="icon" className={`mx-auto rounded-full ${pathname === "/catalogue" ? "text-primary" : "text-muted-foreground"}`}><Link to="/catalogue" aria-label="Catalogue"><LayoutGrid /></Link></Button>
          <Button asChild variant="ghost" size="icon" className="mx-auto rounded-full text-muted-foreground"><Link to={user ? "/compte" : "/auth"} aria-label="Mes favoris"><Heart /></Link></Button>
          <Button asChild size="icon" className="mx-auto -mt-7 h-14 w-14 rounded-full border-4 border-background bg-gradient-hero shadow-soft"><Link to="/" aria-label="Accueil"><Home /></Link></Button>
          <Button variant="ghost" size="icon" onClick={openCart} aria-label="Mon panier" className="relative mx-auto rounded-full text-muted-foreground"><ShoppingBag />{count > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{count}</span>}</Button>
          <Button asChild variant="ghost" size="icon" className="mx-auto rounded-full text-muted-foreground"><Link to={user ? "/compte" : "/auth"} aria-label="Connexion et compte"><UserIcon /></Link></Button>
        </div>
      </nav>
    </div>
  );
}
