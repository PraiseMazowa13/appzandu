GRANT UPDATE, DELETE ON public.orders TO authenticated;
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
CREATE POLICY settings_admin_write ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY roles_admin_select ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;