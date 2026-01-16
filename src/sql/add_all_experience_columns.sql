-- =================================================================
-- FIX MISSING COLUMNS IN EXPERIENCES TABLE
-- =================================================================
-- The API is trying to save to these columns, but they don't exist.
-- This causes the "Could not find column... in schema cache" error.

DO $$
BEGIN
    -- 1. category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='category') THEN
        ALTER TABLE public.experiences ADD COLUMN category text;
    END IF;

    -- 2. city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='city') THEN
        ALTER TABLE public.experiences ADD COLUMN city text;
    END IF;

    -- 3. description (Map 'summary' to this)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='description') THEN
        ALTER TABLE public.experiences ADD COLUMN description text;
    END IF;

    -- 4. duration_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='duration_minutes') THEN
        ALTER TABLE public.experiences ADD COLUMN duration_minutes integer;
    END IF;

    -- 5. price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='price') THEN
        ALTER TABLE public.experiences ADD COLUMN price numeric;
    END IF;

    -- 6. currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='currency') THEN
        ALTER TABLE public.experiences ADD COLUMN currency text;
    END IF;

    -- 7. bokun_product_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='bokun_product_id') THEN
        ALTER TABLE public.experiences ADD COLUMN bokun_product_id text;
    END IF;

    -- 8. raw_data (Just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='raw_data') THEN
        ALTER TABLE public.experiences ADD COLUMN raw_data jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- 9. application_id (Just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='application_id') THEN
        ALTER TABLE public.experiences ADD COLUMN application_id text;
    END IF;

END $$;
