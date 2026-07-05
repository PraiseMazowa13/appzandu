import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
  listMyFavoriteIds,
  toggleFavorite,
} from "@/lib/account.functions";

export function useFavoriteIds() {
  const { user } = useAuth();
  const fetchIds = useServerFn(listMyFavoriteIds);
  return useQuery({
    queryKey: ["my-favorite-ids", user?.id ?? "anon"],
    queryFn: () => fetchIds(),
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const toggle = useServerFn(toggleFavorite);
  return useMutation({
    mutationFn: async (product_id: string) => {
      if (!user) throw new Error("Connectez-vous pour ajouter aux favoris");
      return toggle({ data: { product_id } });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-favorite-ids"] });
      qc.invalidateQueries({ queryKey: ["my-favorites"] });
      toast.success(res.favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });
}
