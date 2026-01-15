DO $$
BEGIN
    -- Add description column if it doesn't exist (maps to 'Description' field in UI)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='description') THEN
        ALTER TABLE public.suppliers ADD COLUMN description text;
    END IF;

    -- Ensure origin_story exists (maps to 'Origin Story' field in UI)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='origin_story') THEN
        ALTER TABLE public.suppliers ADD COLUMN origin_story text;
    END IF;
END $$;
