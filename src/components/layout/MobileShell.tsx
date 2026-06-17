import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, LogIn } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  const { totalCount, open } = useCart();
  const count = totalCount();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen pb-12">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
              <span className="font-display text-sm font-extrabold">Z</span>
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">Zandu</span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link to="/" className={`text-sm font-semibold ${pathname === "/" ? "text-primary" : "text-foreground/70"}`}>
              Accueil
            </Link>
            <Link to="/shop" className={`text-sm font-semibold ${pathname === "/shop" ? "text-primary" : "text-foreground/70"}`}>
              Catalogue
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
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
            {user ? (
              <button
                onClick={() => navigate({ to: "/account" })}
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-soft ring-1 ring-border"
                aria-label="Compte"
              >
                <User className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-hero px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95 sm:px-4 sm:text-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">{children}</main>
    </div>
  );
}
