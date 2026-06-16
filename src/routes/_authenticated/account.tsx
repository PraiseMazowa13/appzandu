import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Mon compte — Lumen" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const checkFn = useServerFn(checkIsAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkFn(),
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-6">
      <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-soft">
        <p className="text-xs opacity-80">Connecté</p>
        <p className="mt-1 font-display text-xl font-bold">{user?.email}</p>
      </div>

      <ul className="mt-6 space-y-2">
        <li>
          <Link
            to="/orders"
            className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98]"
          >
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Mes commandes</span>
          </Link>
        </li>
        {adminData?.isAdmin && (
          <li>
            <Link
              to="/admin"
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98]"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Espace admin</span>
            </Link>
          </li>
        )}
      </ul>

      <Button
        variant="outline"
        size="lg"
        className="mt-6 w-full rounded-2xl"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
      </Button>
    </div>
  );
}
