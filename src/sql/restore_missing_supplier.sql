-- =================================================================
-- RESTORE MISSING SUPPLIER (Robust Version)
-- =================================================================
-- Fixes: ERROR: 42P10 (missing unique constraint)
-- Use this script to restore the 'SUP-543C66BA' supplier safely.

DO $$
BEGIN
    -- 1. Ensure Table Exists
    CREATE TABLE IF NOT EXISTS public.suppliers (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        application_id text,
        business_name text,
        email text,
        status text DEFAULT 'onboarding',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
    );

    -- 2. Safe Insert/Update (Avoiding ON CONFLICT to prevent constraint errors)
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

    -- 3. Optional: Try to add Unique Constraint for future safety
    -- (This block is wrapped to not fail the script if duplicates exist)
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_application_id_key'
        ) THEN
            ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_application_id_key UNIQUE (application_id);
        END IF;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint (likely duplicates exist): %', SQLERRM;
    END;

END $$;
