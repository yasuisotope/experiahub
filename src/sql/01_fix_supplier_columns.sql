-- =================================================================
-- STEP 1: FIX SUPPLIER COLUMNS ONLY
-- =================================================================
-- Run this script FIRST.
-- It ensures the 'suppliers' table has all necessary columns.

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS application_id text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email text;

-- Ensure an index exists on application_id for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_application_id ON public.suppliers(application_id);
