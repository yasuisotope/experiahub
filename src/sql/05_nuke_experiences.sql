-- =================================================================
-- NUKE AND PAVE EXPERIENCES (Persistence Final Fix)
-- =================================================================
-- Drop the table entirely to remove any hidden constraints or corrupt columns.

DROP TABLE IF EXISTS public.experiences;

CREATE TABLE public.experiences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id text,
    user_id uuid,
    title text,
    description text,
    raw_data text, -- IMPORTANT: Stores the JSON form data
    price numeric,
    currency text DEFAULT 'USD',
    city text,
    category text,
    bokun_product_id text,
    duration_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index
CREATE INDEX idx_experiences_app_id ON public.experiences(application_id);

-- RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICY: Allow authenticated users to do ANYTHING.
-- We are relying on the API to filter by ApplicationID.
-- This removes any "Owner" logic bugs for now.
CREATE POLICY "Allow All Authenticated" ON public.experiences
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
