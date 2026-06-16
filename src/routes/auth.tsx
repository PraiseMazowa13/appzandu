import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Lumen" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function signIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Connexion impossible");
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm space-y-6 rounded-3xl bg-card p-8 shadow-float">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-hero text-primary-foreground shadow-soft">
            <span className="font-display text-xl font-extrabold">L</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold">Bienvenue sur Lumen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour continuer</p>
        </div>
        <Button
          size="lg"
          variant="outline"
          onClick={signIn}
          className="w-full rounded-2xl border-2 font-semibold"
        >
          Continuer avec Google
        </Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
