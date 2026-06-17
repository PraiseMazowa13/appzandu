
-- 1) Add marketing columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;

-- 2) Update handle_new_user to auto-grant admin to pmazowa@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  is_admin_email boolean := lower(coalesce(new.email, '')) = 'pmazowa@gmail.com';
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_admin_email then 'admin'::app_role else 'customer'::app_role end)
  on conflict (user_id, role) do nothing;

  if is_admin_email then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end $function$;

-- 3) Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Promote pmazowa@gmail.com to admin if already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'pmazowa@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
