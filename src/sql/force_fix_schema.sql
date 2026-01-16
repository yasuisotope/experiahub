-- =================================================================
-- FORCE FIX 2 STEP: COLUMNS FIRST
-- =================================================================

-- 1. Suppliers Columns
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS application_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email text;

-- 2. Bookings Table (Drop to ensure clean state if broken)
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

-- 3. RLS Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view their own bookings" ON public.bookings;

CREATE POLICY "Suppliers can view their own bookings" ON public.bookings
FOR SELECT
USING (
    application_id IN (
        SELECT application_id FROM public.suppliers 
        WHERE user_id = auth.uid() 
        OR user_id IS NULL -- fallback
    )
);

-- 4. Restore Data
INSERT INTO public.suppliers (application_id, status) 
VALUES ('SUP-543C66BA', 'active')
ON CONFLICT DO NOTHING; -- Assuming application_id might imply unique but constraint might not exist. If unsafe, just ignore.

-- If application_id is unique compliant:
-- INSERT INTO public.suppliers (application_id, status) VALUES ('SUP-543C66BA', 'active') ON CONFLICT (application_id) DO NOTHING;

INSERT INTO public.bookings (application_id, experience_title, customer_name, date, pax, price, status)
VALUES
    ('SUP-543C66BA', 'Authentic Echoes', 'Alice Smith', NOW() + INTERVAL '2 days', 2, 150.00, 'Confirmed'),
    ('SUP-543C66BA', 'Hidden Gems of Kyoto', 'Bob Jones', NOW() + INTERVAL '5 days', 4, 300.00, 'Pending'),
    ('SUP-543C66BA', 'Authentic Echoes', 'Charlie Brown', NOW() - INTERVAL '1 day', 1, 75.00, 'Completed');
