import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price_cents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export const adminListAllProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProductSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: row, error } = await context.supabase
      .from("products")
      .insert({ ...data, is_active: true })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminToggleProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("products")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
