-- =================================================================
-- COMPLETE SCHEMA FIX FOR SUPPLIER ONBOARDING
-- =================================================================
-- The N8N workflow 'ExperiaHub Supplier Onboarding Save.json' writes to ~30 columns.
-- Many are missing dev-side. We must add them ALL to prevent 500 errors.

DO $$
BEGIN
    -- Core Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='origin_story') THEN
        ALTER TABLE public.suppliers ADD COLUMN origin_story text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='fulfillment') THEN
        ALTER TABLE public.suppliers ADD COLUMN fulfillment text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='authentic_echoes') THEN
        ALTER TABLE public.suppliers ADD COLUMN authentic_echoes text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='unforgettable_feeling') THEN
        ALTER TABLE public.suppliers ADD COLUMN unforgettable_feeling text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='moment_of_magic') THEN
        ALTER TABLE public.suppliers ADD COLUMN moment_of_magic text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='hidden_gem') THEN
        ALTER TABLE public.suppliers ADD COLUMN hidden_gem text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='community_connection') THEN
        ALTER TABLE public.suppliers ADD COLUMN community_connection text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='perfect_match') THEN
        ALTER TABLE public.suppliers ADD COLUMN perfect_match text;
    END IF;

    -- Logistics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='availability') THEN
        ALTER TABLE public.suppliers ADD COLUMN availability text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='booking_lead_time') THEN
        ALTER TABLE public.suppliers ADD COLUMN booking_lead_time text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='booking_system') THEN
        ALTER TABLE public.suppliers ADD COLUMN booking_system text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='cancellation_policy') THEN
        ALTER TABLE public.suppliers ADD COLUMN cancellation_policy text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='safety_measures') THEN
        ALTER TABLE public.suppliers ADD COLUMN safety_measures text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='insurance') THEN
        ALTER TABLE public.suppliers ADD COLUMN insurance text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='participant_requirements') THEN
        ALTER TABLE public.suppliers ADD COLUMN participant_requirements text;
    END IF;

    -- Profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='three_words') THEN
        ALTER TABLE public.suppliers ADD COLUMN three_words text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='more_about_you') THEN
        ALTER TABLE public.suppliers ADD COLUMN more_about_you text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='max_participants') THEN
        ALTER TABLE public.suppliers ADD COLUMN max_participants text; -- Keeping text to be safe, could be int
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='min_participants') THEN
        ALTER TABLE public.suppliers ADD COLUMN min_participants text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='typical_price_range') THEN
        ALTER TABLE public.suppliers ADD COLUMN typical_price_range text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='included_in_price') THEN
        ALTER TABLE public.suppliers ADD COLUMN included_in_price text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='not_included') THEN
        ALTER TABLE public.suppliers ADD COLUMN not_included text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='typical_duration') THEN
        ALTER TABLE public.suppliers ADD COLUMN typical_duration text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='experience_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN experience_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='primary_locations') THEN
        ALTER TABLE public.suppliers ADD COLUMN primary_locations text;
    END IF;
END $$;
