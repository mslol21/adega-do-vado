-- Adega do Vado: Neon Auth/RLS. Apply in a transaction after provisioning Neon Auth.
-- Requires an explicitly provisioned admin profile; never grant writes to anonymous.
BEGIN;
CREATE OR REPLACE FUNCTION public.neon_current_user_id() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT CASE WHEN coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), nullif((nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub'),'') ) ~* '^[0-9a-f-]{36}$' THEN coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid ELSE NULL::uuid END $$;

REVOKE ALL ON FUNCTION public.neon_current_user_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.neon_current_user_id() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY neon_profiles_self_read ON public.profiles FOR SELECT TO authenticated USING (user_id = (SELECT public.neon_current_user_id()));

CREATE OR REPLACE FUNCTION public.neon_is_store_admin(p_store text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=(SELECT public.neon_current_user_id()) AND p.store_id=p_store AND p.role='ADMIN') $$;

REVOKE ALL ON FUNCTION public.neon_is_store_admin(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.neon_is_store_admin(text) TO authenticated;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.global_options ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.profiles TO authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.products,public.categories,public.settings,public.global_options,public.orders,public.order_items,public.order_status_history,public.customers TO authenticated;

CREATE POLICY neon_authenticated_products_read ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY neon_authenticated_categories_read ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY neon_authenticated_settings_read ON public.settings FOR SELECT TO authenticated USING (true);

CREATE POLICY neon_authenticated_global_options_read ON public.global_options FOR SELECT TO authenticated USING (true);

CREATE POLICY neon_admin_products_insert ON public.products FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_products_update ON public.products FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_products_delete ON public.products FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_categories_insert ON public.categories FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_categories_update ON public.categories FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_categories_delete ON public.categories FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_settings_insert ON public.settings FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_settings_update ON public.settings FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_settings_delete ON public.settings FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_orders_insert ON public.orders FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_orders_update ON public.orders FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_orders_delete ON public.orders FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_orders_read ON public.orders FOR SELECT TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_order_status_history_insert ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_order_status_history_update ON public.order_status_history FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_order_status_history_delete ON public.order_status_history FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_order_status_history_read ON public.order_status_history FOR SELECT TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_customers_insert ON public.customers FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_customers_update ON public.customers FOR UPDATE TO authenticated USING (public.neon_is_store_admin(store_id)) WITH CHECK (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_customers_delete ON public.customers FOR DELETE TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_customers_read ON public.customers FOR SELECT TO authenticated USING (public.neon_is_store_admin(store_id));

CREATE POLICY neon_admin_global_options_insert ON public.global_options FOR INSERT TO authenticated WITH CHECK (public.neon_is_store_admin('adega') OR public.neon_is_store_admin('tabacaria'));

CREATE POLICY neon_admin_global_options_update ON public.global_options FOR UPDATE TO authenticated USING (public.neon_is_store_admin('adega') OR public.neon_is_store_admin('tabacaria')) WITH CHECK (public.neon_is_store_admin('adega') OR public.neon_is_store_admin('tabacaria'));

CREATE POLICY neon_admin_global_options_delete ON public.global_options FOR DELETE TO authenticated USING (public.neon_is_store_admin('adega') OR public.neon_is_store_admin('tabacaria'));

CREATE POLICY neon_admin_order_items_select ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.neon_is_store_admin(o.store_id)));

CREATE POLICY neon_admin_order_items_insert ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.neon_is_store_admin(o.store_id)));

CREATE POLICY neon_admin_order_items_update ON public.order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.neon_is_store_admin(o.store_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.neon_is_store_admin(o.store_id)));

CREATE POLICY neon_admin_order_items_delete ON public.order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id=order_id AND public.neon_is_store_admin(o.store_id)));

REVOKE EXECUTE ON FUNCTION public.save_order_atomic(text,uuid,text,jsonb,timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_order_atomic(text,uuid,text,jsonb,timestamptz) TO authenticated;
COMMIT;
