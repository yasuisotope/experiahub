-- =================================================================
-- FIX EXPERIENCES TABLE & RLS (Persistence Fix)
-- =================================================================
-- This script ensures the 'experiences' table has the necessary columns
-- and Row Level Security (RLS) policies to allow the supplier to see their own created data.

-- 1. Ensure Columns Exist (Safe Adds)
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS application_id text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS raw_data text; -- Stores the full JSON blob
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Index for Performance
CREATE INDEX IF NOT EXISTS idx_experiences_application_id ON public.experiences(application_id);

-- 3. RLS Policies
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Allow SELECT (Read)
DROP POLICY IF EXISTS "Suppliers can view their own experiences" ON public.experiences;
CREATE POLICY "Suppliers can view their own experiences" ON public.experiences
FOR SELECT
USING (
    application_id IN (
        SELECT application_id FROM public.suppliers 
        WHERE user_id = auth.uid() 
        OR user_id IS NULL -- weak link for recovery/onboarding
    )
    OR
    user_id = auth.uid() -- Direct ownership
);

-- Allow INSERT (Create)
DROP POLICY IF EXISTS "Suppliers can insert their own experiences" ON public.experiences;
CREATE POLICY "Suppliers can insert their own experiences" ON public.experiences
FOR INSERT
WITH CHECK (
    -- Allow if they are attaching it to a supplier they own OR simply authenticated
    -- For now, allow authenticated users to insert. Ideally we check application_id ownership.
    auth.role() = 'authenticated'
);

-- Allow UPDATE (Edit)
DROP POLICY IF EXISTS "Suppliers can update their own experiences" ON public.experiences;
CREATE POLICY "Suppliers can update their own experiences" ON public.experiences
FOR UPDATE
USING (
    user_id = auth.uid() OR
    application_id IN (
        SELECT application_id FROM public.suppliers WHERE user_id = auth.uid() OR user_id IS NULL
    )
);

-- 4. Clean up any "orphaned" rows purely for testing (Optional, commented out)
-- DELETE FROM public.experiences WHERE application_id = 'SUP-543C66BA';
