-- =================================================================
-- ADD MISSING application_id TO experiences TABLE
-- =================================================================
-- The sync logic relies on 'application_id' to link experiences to suppliers.
-- A persistent error indicates this column is missing.

DO $$
BEGIN
    -- 1. application_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='application_id') THEN
        ALTER TABLE public.experiences ADD COLUMN application_id text;
        -- Optional: Add index for performance
        CREATE INDEX IF NOT EXISTS idx_experiences_application_id ON public.experiences(application_id);
    END IF;

    -- 2. raw_data (Ensure it exists as it stores the full JSON state)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='raw_data') THEN
        ALTER TABLE public.experiences ADD COLUMN raw_data jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- 3. updated_at
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='updated_at') THEN
        ALTER TABLE public.experiences ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;

END $$;
