DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='images') THEN
        ALTER TABLE public.experiences ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Backfill: Sync images from photos_drive_urls (converting text[] to jsonb)
UPDATE public.experiences 
SET images = to_jsonb(photos_drive_urls)
WHERE (images IS NULL OR images = '[]'::jsonb) AND photos_drive_urls IS NOT NULL;
