import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      const res = await checkIsAdmin();
      if (!res.isAdmin) throw redirect({ to: "/" });
    } catch (e) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
