import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Minus, Plus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart, formatPrice } from "@/stores/cart";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { createMyOrder } from "@/lib/account.functions";

export const Route = createFileRoute("/commande")({
  head: () => ({
    meta: [
      { title: "Commande — Zandu" },
      { name: "description", content: "Validez votre commande via WhatsApp ou Mobile Money." },
    ],
  }),
  component: CommandePage,
});

const WHATSAPP_NUMBER = "243895975170";
const MOBILE_MONEY = "0895 975 170";

const CustomerSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(80),
  phone: z.string().trim().min(8, "Téléphone requis").max(20),
  address: z.string().trim().max(200).optional(),
});

function CommandePage() {
  const { items, setQty, remove, totalCents, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveOrder = useServerFn(createMyOrder);

  const handleOrder = async () => {
    if (items.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    const parsed = CustomerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const lines = items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.name} × ${i.quantity} — ${formatPrice(i.price_cents * i.quantity)}`,
      )
      .join("\n");
    const message =
      `🛒 *Nouvelle commande Zandu*\n\n` +
      `👤 *Client*\n` +
      `Nom : ${parsed.data.name}\n` +
      `Tél : ${parsed.data.phone}\n` +
      (parsed.data.address ? `Lieu : ${parsed.data.address}\n` : "") +
      `\n📦 *Articles*\n${lines}\n\n` +
      `💰 *Total : ${formatPrice(totalCents())}*\n\n` +
      `💳 Paiement Mobile Money : ${MOBILE_MONEY}`;

    // Sauvegarde en base si connecté (permet l'historique + facture PDF)
    if (user) {
      try {
        await saveOrder({
          data: {
            customer: parsed.data,
            items: items.map((i) => ({
              product_id: i.id,
              product_name: i.name,
              unit_price_cents: i.price_cents,
              quantity: i.quantity,
            })),
          },
        });
      } catch (e: any) {
        console.error(e);
        toast.error("Impossible d'enregistrer la commande");
      }
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Commande envoyée via WhatsApp");
    if (user) {
      clear();
      navigate({ to: "/compte" });
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        <h1 className="font-display text-3xl font-black md:text-4xl">Ma commande</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérifiez votre panier, renseignez vos coordonnées et finalisez via WhatsApp.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold">Articles ({items.length})</h2>

            {items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Votre panier est vide</p>
                <Link
                  to="/catalogue"
                  className="mt-4 inline-flex rounded-full bg-gradient-hero px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
                >
                  Voir le catalogue
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-3xl border border-border bg-card p-3 shadow-card"
                  >
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-soft">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary/40">
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                          <button
                            onClick={() => setQty(item.id, item.quantity - 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-background"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => setQty(item.id, item.quantity + 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-background"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-display font-bold">
                          {formatPrice(item.price_cents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">Vos coordonnées</h2>
              <div className="mt-4 space-y-3">
                {(
                  [
                    { k: "name", label: "Nom complet", type: "text", placeholder: "Ex. Jean Kabila" },
                    { k: "phone", label: "Téléphone (WhatsApp)", type: "tel", placeholder: "+243 …" },
                    { k: "address", label: "Lieu de livraison (optionnel)", type: "text", placeholder: "Quartier / ville" },
                  ] as const
                ).map((f) => (
                  <div key={f.k}>
                    <label className="text-xs font-semibold text-muted-foreground">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.k]}
                      onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                      className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-black">
                  {formatPrice(totalCents())}
                </span>
              </div>
              <div className="mt-3 rounded-2xl bg-muted/60 p-3 text-xs">
                <p className="font-semibold">💳 Paiement Mobile Money</p>
                <p className="mt-1 text-muted-foreground">
                  Envoyez le montant au <strong className="text-foreground">{MOBILE_MONEY}</strong>
                </p>
              </div>
              <button
                onClick={handleOrder}
                disabled={items.length === 0}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" /> Commander via WhatsApp
              </button>
              {items.length > 0 && (
                <button
                  onClick={() => {
                    clear();
                    toast.message("Panier vidé");
                  }}
                  className="mt-2 w-full rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  Vider le panier
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
