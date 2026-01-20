DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='pin_count') THEN
        ALTER TABLE public.experiences ADD COLUMN pin_count integer DEFAULT 0;
    END IF;
END $$;
