-- =================================================================
-- FIX FOR N8N SUPABASE ERROR: MISSING 'approved' COLUMN
-- =================================================================
-- The N8N workflow 'ExperiaHub Supplier Onboarding Supplier Media Upload' 
-- attempts to update the 'approved' column in the 'suppliers' table.
-- This column is missing from the current schema.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='approved') THEN
        ALTER TABLE public.suppliers ADD COLUMN approved boolean DEFAULT false;
    END IF;
    
    -- Also ensuring 'onboarded' exists as it's often used alongside approved
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='onboarded') THEN
        ALTER TABLE public.suppliers ADD COLUMN onboarded boolean DEFAULT false;
    END IF;
END $$;
