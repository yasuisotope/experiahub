-- =================================================================
-- NUKE AND PAVE EXPERIENCES (Persistence Final Fix - CASCADE VERSION)
-- =================================================================
-- WARNING: This will drop the 'experiences' table and any Foreign Keys linking to it (like from 'requests').
-- This is necessary because the current table schema is broken/incompatible for persistence.

DROP TABLE IF EXISTS public.experiences CASCADE;

CREATE TABLE public.experiences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id text,
    user_id uuid,
    title text,
    description text,
    raw_data text, -- IMPORTANT: Stores the full form JSON
    price numeric,
    currency text DEFAULT 'USD',
    city text,
    category text,
    bokun_product_id text,
    duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_experiences_app_id ON public.experiences(application_id);

-- RLS: Open Access for Authenticated Users (Fixes "Disappearing Data")
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Authenticated" ON public.experiences;
CREATE POLICY "Allow All Authenticated" ON public.experiences
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
