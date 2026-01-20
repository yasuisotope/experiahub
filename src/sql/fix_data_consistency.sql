-- Ensure pin_count is not null
UPDATE public.experiences 
SET pin_count = 0 
WHERE pin_count IS NULL;

-- Ensure images is populated
UPDATE public.experiences 
SET images = to_jsonb(photos_drive_urls)
WHERE (images IS NULL OR jsonb_array_length(images) = 0) 
  AND photos_drive_urls IS NOT NULL 
  AND array_length(photos_drive_urls, 1) > 0;

-- Set last_pinned_at to a safe past date if it is null, so time-based queries pick it up
UPDATE public.experiences
SET last_pinned_at = '2000-01-01 00:00:00+00'
WHERE last_pinned_at IS NULL;
