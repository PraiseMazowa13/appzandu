import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, formatPrice } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";
import { createOrder } from "@/lib/orders.functions";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Lumen" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, totalCents, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);

  const mutation = useMutation({
    mutationFn: () =>
      createOrderFn({
        data: { items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })) },
      }),
    onSuccess: () => {
      clear();
      toast.success("Commande confirmée !");
      navigate({ to: "/orders" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/checkout",
    });
    if (result.error) toast.error("Connexion impossible");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 text-center">
        <p className="text-muted-foreground">Votre panier est vide.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Continuer mes achats
      </Link>

      <h1 className="mt-4 font-display text-2xl font-extrabold">Finaliser la commande</h1>

      <div className="mt-6 rounded-3xl bg-card p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold">Récapitulatif</h2>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {i.name} × {i.quantity}
              </span>
              <span className="font-semibold">{formatPrice(i.price_cents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-lg font-bold">{formatPrice(totalCents())}</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl bg-card p-5 shadow-card"
      >
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Chargement…</p>
        ) : !user ? (
          <div className="space-y-3 text-center">
            <h3 className="font-display text-lg font-bold">Connectez-vous pour payer</h3>
            <p className="text-xs text-muted-foreground">
              Un compte est nécessaire pour enregistrer votre commande.
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={signIn}
              className="w-full rounded-2xl border-2 font-semibold"
            >
              <GoogleIcon /> Continuer avec Google
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Connecté en tant que</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <Button
              size="lg"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="w-full rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft"
            >
              {mutation.isPending ? "Traitement…" : `Payer ${formatPrice(totalCents())}`}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
