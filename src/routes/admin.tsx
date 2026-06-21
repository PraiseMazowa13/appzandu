import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LogOut, Plus, Pencil, Trash2, Package, Tag, AlertCircle, Upload, ShoppingCart, TrendingUp, Clock, Check, Trash, Search, SlidersHorizontal, FolderTree, X } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const n = search.trim().toLowerCase();
    if (!n) return items;
    return items.filter((p) =>
      `${p.name} ${p.category ?? ""} ${p.badge ?? ""}`.toLowerCase().includes(n),
    );
  }, [items, search]);

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
              <h2 className="min-w-0 truncate font-display text-xl font-black">Produits ({filteredItems.length}{search ? `/${items.length}` : ""})</h2>
              <button
                onClick={startCreate}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-hero px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft"
              >
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ajouter un produit</span><span className="sm:hidden">Ajouter</span>
              </button>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, catégorie, badge..."
                className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm outline-none focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-xs hover:bg-muted/70"
                  aria-label="Effacer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              {filteredItems.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  {search ? "Aucun produit ne correspond à votre recherche." : "Aucun produit."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredItems.map((p) => (
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

type StoredOrder = {
  id: string;
  createdAt: number;
  customer: { name: string; phone: string; address: string; city: string };
  items: { id: string; name: string; price_cents: number; quantity: number }[];
  total_cents: number;
  status: "pending" | "confirmed";
};

const ORDERS_KEY = "zandu-orders";

function SalesPanel({
  productCount,
  promoCount,
  outCount,
}: {
  productCount: number;
  promoCount: number;
  outCount: number;
}) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");

  const load = () => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      setOrders(raw ? (JSON.parse(raw) as StoredOrder[]) : []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persist = (next: StoredOrder[]) => {
    setOrders(next);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {}
  };

  const now = Date.now();
  const cutoff =
    range === "today"
      ? now - 24 * 3600 * 1000
      : range === "7d"
        ? now - 7 * 24 * 3600 * 1000
        : range === "30d"
          ? now - 30 * 24 * 3600 * 1000
          : 0;
  const visible = orders.filter((o) => o.createdAt >= cutoff);

  const totalRevenue = visible.reduce((s, o) => s + o.total_cents, 0);
  const totalItems = visible.reduce(
    (s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  const avgBasket = visible.length ? Math.round(totalRevenue / visible.length) : 0;

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of visible) {
      for (const it of o.items) {
        const cur = map.get(it.id) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.quantity * it.price_cents;
        map.set(it.id, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [visible]);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        <StatCard icon={TrendingUp} label="Chiffre d'affaires" value={Math.round(totalRevenue / 100)} tint="emerald" />
        <StatCard icon={ShoppingCart} label="Commandes" value={visible.length} tint="primary" />
        <StatCard icon={Package} label="Articles vendus" value={totalItems} tint="primary" />
        <StatCard icon={Tag} label="Panier moyen" value={Math.round(avgBasket / 100)} tint="emerald" />
      </div>

      <div className="grid grid-cols-3 gap-3 md:hidden">
        <StatCard icon={Package} label="Produits" value={productCount} tint="primary" />
        <StatCard icon={Tag} label="Promos" value={promoCount} tint="emerald" />
        <StatCard icon={AlertCircle} label="Rupture" value={outCount} tint="destructive" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-muted p-1">
          {(
            [
              ["today", "Aujourd'hui"],
              ["7d", "7 jours"],
              ["30d", "30 jours"],
              ["all", "Tout"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                range === v
                  ? "bg-background text-foreground shadow-card"
                  : "text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        {orders.length > 0 && (
          <button
            onClick={() => {
              if (!confirm("Effacer l'historique local des ventes ?")) return;
              persist([]);
              toast.success("Historique effacé");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <Trash className="h-3 w-3" /> Vider l'historique
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-base font-black">Commandes récentes</h3>
            <p className="text-xs text-muted-foreground">
              {visible.length} commande{visible.length > 1 ? "s" : ""} sur la période
            </p>
          </div>
          {visible.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucune commande enregistrée sur cette période.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((o) => (
                <li key={o.id} className="p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold truncate">{o.customer.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            o.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.status === "confirmed" ? (
                            <><Check className="h-3 w-3" /> Confirmé</>
                          ) : (
                            <><Clock className="h-3 w-3" /> En attente</>
                          )}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        📞 {o.customer.phone} · 📍 {o.customer.city}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString("fr-FR")}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-xs">
                        {o.items.map((it) => (
                          <li key={it.id} className="text-muted-foreground">
                            • {it.name} × {it.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-display text-base font-black">
                        {formatPrice(o.total_cents)}
                      </span>
                      <div className="flex gap-1">
                        {o.status === "pending" && (
                          <button
                            onClick={() => {
                              persist(
                                orders.map((x) =>
                                  x.id === o.id ? { ...x, status: "confirmed" } : x,
                                ),
                              );
                              toast.success("Commande confirmée");
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            aria-label="Confirmer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${o.customer.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
                          aria-label="WhatsApp"
                        >
                          💬
                        </a>
                        <button
                          onClick={() => {
                            if (!confirm("Supprimer cette commande ?")) return;
                            persist(orders.filter((x) => x.id !== o.id));
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-base font-black">Top produits</h3>
          <p className="text-xs text-muted-foreground">Les plus vendus sur la période</p>
          {topProducts.length === 0 ? (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Pas encore de ventes
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.qty} vendus · {formatPrice(p.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
            💡 Les ventes sont enregistrées localement sur cet appareil lorsque les
            clients valident leur commande via WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
