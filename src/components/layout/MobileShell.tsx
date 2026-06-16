import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBag, User, Search, Package } from "lucide-react";
import { useCart } from "@/stores/cart";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  const { totalCount, open } = useCart();
  const count = totalCount();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/orders", icon: Package, label: "Commandes" },
    { to: "/account", icon: User, label: "Compte" },
  ];

  return (
    <div className="relative min-h-screen pb-28">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Lumen</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <button
              onClick={open}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-foreground text-background shadow-soft transition-transform active:scale-95"
              aria-label="Panier"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                >
                  {count}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-2">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto w-[calc(100%-2rem)] max-w-sm">
        <div className="glass flex items-center justify-around rounded-full px-2 py-2 shadow-float">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-1.5"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-hero"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon
                  className={`relative h-5 w-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                />
                <span
                  className={`relative text-[10px] font-medium ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
