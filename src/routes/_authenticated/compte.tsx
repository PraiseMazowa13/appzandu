import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  User,
  Package,
  Heart,
  LogOut,
  Download,
  ShoppingBag,
  Trash2,
  ChevronRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/layout/SiteShell";
import { formatPrice, useCart } from "@/stores/cart";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyOrders,
  listMyFavorites,
  toggleFavorite,
} from "@/lib/account.functions";
import { generateInvoicePDF } from "@/lib/invoice";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  normalizeStatus,
  statusIndex,
} from "@/lib/orderStatus";

function OrderTracker({ status }: { status: string | null }) {
  const current = statusIndex(status);
  return (
    <div className="border-b border-border bg-muted/30 px-5 py-4">
      <div className="flex items-center">
        {ORDER_STATUSES.map((s, i) => {
          const done = i <= current;
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground ring-1 ring-border"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[10px] font-bold ${done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
              {i < ORDER_STATUSES.length - 1 && (
                <span
                  className={`mx-1 -mt-4 h-0.5 flex-1 rounded-full ${
                    i < current ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — Zandu" },
      { name: "description", content: "Votre espace personnel : commandes, favoris et factures." },
      { property: "og:title", content: "Mon compte — Zandu" },
      { property: "og:description", content: "Votre espace personnel : commandes, favoris et factures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComptePage,
});

type Tab = "orders" | "favorites" | "profile";

function ComptePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");

  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      if (!user) return [] as { role: string }[];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data ?? []) as { role: string }[];
    },
    enabled: !!user,
  });
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    navigate({ to: "/" });
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Client";

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-float md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-background/20 font-display text-2xl font-black backdrop-blur">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Bonjour
              </p>
              <h1 className="font-display text-2xl font-black md:text-3xl">
                {displayName}
              </h1>
              <p className="text-sm opacity-90">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-background/30"
              >
                <Shield className="h-4 w-4" /> Espace admin
              </Link>
            )}
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-background/30"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto rounded-full border border-border bg-card p-1.5 shadow-card">
          {(
            [
              { k: "orders", label: "Mes commandes", icon: Package },
              { k: "favorites", label: "Favoris", icon: Heart },
              { k: "profile", label: "Profil", icon: User },
            ] as const
          ).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === k
                  ? "bg-gradient-hero text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "orders" && <OrdersPanel />}
          {tab === "favorites" && <FavoritesPanel />}
          {tab === "profile" && (
            <ProfilePanel
              email={user?.email ?? ""}
              displayName={displayName}
            />
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function OrdersPanel() {
  const fetchOrders = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
  });

  if (isLoading) {
    return <PanelSkeleton />;
  }
  const orders = data ?? [];
  if (!orders.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Aucune commande pour l'instant"
        text="Vos commandes s'afficheront ici avec la possibilité de télécharger vos factures."
        cta={{ to: "/catalogue", label: "Découvrir le catalogue" }}
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const st = normalizeStatus(o.status);
        const statusStyle = ORDER_STATUS_STYLES[st];
        return (
          <li
            key={o.id}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
          >
            <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Commande #{o.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-0.5 font-display text-sm font-bold">
                  {new Date(o.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyle}`}
                >
                  {ORDER_STATUS_LABELS[st]}
                </span>
                <span className="font-display text-lg font-black">
                  {formatPrice(o.total_cents)}
                </span>
                <button
                  onClick={() =>
                    generateInvoicePDF({
                      id: o.id,
                      created_at: o.created_at,
                      total_cents: o.total_cents,
                      status: o.status,
                      customer_name: o.customer_name,
                      customer_phone: o.customer_phone,
                      customer_address: o.customer_address,
                      customer_city: o.customer_city,
                      items: o.items,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-primary"
                >
                  <Download className="h-3.5 w-3.5" /> Facture PDF
                </button>
              </div>
            </div>
            <OrderTracker status={o.status} />
            <ul className="divide-y divide-border">
              {o.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <span className="truncate">
                    <span className="font-semibold">{it.quantity}×</span>{" "}
                    {it.product_name}
                  </span>
                  <span className="shrink-0 font-semibold text-muted-foreground">
                    {formatPrice(it.unit_price_cents * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function FavoritesPanel() {
  const qc = useQueryClient();
  const fetchFav = useServerFn(listMyFavorites);
  const toggle = useServerFn(toggleFavorite);
  const addToCart = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const { data, isLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => fetchFav(),
  });

  const removeMut = useMutation({
    mutationFn: (product_id: string) =>
      toggle({ data: { product_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-favorites"] });
      qc.invalidateQueries({ queryKey: ["my-favorite-ids"] });
      toast.success("Retiré des favoris");
    },
  });

  if (isLoading) return <PanelSkeleton />;
  const favs = (data ?? []).filter((f: any) => f.products);
  if (!favs.length) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="Aucun favori"
        text="Cliquez sur le cœur d'un produit pour l'ajouter à vos favoris."
        cta={{ to: "/catalogue", label: "Explorer les produits" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
      {favs.map((f: any) => {
        const p = f.products;
        return (
          <article
            key={f.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <Link
              to="/produit/$id"
              params={{ id: p.id }}
              className="relative block aspect-square overflow-hidden bg-gradient-soft"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-3xl font-black text-primary/30">
                  {p.name.charAt(0)}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeMut.mutate(p.id);
                }}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-destructive shadow-soft hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Retirer des favoris"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <h3 className="line-clamp-2 font-display text-[12px] font-black uppercase leading-tight">
                {p.name}
              </h3>
              <span className="font-display text-sm font-black">
                {formatPrice(p.price_cents)}
              </span>
              <button
                onClick={() => {
                  addToCart(
                    {
                      id: p.id,
                      name: p.name,
                      price_cents: p.price_cents,
                      image_url: p.image_url,
                    },
                    1,
                  );
                  toast.success("Ajouté au panier");
                  openCart();
                }}
                className="mt-auto inline-flex items-center justify-center gap-1 rounded-full bg-gradient-hero px-3 py-2 text-xs font-bold text-primary-foreground shadow-soft"
              >
                Ajouter
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProfilePanel({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Informations</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <dt className="text-muted-foreground">Nom</dt>
            <dd className="font-semibold">{displayName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-semibold">{email}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-3xl border border-border bg-gradient-soft p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Aide & support</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Une question sur une commande ? Notre équipe répond sur WhatsApp.
        </p>
        <a
          href="https://wa.me/243895975170"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-emerald-600"
        >
          Contacter le support <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-black">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <Link
        to={cta.to}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-hero px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-3xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}
