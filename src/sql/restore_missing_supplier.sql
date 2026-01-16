-- =================================================================
-- RESTORE MISSING SUPPLIER (Fixes Persistence)
-- =================================================================
-- The user reported that 'SUP-543C66BA' is missing from the 'suppliers' table.
-- This prevents experiences from being legally linked to a supplier, likely causing silent failures or RLS blocks.

-- 1. Ensure the suppliers table exists (Basic check)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id text UNIQUE NOT NULL,
    business_name text,
    email text,
    status text DEFAULT 'onboarding',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Insert the missing supplier if not present
INSERT INTO public.suppliers (application_id, business_name, email, status)
VALUES (
    'SUP-543C66BA', 
    'Restored Supplier (Manual)', 
    'supplier@experiahub.com', 
    'active'
)
ON CONFLICT (application_id) 
DO UPDATE SET 
    updated_at = now(),
    status = 'active'; -- Ensure it's active

-- 3. Verify Experiences Linkage
-- Update any orphaned experiences with this application_id to point to the correct internal ID if such a column exists (e.g. supplier_id)
-- (Assuming 'experiences' might have a 'supplier_id' UUID column, we link it here just in case)
DO $$
DECLARE
    supp_uuid uuid;
BEGIN
    SELECT id INTO supp_uuid FROM public.suppliers WHERE application_id = 'SUP-543C66BA';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='supplier_id') THEN
        UPDATE public.experiences 
        SET supplier_id = supp_uuid 
        WHERE application_id = 'SUP-543C66BA' AND supplier_id IS NULL;
    END IF;
END $$;
