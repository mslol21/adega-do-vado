-- Create custom type for profile roles
CREATE TYPE public.profile_role AS ENUM (
    'ADMIN',
    'GERENTE',
    'ATENDENTE',
    'RECEBIMENTO',
    'PREPARACAO',
    'SEPARACAO',
    'ENTREGA'
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL,
    role public.profile_role NOT NULL DEFAULT 'ATENDENTE',
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read profiles from their store" ON public.profiles
    FOR SELECT USING (
        store_id = (SELECT store_id FROM public.profiles WHERE user_id = auth.uid()) OR
        auth.uid() = user_id
    );

CREATE POLICY "Admin can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

CREATE POLICY "Admin can update profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );

CREATE POLICY "Users can update their own name" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'ADMIN')
    );
