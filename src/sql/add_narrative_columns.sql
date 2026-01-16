-- Add missing narrative and logistical columns to experiences table
DO $$
BEGIN
    -- Narrative / Story Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='authentic_echoes') THEN
        ALTER TABLE public.experiences ADD COLUMN authentic_echoes text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='unforgettable_feeling') THEN
        ALTER TABLE public.experiences ADD COLUMN unforgettable_feeling text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='magic_moment') THEN
        ALTER TABLE public.experiences ADD COLUMN magic_moment text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='hidden_gem') THEN
        ALTER TABLE public.experiences ADD COLUMN hidden_gem text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='community_connection') THEN
        ALTER TABLE public.experiences ADD COLUMN community_connection text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='perfect_match') THEN
        ALTER TABLE public.experiences ADD COLUMN perfect_match text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='three_words') THEN
        ALTER TABLE public.experiences ADD COLUMN three_words text;
    END IF;

    -- Logistics & Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='meeting_point') THEN
        ALTER TABLE public.experiences ADD COLUMN meeting_point text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='itinerary') THEN
        ALTER TABLE public.experiences ADD COLUMN itinerary text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='safety_measures') THEN
        ALTER TABLE public.experiences ADD COLUMN safety_measures text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='requirements') THEN
        ALTER TABLE public.experiences ADD COLUMN requirements text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='included') THEN
        ALTER TABLE public.experiences ADD COLUMN included text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='not_included') THEN
        ALTER TABLE public.experiences ADD COLUMN not_included text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='insurance') THEN
        ALTER TABLE public.experiences ADD COLUMN insurance text;
    END IF;

END $$;
