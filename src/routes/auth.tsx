import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Zap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Se connecter — Zandu" },
      { name: "description", content: "Accédez à votre compte Zandu pour suivre vos commandes et retrouver vos favoris." },
      { property: "og:title", content: "Se connecter — Zandu" },
      { property: "og:description", content: "Accédez à votre compte Zandu pour suivre vos commandes et retrouver vos favoris." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const EmailSchema = z.string().trim().email("Email invalide");
const PasswordSchema = z.string().min(8, "Mot de passe : 8 caractères min.");
const SignInSchema = z.object({ email: EmailSchema, password: PasswordSchema });
const SignUpSchema = SignInSchema.extend({
  full_name: z.string().trim().min(2, "Nom requis").max(80),
});

type Mode = "signin" | "signup" | "magic" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/compte" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const parsed = SignInSchema.safeParse(form);
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bienvenue !");
        navigate({ to: "/compte" });
      } else if (mode === "signup") {
        const parsed = SignUpSchema.safeParse(form);
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.full_name },
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email.");
        setMode("signin");
      } else if (mode === "magic") {
        const parsed = EmailSchema.safeParse(form.email);
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithOtp({
          email: parsed.data,
          options: { emailRedirectTo: window.location.origin + "/compte" },
        });
        if (error) throw error;
        toast.success("Lien magique envoyé ! Vérifiez votre boîte mail.");
      } else if (mode === "forgot") {
        const parsed = EmailSchema.safeParse(form.email);
        if (!parsed.success) return toast.error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Email de réinitialisation envoyé !");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Mode; label: string }[] = [
    { key: "signin", label: "Connexion" },
    { key: "signup", label: "Créer un compte" },
  ];

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
          {(mode === "signin" || mode === "signup") && (
            <div className="flex gap-2 rounded-full bg-muted p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMode(t.key)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition ${
                    mode === t.key
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {mode === "magic" && (
            <h2 className="font-display text-xl font-black">Lien magique</h2>
          )}
          {mode === "forgot" && (
            <h2 className="font-display text-xl font-black">Mot de passe oublié</h2>
          )}
          {(mode === "magic" || mode === "forgot") && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "magic"
                ? "Recevez un lien de connexion instantané par email."
                : "Nous vous enverrons un lien pour créer un nouveau mot de passe."}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field
                icon={<User className="h-4 w-4" />}
                type="text"
                placeholder="Nom complet"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Adresse email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            {(mode === "signin" || mode === "signup") && (
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="Mot de passe (8 caractères min.)"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-hero px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" && "Se connecter"}
              {mode === "signup" && "Créer mon compte"}
              {mode === "magic" && "Envoyer le lien magique"}
              {mode === "forgot" && "Envoyer l'email"}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center text-xs">
            {mode === "signin" && (
              <>
                <button
                  onClick={() => setMode("magic")}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Se connecter avec un lien magique
                </button>
                <div>
                  <button
                    onClick={() => setMode("forgot")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </>
            )}
            {(mode === "magic" || mode === "forgot") && (
              <button
                onClick={() => setMode("signin")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Retour à la connexion
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos conditions d'utilisation.
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            ← Retour à la boutique
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
