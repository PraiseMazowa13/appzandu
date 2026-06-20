import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LogOut, Plus, Pencil, Trash2, Package, Tag, AlertCircle, Upload, ShoppingCart, TrendingUp, Clock, Check, Trash } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { formatPrice } from "@/stores/cart";
import { toast } from "sonner";
import {
  adminLogin,
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — Zandu" }] }),
  component: AdminPage,
});

type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  image_url: string | null;
  badge: string | null;
  is_active: boolean;
  free_shipping: boolean;
};

const CREDS_KEY = "zandu-admin-creds";

function AdminPage() {
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(CREDS_KEY);
    if (raw) {
      try {
        setCreds(JSON.parse(raw));
      } catch {}
    }
  }, []);

  if (!creds) return <LoginScreen onSuccess={(c) => {
    sessionStorage.setItem(CREDS_KEY, JSON.stringify(c));
    setCreds(c);
  }} />;

  return (
    <Dashboard
      creds={creds}
      onLogout={() => {
        sessionStorage.removeItem(CREDS_KEY);
        setCreds(null);
      }}
    />
  );
}

function LoginScreen({ onSuccess }: { onSuccess: (c: { username: string; password: string }) => void }) {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <SiteShell>
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-10">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await login({ data: { username, password } });
              onSuccess({ username, password });
              toast.success("Bienvenue !");
            } catch (err: any) {
              toast.error(err?.message ?? "Identifiants invalides");
            } finally {
              setLoading(false);
            }
          }}
          className="w-full rounded-3xl border border-border bg-card p-8 shadow-float"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-black">Administration</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Connectez-vous pour gérer la boutique
          </p>
          <div className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Utilisateur</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-hero px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </SiteShell>
  );
}

const EMPTY: Omit<AdminProduct, "id"> = {
  name: "",
  description: "",
  category: "",
  price_cents: 0,
  compare_at_price_cents: null,
  stock: 0,
  image_url: "",
  badge: "",
  is_active: true,
  free_shipping: false,
};

