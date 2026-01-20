-- Enable RLS on experiences table if not already enabled (it usually is)
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for SELECT if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'experiences' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON "public"."experiences" FOR SELECT USING (true);
    END IF;
    
     IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'experiences' 
        AND policyname = 'Enable update access for all users'
    ) THEN
        CREATE POLICY "Enable update access for all users" ON "public"."experiences" FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Update status to 'Active' for testing (assuming 'Active' is the valid status)
UPDATE public.experiences 
SET status = 'Active' 
WHERE status IS NULL OR status = '';

-- Re-apply the pin_count and last_pinned_at fix just to be 100% sure
UPDATE public.experiences 
SET pin_count = 0 
WHERE pin_count IS NULL;

UPDATE public.experiences 
SET last_pinned_at = '2000-01-01 00:00:00+00'
WHERE last_pinned_at IS NULL;
