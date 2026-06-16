import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminCreateProduct, adminListAllProducts, adminToggleProduct } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/stores/cart";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Lumen" }] }),
  component: AdminPage,
});

function AdminPage() {
  const listFn = useServerFn(adminListAllProducts);
  const createFn = useServerFn(adminCreateProduct);
  const toggleFn = useServerFn(adminToggleProduct);
  const qc = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      let image_url: string | null = null;
      if (file) {
        setUploading(true);
        const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        setUploading(false);
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      return createFn({
        data: {
          name: form.name,
          description: form.description || null,
          price_cents: Math.round(parseFloat(form.price) * 100),
          stock: parseInt(form.stock, 10),
          category: form.category || null,
          image_url,
        },
      });
    },
    onSuccess: () => {
      toast.success("Produit ajouté");
      setForm({ name: "", description: "", price: "", stock: "", category: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-5 pb-12 pt-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Espace admin</h1>
      <p className="text-sm text-muted-foreground">Gérer le catalogue</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="mt-6 space-y-4 rounded-3xl bg-card p-5 shadow-card"
      >
        <h2 className="font-display text-lg font-bold">Ajouter un produit</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Prix (€)</Label>
            <Input
              id="price"
              required
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Catégorie</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="image">Image</Label>
          <label
            htmlFor="image"
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 p-3 text-sm text-muted-foreground"
          >
            <Upload className="h-4 w-4" />
            {file ? file.name : "Choisir une image"}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={create.isPending || uploading}
          className="w-full rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft"
        >
          <Plus className="mr-2 h-4 w-4" />
          {uploading ? "Upload…" : create.isPending ? "Création…" : "Ajouter le produit"}
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold">Catalogue ({products?.length ?? 0})</h2>
        <ul className="space-y-2">
          {products?.map((p: any) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-soft">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary/40">{p.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(p.price_cents)} · Stock {p.stock}
                </p>
              </div>
              <Button
                variant={p.is_active ? "outline" : "default"}
                size="sm"
                onClick={() => toggle.mutate({ id: p.id, is_active: !p.is_active })}
                className="rounded-xl"
              >
                {p.is_active ? "Désactiver" : "Activer"}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
