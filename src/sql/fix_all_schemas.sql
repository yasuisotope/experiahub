-- =================================================================
-- FIX ALL SCHEMAS (Suppliers, Bookings, RLS)
-- =================================================================
-- Safe script to ensure all tables and columns exist before applied policies.

DO $$
BEGIN
    -- 1. Ensure Suppliers Table and Columns
    CREATE TABLE IF NOT EXISTS public.suppliers (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY
    );
    
    -- Ensure 'application_id' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='application_id') THEN
        ALTER TABLE public.suppliers ADD COLUMN application_id text;
    END IF;

    -- Ensure 'user_id' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='user_id') THEN
        ALTER TABLE public.suppliers ADD COLUMN user_id uuid;
    END IF;

    -- Ensure 'updated_at' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='updated_at') THEN
        ALTER TABLE public.suppliers ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
    
    -- Ensure 'status' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='status') THEN
        ALTER TABLE public.suppliers ADD COLUMN status text DEFAULT 'active';
    END IF;

    -- 2. Ensure Bookings Table
    CREATE TABLE IF NOT EXISTS public.bookings (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        application_id text NOT NULL,
        experience_title text,
        customer_name text,
        customer_email text,
        date timestamp with time zone,
        pax integer,
        price numeric,
        currency text DEFAULT 'USD',
        status text DEFAULT 'Confirmed',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
    );

    -- 3. Update Policy (Now safe because columns exist)
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Suppliers can view their own bookings" ON public.bookings;
    
    CREATE POLICY "Suppliers can view their own bookings" ON public.bookings
    FOR SELECT
    USING (application_id IN (
        SELECT application_id FROM public.suppliers WHERE user_id = auth.uid() OR user_id IS NULL
    ));

    -- 4. Insert Mock Data for SUP-543C66BA
    -- Ensure the supplier record itself exists first
    IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE application_id = 'SUP-543C66BA') THEN
        INSERT INTO public.suppliers (application_id, status) VALUES ('SUP-543C66BA', 'active');
    END IF;

    INSERT INTO public.bookings (application_id, experience_title, customer_name, date, pax, price, status)
    VALUES
        ('SUP-543C66BA', 'Authentic Echoes', 'Alice Smith', NOW() + INTERVAL '2 days', 2, 150.00, 'Confirmed'),
        ('SUP-543C66BA', 'Hidden Gems of Kyoto', 'Bob Jones', NOW() + INTERVAL '5 days', 4, 300.00, 'Pending'),
        ('SUP-543C66BA', 'Authentic Echoes', 'Charlie Brown', NOW() - INTERVAL '1 day', 1, 75.00, 'Completed');
        -- No ON CONFLICT check needed for UUID PKs usually, but just inserting new rows is fine for mock

END $$;
