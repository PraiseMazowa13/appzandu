import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — Zandu" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre compte Zandu." },
    ],
  }),
  component: ResetPasswordPage,
});

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Mot de passe : 8 caractères min."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash; the client picks it up automatically.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = PasswordSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour !");
      navigate({ to: "/compte" });
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-2xl font-black"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
            <Zap className="h-5 w-5" strokeWidth={3} />
          </span>
          Zandu
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-float md:p-8">
          <h1 className="font-display text-xl font-black">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>

          {!ready ? (
            <p className="mt-6 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              Lien invalide ou expiré. Demandez un nouveau lien depuis la page de connexion.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <PwField
                placeholder="Nouveau mot de passe"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
              />
              <PwField
                placeholder="Confirmer le mot de passe"
                value={form.confirm}
                onChange={(v) => setForm({ ...form, confirm: v })}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-hero px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Mettre à jour
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/auth" className="text-muted-foreground hover:text-foreground">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

function PwField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Lock className="h-4 w-4" />
      </span>
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
