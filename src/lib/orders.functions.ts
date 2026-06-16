import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Re-fetch products from DB to ensure trustworthy pricing
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, price_cents, stock, is_active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);

    let total = 0;
    const rows: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price_cents: number;
    }[] = [];

    for (const item of data.items) {
      const p = products?.find((x) => x.id === item.product_id);
      if (!p || !p.is_active) throw new Error(`Produit indisponible: ${item.product_id}`);
      if (p.stock < item.quantity) throw new Error(`Stock insuffisant pour ${p.name}`);
      total += p.price_cents * item.quantity;
      rows.push({
        product_id: p.id,
        product_name: p.name,
        quantity: item.quantity,
        unit_price_cents: p.price_cents,
      });
    }

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({ user_id: userId, total_cents: total, status: "paid" })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(rows.map((r) => ({ ...r, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id, total };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, status, created_at, order_items(product_name, quantity, unit_price_cents)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
