import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, total_cents, status, created_at, customer_name, customer_phone, customer_address, customer_city",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (orders ?? []).map((o) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: it, error: e2 } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, unit_price_cents, quantity")
        .in("order_id", ids);
      if (e2) throw new Error(e2.message);
      items = it ?? [];
    }
    return (orders ?? []).map((o) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.id),
    }));
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, total_cents, status, created_at, customer_name, customer_phone, customer_address, customer_city",
      )
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items, error: e2 } = await supabase
      .from("order_items")
      .select("id, product_id, product_name, unit_price_cents, quantity")
      .eq("order_id", order.id);
    if (e2) throw new Error(e2.message);
    return { ...order, items: items ?? [] };
  });

const OrderInput = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(8).max(20),
    address: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(80),
  }),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        product_name: z.string().min(1),
        unit_price_cents: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const createMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => OrderInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const total = data.items.reduce(
      (s, i) => s + i.unit_price_cents * i.quantity,
      0,
    );
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: total,
        status: "pending",
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        customer_address: data.customer.address,
        customer_city: data.customer.city,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: e2 } = await supabase.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        unit_price_cents: i.unit_price_cents,
        quantity: i.quantity,
      })),
    );
    if (e2) throw new Error(e2.message);
    return { id: order.id, total_cents: total };
  });

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("favorites")
      .select(
        "id, product_id, created_at, products:product_id (id, name, description, price_cents, compare_at_price_cents, stock, image_url, category, badge, free_shipping)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyFavoriteIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.product_id);
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ product_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", data.product_id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, product_id: data.product_id });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });
