-- =================================================================
-- RESTORE MISSING SUPPLIER (Fixes Schema Issues)
-- =================================================================
-- Fixes: ERROR: 42703 (missing columns like updated_at)
-- This script ensures the table schema is correct before attempting to restore data.

DO $$
BEGIN
    -- 1. Ensure Table Exists
    CREATE TABLE IF NOT EXISTS public.suppliers (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        application_id text
    );

    -- 2. Add Missing Columns Safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='updated_at') THEN
        ALTER TABLE public.suppliers ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='business_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN business_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='email') THEN
        ALTER TABLE public.suppliers ADD COLUMN email text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='status') THEN
        ALTER TABLE public.suppliers ADD COLUMN status text DEFAULT 'onboarding';
    END IF;

    -- 3. Safe Restore of Supplier Record
    IF EXISTS (SELECT 1 FROM public.suppliers WHERE application_id = 'SUP-543C66BA') THEN
        UPDATE public.suppliers
        SET status = 'active', 
            updated_at = now()
        WHERE application_id = 'SUP-543C66BA';
    ELSE
        INSERT INTO public.suppliers (application_id, business_name, email, status)
        VALUES (
            'SUP-543C66BA', 
            'Restored Supplier', 
            'supplier@experiahub.com', 
            'active'
        );
    END IF;

END $$;
