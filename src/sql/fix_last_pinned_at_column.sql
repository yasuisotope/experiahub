DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='last_pinned_at') THEN
        ALTER TABLE public.experiences ADD COLUMN last_pinned_at timestamp with time zone;
    END IF;
END $$;
