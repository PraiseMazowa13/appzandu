import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LogOut, Plus, Pencil, Trash2, Package, Tag, AlertCircle, Upload } from "lucide-react";
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

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black md:text-4xl">Tableau de bord</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gérez votre boutique Zandu</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 md:gap-5">
          <StatCard icon={Package} label="Produits" value={stats.total} tint="primary" />
          <StatCard icon={Tag} label="En promo" value={stats.promo} tint="emerald" />
          <StatCard icon={AlertCircle} label="Rupture" value={stats.out} tint="destructive" />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-black">Produits ({items.length})</h2>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-hero px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un produit
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm md:place-items-center">
      <div className="w-full max-w-2xl rounded-t-3xl bg-background p-6 shadow-float md:max-h-[90vh] md:overflow-y-auto md:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-black">
            {value.id ? "Modifier le produit" : "Nouveau produit"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-muted px-3 py-1 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label="Titre">
            <input
              value={value.name ?? ""}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Catégorie">
            <input
              value={value.category ?? ""}
              onChange={(e) => onChange({ ...value, category: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Prix actuel (FC)">
            <input
              type="number"
              min={0}
              value={value.price_cents ?? 0}
              onChange={(e) => onChange({ ...value, price_cents: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Ancien prix barré (FC, optionnel)">
            <input
              type="number"
              min={0}
              value={value.compare_at_price_cents ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  compare_at_price_cents: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="input"
            />
          </Field>
          <Field label="Stock">
            <input
              type="number"
              min={0}
              value={value.stock ?? 0}
              onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Badge (Promo, Nouveau, Best Seller...)">
            <input
              value={value.badge ?? ""}
              onChange={(e) => onChange({ ...value, badge: e.target.value })}
              className="input"
              list="badges-list"
            />
            <datalist id="badges-list">
              <option value="Promo" />
              <option value="Nouveau" />
              <option value="Best Seller" />
            </datalist>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                rows={3}
                value={value.description ?? ""}
                onChange={(e) => onChange({ ...value, description: e.target.value })}
                className="input resize-none"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Image du produit">
              <div className="flex flex-wrap items-center gap-3">
                {value.image_url && (
                  <img
                    src={value.image_url}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-semibold hover:bg-muted/70">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Envoi..." : "Téléverser une image"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
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
                  placeholder="...ou collez une URL"
                  value={value.image_url ?? ""}
                  onChange={(e) => onChange({ ...value, image_url: e.target.value })}
                  className="input flex-1 min-w-[200px]"
                />
              </div>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.is_active ?? true}
              onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
            />
            Produit actif (visible en boutique)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.free_shipping ?? false}
              onChange={(e) => onChange({ ...value, free_shipping: e.target.checked })}
            />
            Livraison offerte
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            className="rounded-full bg-gradient-hero px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
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
