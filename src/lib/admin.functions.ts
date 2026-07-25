import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = "0102";
const ADMIN_USERNAME = "Admin";

function checkAuth(input: { username: string; password: string }) {
  if (input.username !== ADMIN_USERNAME || input.password !== ADMIN_PASSWORD) {
    throw new Error("Identifiants invalides");
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const Auth = z.object({ username: z.string(), password: z.string() });

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

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    checkAuth(data);
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    checkAuth(data);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .inputValidator((i) => Auth.merge(z.object({ product: ProductSchema })).parse(i))
  .handler(async ({ data }) => {
    checkAuth(data);
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
  .inputValidator((i) =>
    Auth.merge(
      z.object({ id: z.string().uuid(), product: ProductSchema.partial() }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    checkAuth(data);
    const sb = await admin();
    const { error } = await sb.from("products").update(data.product).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((i) => Auth.merge(z.object({ id: z.string().uuid() })).parse(i))
  .handler(async ({ data }) => {
    checkAuth(data);
    const sb = await admin();
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
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
    checkAuth(data);
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
  .inputValidator((i) => Auth.parse(i))
  .handler(async ({ data }) => {
    checkAuth(data);
    const sb = await admin();
    const { data: rows, error } = await sb.from("settings").select("key,value");
    if (error) throw new Error(error.message);
    const map: Record<string, string> = {};
    (rows ?? []).forEach((r: any) => (map[r.key] = r.value));
    return map;
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    Auth.merge(
      z.object({
        settings: z.record(z.enum(SETTING_KEYS as unknown as [SettingKey]), z.string().trim().min(1).max(200)),
      }),
    ).parse(i),
  )
  .handler(async ({ data }) => {
    checkAuth(data);
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
