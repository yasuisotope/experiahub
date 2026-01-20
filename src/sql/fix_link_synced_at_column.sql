DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='link_synced_at') THEN
        ALTER TABLE public.experiences ADD COLUMN link_synced_at timestamp with time zone;
    END IF;
END $$;
