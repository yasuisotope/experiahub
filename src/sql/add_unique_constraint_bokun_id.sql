DO $$
BEGIN
    -- 1. Clean duplicates (keep latest updated)
    -- This ensures we can successfully apply the UNIQUE constraint
    DELETE FROM experiences
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
            ROW_NUMBER() OVER (partition BY bokun_product_id ORDER BY updated_at DESC, id DESC) AS rnum
            FROM experiences
            WHERE bokun_product_id IS NOT NULL
        ) t
        WHERE t.rnum > 1
    );

    -- 2. Add Unique Constraint on bokun_product_id
    -- This is required for PostgREST upsert (on_conflict=bokun_product_id) to work
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'experiences_bokun_product_id_key'
    ) THEN
        ALTER TABLE public.experiences ADD CONSTRAINT experiences_bokun_product_id_key UNIQUE (bokun_product_id);
    END IF;
END $$;
