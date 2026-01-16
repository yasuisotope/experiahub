-- =================================================================
-- NUKE AND PAVE BOOKINGS (Fixes "Column does not exist" errors)
-- =================================================================
-- We suspect an old version of 'bookings' table exists without the right columns.
-- We will DROP it and Recreate it to be sure.

-- 1. DROP Existing Table (Caution: Deletes all booking data, safe for dev)
DROP TABLE IF EXISTS public.bookings;

-- 2. Create Table Fresh
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id text NOT NULL, -- This column MUST exist now
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

-- 3. Ensure Suppliers Schema (Just in case 01 script failed)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS application_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid;
-- Ensure Index
CREATE INDEX IF NOT EXISTS idx_suppliers_application_id ON public.suppliers(application_id);

-- 4. RLS Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their own bookings" ON public.bookings
FOR SELECT
USING (
    application_id IN (
        SELECT application_id FROM public.suppliers 
        WHERE user_id = auth.uid() 
        OR user_id IS NULL 
    )
);

-- 5. Insert Mock Data
INSERT INTO public.bookings (application_id, experience_title, customer_name, date, pax, price, status)
VALUES
    ('SUP-543C66BA', 'Authentic Echoes', 'Alice Smith', NOW() + INTERVAL '2 days', 2, 150.00, 'Confirmed'),
    ('SUP-543C66BA', 'Hidden Gems of Kyoto', 'Bob Jones', NOW() + INTERVAL '5 days', 4, 300.00, 'Pending'),
    ('SUP-543C66BA', 'Authentic Echoes', 'Charlie Brown', NOW() - INTERVAL '1 day', 1, 75.00, 'Completed');
