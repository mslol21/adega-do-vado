-- Create ENUMs for orders
CREATE TYPE public.order_status AS ENUM (
    'NOVO',
    'RECEBIDO',
    'EM_PREPARACAO',
    'EM_SEPARACAO',
    'SEPARADO',
    'PRONTO',
    'AGUARDANDO_RETIRADA',
    'EM_ENTREGA',
    'CONCLUIDO',
    'CANCELADO',
    'AGUARDANDO_PAGAMENTO'
);

CREATE TYPE public.order_source AS ENUM (
    'ONLINE',
    'INTERNO',
    'WHATSAPP'
);

CREATE TYPE public.order_type AS ENUM (
    'DELIVERY',
    'RETIRADA',
    'BALCAO'
);

-- Create Customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view customers of their store" ON public.customers FOR SELECT
    USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update customers of their store" ON public.customers FOR UPDATE
    USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL,
    order_number SERIAL,
    source public.order_source NOT NULL,
    order_type public.order_type NOT NULL,
    status public.order_status NOT NULL DEFAULT 'NOVO',
    
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    
    delivery_cep TEXT,
    delivery_street TEXT,
    delivery_number TEXT,
    delivery_complement TEXT,
    delivery_neighborhood TEXT,
    delivery_city TEXT,
    delivery_state TEXT,
    
    payment_method TEXT,
    payment_status TEXT DEFAULT 'PENDENTE',
    amount_received NUMERIC(10,2),
    change_for NUMERIC(10,2),
    
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    notes TEXT,
    
    created_by UUID REFERENCES public.profiles(id),
    received_by UUID REFERENCES public.profiles(id),
    preparing_by UUID REFERENCES public.profiles(id),
    separating_by UUID REFERENCES public.profiles(id),
    delivery_by UUID REFERENCES public.profiles(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE,
    preparing_at TIMESTAMP WITH TIME ZONE,
    separating_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    delivery_started_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES public.profiles(id),
    cancel_reason TEXT
);

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert orders (for online cart)" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read orders of their store" ON public.orders FOR SELECT
    USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update orders of their store" ON public.orders FOR UPDATE
    USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));


-- Create Order Items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT, -- Keep as TEXT/String to not strict enforce FK, as requested in prompt "não deletar dados em massa se apagar produto"
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    options JSONB,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read order items of their store" ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid())));
CREATE POLICY "Users can update order items of their store" ON public.order_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid())));


-- Create Order Status History table
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Order Status History RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert status history" ON public.order_status_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read history of their store" ON public.order_status_history FOR SELECT
    USING (store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()));
