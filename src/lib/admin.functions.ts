import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verifie cote serveur que l'appelant est connecte ET possede le role admin. */
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Accès refusé : réservé aux administrateurs");
    return next();
  });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const Auth = z.object({ username: z.string().optional(), password: z.string().optional() });

const ProductSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  price_cents: z.number().int().nonnegative(),
  compare_at_price_cents: z.number().int().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  image_url: z.string().max(2000).optional().nullable(),
  badge: z.string().max(40).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.merge(z.object({ product: ProductSchema })).parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("products")
      .insert({ ...data.product, is_active: data.product.is_active ?? true })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) =>
    Auth.merge(
      z.object({ id: z.string().uuid(), product: ProductSchema.partial() }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("products").update(data.product).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.merge(z.object({ id: z.string().uuid() })).parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) =>
    Auth.merge(
      z.object({
        filename: z.string().min(1).max(200),
        contentType: z.string().min(1).max(100),
        // base64 encoded
        base64: z.string().min(1),
      }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const path = `${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await sb.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed, error: signErr } = await sb.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
    if (signErr) throw new Error(signErr.message);
    return { url: signed.signedUrl };
  });

const SETTING_KEYS = ["whatsapp_number", "mobile_money"] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

export const adminGetSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb.from("settings").select("key,value");
    if (error) throw new Error(error.message);
    const map: Record<string, string> = {};
    (rows ?? []).forEach((r: any) => (map[r.key] = r.value));
    return map;
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) =>
    Auth.merge(
      z.object({
        settings: z.record(z.enum(SETTING_KEYS as unknown as [SettingKey]), z.string().trim().min(1).max(200)),
      }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const rows = Object.entries(data.settings).map(([key, value]) => ({
      key,
      value: value as string,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return { ok: true };
    const { error } = await sb.from("settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data: rows, error } = await sb.from("settings").select("key,value");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  (rows ?? []).forEach((r: any) => (map[r.key] = r.value));
  return map;
});

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: orders, error } = await sb
      .from("orders")
      .select(
        "id, total_cents, status, created_at, customer_name, customer_phone, customer_address, customer_city",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const ids = (orders ?? []).map((o: any) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: it, error: e2 } = await sb
        .from("order_items")
        .select("id, order_id, product_name, unit_price_cents, quantity")
        .in("order_id", ids);
      if (e2) throw new Error(e2.message);
      items = it ?? [];
    }
    return (orders ?? []).map((o: any) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.id),
    }));
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) =>
    Auth.merge(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["received", "preparing", "shipped", "delivered"]),
      }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== CODES PROMO ==================

const PromoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9-]+$/, "Lettres majuscules, chiffres et tirets uniquement"),
  percent: z.number().int().min(1).max(100),
  min_order_cents: z.number().int().nonnegative().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export const adminListPromoCodes = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("promo_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminCreatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.merge(z.object({ promo: PromoSchema })).parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("promo_codes" as any)
      .insert({
        code: data.promo.code,
        percent: data.promo.percent,
        min_order_cents: data.promo.min_order_cents ?? null,
        expires_at: data.promo.expires_at || null,
        is_active: data.promo.is_active ?? true,
      } as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message.includes("duplicate") ? "Ce code existe déjà" : error.message);
    return row;
  });

export const adminUpdatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) =>
    Auth.merge(z.object({ id: z.string().uuid(), promo: PromoSchema.partial() })).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb
      .from("promo_codes" as any)
      .update({ ...data.promo, expires_at: data.promo.expires_at || null } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i) => Auth.merge(z.object({ id: z.string().uuid() })).parse(i))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("promo_codes" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Validation publique d'un code promo (appelée depuis la page commande). */
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z.object({ code: z.string().trim().min(1).max(30), total_cents: z.number().int().nonnegative() }).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const code = data.code.toUpperCase().trim();
    const { data: row, error } = await sb
      .from("promo_codes" as any)
      .select("code, percent, is_active, expires_at, min_order_cents")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { valid: false as const, reason: "Code inconnu" };
    const r = row as any;
    if (!r.is_active) return { valid: false as const, reason: "Ce code n'est plus actif" };
    if (r.expires_at && new Date(r.expires_at).getTime() < Date.now())
      return { valid: false as const, reason: "Ce code a expiré" };
    if (r.min_order_cents && data.total_cents < r.min_order_cents)
      return {
        valid: false as const,
        reason: `Commande minimum de ${Math.round(r.min_order_cents / 100)} FC requise`,
      };
    return { valid: true as const, code: r.code, percent: r.percent };
  });