function Dashboard({
  creds,
  onLogout,
}: {
  creds: { username: string; password: string };
  onLogout: () => void;
}) {
  const list = useServerFn(adminListProducts);
  const create = useServerFn(adminCreateProduct);
  const update = useServerFn(adminUpdateProduct);
  const del = useServerFn(adminDeleteProduct);
  const upload = useServerFn(adminUploadImage);

  const [items, setItems] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<Partial<AdminProduct> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    try {
      const rows = await list({ data: creds });
      setItems(rows as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      total: items.length,
      promo: items.filter((p) => p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents).length,
      out: items.filter((p) => p.stock <= 0).length,
    }),
    [items],
  );

  const startCreate = () => {
    setEditing({ ...EMPTY });
    setShowForm(true);
  };
  const startEdit = (p: AdminProduct) => {
    setEditing(p);
    setShowForm(true);
  };

  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const { url } = await upload({
      data: {
        ...creds,
        filename: file.name,
        contentType: file.type || "image/jpeg",
        base64,
      },
    });
    return url;
  };

  const submit = async () => {
    if (!editing) return;
    const payload = {
      name: (editing.name ?? "").trim(),
      description: editing.description ?? null,
      category: editing.category ?? null,
      price_cents: Number(editing.price_cents) || 0,
      compare_at_price_cents: editing.compare_at_price_cents
        ? Number(editing.compare_at_price_cents)
        : null,
      stock: Number(editing.stock) || 0,
      image_url: editing.image_url ?? null,
      badge: editing.badge ? String(editing.badge).trim() : null,
      is_active: editing.is_active ?? true,
    };
    if (!payload.name) {
      toast.error("Le nom est requis");
      return;
    }
    try {
      if (editing.id) {
        await update({ data: { ...creds, id: editing.id, product: payload } });
        toast.success("Produit mis à jour");
      } else {
        await create({ data: { ...creds, product: payload } });
        toast.success("Produit créé");
      }
      setShowForm(false);
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const [tab, setTab] = useState<"sales" | "products">("sales");

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-black md:text-4xl">Tableau de bord</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gérez votre boutique Zandu</p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        <div className="mt-6 inline-flex rounded-full bg-muted p-1">
          {(["sales", "products"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                tab === t
                  ? "bg-background text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "sales" ? "📊 Ventes" : "📦 Produits"}
            </button>
          ))}
        </div>

        {tab === "sales" ? (
          <SalesPanel productCount={stats.total} promoCount={stats.promo} outCount={stats.out} />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3 md:gap-5">
              <StatCard icon={Package} label="Produits" value={stats.total} tint="primary" />
              <StatCard icon={Tag} label="En promo" value={stats.promo} tint="emerald" />
              <StatCard icon={AlertCircle} label="Rupture" value={stats.out} tint="destructive" />
            </div>

            <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="min-w-0 truncate font-display text-xl font-black">Produits ({items.length})</h2>
              <button
                onClick={startCreate}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-hero px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft"
              >
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ajouter un produit</span><span className="sm:hidden">Ajouter</span>
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              {items.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">Aucun produit.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-3 md:gap-4 md:p-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-soft">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-primary/40">{p.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold">{p.name}</h3>
                          {p.badge && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {p.badge}
                            </span>
                          )}
                          {!p.is_active && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                              Désactivé
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                          <span className="font-display font-bold">{formatPrice(p.price_cents)}</span>
                          {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents && (
                            <span className="text-muted-foreground line-through">
                              {formatPrice(p.compare_at_price_cents)}
                            </span>
                          )}
                          <span className="text-muted-foreground">Stock : {p.stock}</span>
                          {p.category && <span className="text-muted-foreground">· {p.category}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startEdit(p)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Supprimer "${p.name}" ?`)) return;
                            try {
                              await del({ data: { ...creds, id: p.id } });
                              toast.success("Supprimé");
                              refresh();
                            } catch (e: any) {
                              toast.error(e?.message ?? "Erreur");
                            }
                          }}
                          className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>


      {showForm && editing && (
        <ProductForm
          value={editing}
          onChange={setEditing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={submit}
          onUpload={handleFile}
        />
      )}
    </SiteShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: any;
  label: string;
  value: number;
  tint: "primary" | "emerald" | "destructive";
}) {
  const tints = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-100 text-emerald-700",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card md:p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tints[tint]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl font-black md:text-3xl">{value}</p>
    </div>
  );
}

function ProductForm({
  value,
  onChange,
  onClose,
  onSubmit,
  onUpload,
}: {
  value: Partial<AdminProduct>;
  onChange: (v: Partial<AdminProduct>) => void;
  onClose: () => void;
  onSubmit: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [promoMode, setPromoMode] = useState<"none" | "percent" | "price">(() => {
    if (
      value.compare_at_price_cents &&
      value.price_cents &&
      value.compare_at_price_cents > value.price_cents
    ) {
      return "price";
    }
    return "none";
  });
  const [percent, setPercent] = useState<number>(() => {
    const cp = value.compare_at_price_cents ?? 0;
    const p = value.price_cents ?? 0;
    if (cp > p && cp > 0) return Math.round(((cp - p) / cp) * 100);
    return 20;
  });

  const applyPercent = (pct: number, currentPrice: number) => {
    if (!currentPrice || pct <= 0 || pct >= 100) return;
    const compare = Math.round(currentPrice / (1 - pct / 100));
    onChange({ ...value, compare_at_price_cents: compare });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center md:p-6">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col rounded-t-3xl bg-background shadow-float md:max-h-[90vh] md:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-black md:text-xl">
              {value.id ? "Modifier le produit" : "Nouveau produit"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Remplissez les informations ci-dessous
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/70"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          <Section title="Informations">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Titre du produit *">
                <input
                  value={value.name ?? ""}
                  onChange={(e) => onChange({ ...value, name: e.target.value })}
                  className="input"
                  placeholder="Ex. Sneakers Cloud Runner"
                />
              </Field>
              <Field label="Catégorie">
                <input
                  value={value.category ?? ""}
                  onChange={(e) => onChange({ ...value, category: e.target.value })}
                  className="input"
                  placeholder="Mode, Tech, Audio..."
                  list="cat-list"
                />
                <datalist id="cat-list">
                  <option value="Mode" />
                  <option value="Tech" />
                  <option value="Audio" />
                  <option value="Maison" />
                  <option value="Beauté" />
                  <option value="Sport" />
                </datalist>
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={3}
                    value={value.description ?? ""}
                    onChange={(e) =>
                      onChange({ ...value, description: e.target.value })
                    }
                    className="input resize-none"
                    placeholder="Décrivez le produit, ses caractéristiques et avantages."
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Image du produit">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-gradient-soft">
                {value.image_url ? (
                  <img src={value.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Aperçu</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 sm:w-auto">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Envoi en cours..." : "Téléverser une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      try {
                        const url = await onUpload(f);
                        onChange({ ...value, image_url: url });
                        toast.success("Image téléversée");
                      } catch (err: any) {
                        toast.error(err?.message ?? "Échec de l'envoi");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                <input
                  placeholder="...ou collez une URL d'image"
                  value={value.image_url ?? ""}
                  onChange={(e) => onChange({ ...value, image_url: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </Section>

          <Section title="Prix & promotion">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Prix de vente (FC) *">
                <input
                  type="number"
                  min={0}
                  value={value.price_cents ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ ...value, price_cents: v });
                    if (promoMode === "percent") applyPercent(percent, v);
                  }}
                  className="input"
                />
              </Field>
              <Field label="Stock disponible">
                <input
                  type="number"
                  min={0}
                  value={value.stock ?? 0}
                  onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })}
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Type de promotion
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2 rounded-full bg-muted p-1">
                  {(["none", "percent", "price"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPromoMode(m);
                        if (m === "none")
                          onChange({ ...value, compare_at_price_cents: null });
                        if (m === "percent") applyPercent(percent, value.price_cents ?? 0);
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        promoMode === m
                          ? "bg-background text-foreground shadow-card"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "none" ? "Aucune" : m === "percent" ? "% réduction" : "Ancien prix"}
                    </button>
                  ))}
                </div>
              </div>

              {promoMode === "percent" && (
                <div className="md:col-span-2">
                  <Field label={`Réduction appliquée : ${percent}%`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={80}
                        step={1}
                        value={percent}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setPercent(p);
                          applyPercent(p, value.price_cents ?? 0);
                        }}
                        className="flex-1 accent-primary"
                      />
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={percent}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setPercent(p);
                          applyPercent(p, value.price_cents ?? 0);
                        }}
                        className="input h-10 w-20"
                      />
                    </div>
                    {value.compare_at_price_cents && value.price_cents ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ancien prix :{" "}
                        <span className="font-semibold text-foreground">
                          {formatPrice(value.compare_at_price_cents)}
                        </span>{" "}
                        · économie de{" "}
                        <span className="font-semibold text-primary">
                          {formatPrice(value.compare_at_price_cents - value.price_cents)}
                        </span>
                      </p>
                    ) : null}
                  </Field>
                </div>
              )}

              {promoMode === "price" && (
                <div className="md:col-span-2">
                  <Field label="Ancien prix barré (FC)">
                    <input
                      type="number"
                      min={0}
                      value={value.compare_at_price_cents ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          compare_at_price_cents: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="input"
                      placeholder="Ex. 199000"
                    />
                  </Field>
                </div>
              )}
            </div>
          </Section>

          <Section title="Étiquette & visibilité">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Badge affiché">
                <input
                  value={value.badge ?? ""}
                  onChange={(e) => onChange({ ...value, badge: e.target.value })}
                  className="input"
                  placeholder="Promo, Nouveau, Best Seller..."
                  list="badges-list"
                />
                <datalist id="badges-list">
                  <option value="Promo" />
                  <option value="Nouveau" />
                  <option value="Best Seller" />
                  <option value="Édition limitée" />
                  <option value="Soldes" />
                </datalist>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Promo", "Nouveau", "Best Seller"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => onChange({ ...value, badge: b })}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold hover:bg-muted/70"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex flex-col gap-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Visible en boutique</p>
                    <p className="text-xs text-muted-foreground">
                      Affiche ce produit dans le catalogue
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-primary"
                    checked={value.is_active ?? true}
                    onChange={(e) =>
                      onChange({ ...value, is_active: e.target.checked })
                    }
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Livraison offerte</p>
                    <p className="text-xs text-muted-foreground">
                      Affiche un badge livraison gratuite
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-primary"
                    checked={value.free_shipping ?? false}
                    onChange={(e) =>
                      onChange({ ...value, free_shipping: e.target.checked })
                    }
                  />
                </label>
              </div>
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-background px-5 py-4 md:px-6">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            className="rounded-full bg-gradient-hero px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-95"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
