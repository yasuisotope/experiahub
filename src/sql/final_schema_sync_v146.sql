-- =================================================================
-- COMPREHENSIVE EXPERIENCE SCHEMA SYNC (V146)
-- =================================================================
-- Adding all missing logistics and detail columns to the experiences table
-- to ensure full persistence and prevent data loss in the Supplier Portal.

DO $$
BEGIN
    -- 1. Narrative & Marketing (Ensure all are there)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='itinerary') THEN
        ALTER TABLE public.experiences ADD COLUMN itinerary text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='three_words') THEN
        ALTER TABLE public.experiences ADD COLUMN three_words text;
    END IF;
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

    -- 2. Logistics & Requirements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='meeting_point') THEN
        ALTER TABLE public.experiences ADD COLUMN meeting_point text;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='languages') THEN
        ALTER TABLE public.experiences ADD COLUMN languages text;
    END IF;

    -- 3. Pricing & Capacity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='max_participants') THEN
        ALTER TABLE public.experiences ADD COLUMN max_participants integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='min_participants') THEN
        ALTER TABLE public.experiences ADD COLUMN min_participants integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='cancellation_policy') THEN
        ALTER TABLE public.experiences ADD COLUMN cancellation_policy text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='booking_lead_time') THEN
        ALTER TABLE public.experiences ADD COLUMN booking_lead_time text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='time_zone') THEN
        ALTER TABLE public.experiences ADD COLUMN time_zone text DEFAULT 'Asia/Tokyo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='city') THEN
        ALTER TABLE public.experiences ADD COLUMN city text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='duration_minutes') THEN
        ALTER TABLE public.experiences ADD COLUMN duration_minutes integer;
    END IF;

    -- 4. Advanced Booking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='scheduling_mode') THEN
        ALTER TABLE public.experiences ADD COLUMN scheduling_mode text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='start_times') THEN
        ALTER TABLE public.experiences ADD COLUMN start_times text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='cutoff_hours') THEN
        ALTER TABLE public.experiences ADD COLUMN cutoff_hours text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='pricing_categories') THEN
        ALTER TABLE public.experiences ADD COLUMN pricing_categories text;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='base_rate') THEN
        ALTER TABLE public.experiences ADD COLUMN base_rate numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='pricing_rows') THEN
        ALTER TABLE public.experiences ADD COLUMN pricing_rows jsonb DEFAULT '[]'::jsonb;
    END IF;

END $$;

-- 2. Update Update RPC with ALL columns
CREATE OR REPLACE FUNCTION public.upsert_experience_system(
    p_application_id text,
    p_experience_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
    v_new_id uuid;
    v_inserted_ids jsonb := '{}';
    v_rec record;
    v_count int := 0;
BEGIN
    FOR v_rec IN SELECT * FROM jsonb_to_recordset(p_experience_data) AS x(
        id text, 
        title text, 
        description text, 
        price numeric, 
        currency text, 
        duration_minutes integer,
        bokun_product_id text,
        category text,
        raw_data text,
        metadata jsonb,
        photos_drive_urls text[],
        video_drive_url text,
        video_url text,
        status text,
        booking_link text,
        itinerary text,
        three_words text,
        scheduling_mode text,
        authentic_echoes text,
        unforgettable_feeling text,
        magic_moment text,
        hidden_gem text,
        community_connection text,
        perfect_match text,
        meeting_point text,
        safety_measures text,
        requirements text,
        included text,
        not_included text,
        insurance text,
        languages text,
        max_participants integer,
        min_participants integer,
        cancellation_policy text,
        booking_lead_time text,
        time_zone text,
        city text,
        start_times text,
        cutoff_hours text,
        pricing_categories text,
        base_rate numeric,
        pricing_rows jsonb
    )
    LOOP
        BEGIN
            v_id := v_rec.id::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            v_id := NULL;
        END;

        IF v_id IS NOT NULL THEN
            UPDATE public.experiences
            SET 
                title = v_rec.title,
                description = v_rec.description,
                price = v_rec.price,
                currency = COALESCE(v_rec.currency, 'USD'),
                duration_minutes = v_rec.duration_minutes,
                bokun_product_id = v_rec.bokun_product_id,
                category = v_rec.category,
                raw_data = v_rec.raw_data,
                metadata = COALESCE(v_rec.metadata, experiences.metadata),
                photos_drive_urls = CASE 
                    WHEN v_rec.photos_drive_urls IS NULL OR array_length(v_rec.photos_drive_urls, 1) = 0 THEN experiences.photos_drive_urls
                    WHEN (SELECT bool_or(x LIKE '%anyoneWithLink%') FROM unnest(v_rec.photos_drive_urls) x) 
                         AND NOT (SELECT bool_or(x LIKE '%anyoneWithLink%') FROM unnest(experiences.photos_drive_urls) x) 
                         AND array_length(experiences.photos_drive_urls, 1) > 0
                    THEN experiences.photos_drive_urls
                    ELSE v_rec.photos_drive_urls
                END,
                video_drive_url = CASE
                    WHEN v_rec.video_drive_url IS NULL OR v_rec.video_drive_url = '' THEN experiences.video_drive_url
                    WHEN v_rec.video_drive_url LIKE '%anyoneWithLink%' AND experiences.video_drive_url NOT LIKE '%anyoneWithLink%' AND experiences.video_drive_url != ''
                    THEN experiences.video_drive_url
                    ELSE v_rec.video_drive_url
                END,
                video_url = COALESCE(v_rec.video_url, experiences.video_url),
                status = v_rec.status,
                booking_link = v_rec.booking_link,
                itinerary = v_rec.itinerary,
                three_words = v_rec.three_words,
                scheduling_mode = v_rec.scheduling_mode,
                authentic_echoes = v_rec.authentic_echoes,
                unforgettable_feeling = v_rec.unforgettable_feeling,
                magic_moment = v_rec.magic_moment,
                hidden_gem = v_rec.hidden_gem,
                community_connection = v_rec.community_connection,
                perfect_match = v_rec.perfect_match,
                meeting_point = v_rec.meeting_point,
                safety_measures = v_rec.safety_measures,
                requirements = v_rec.requirements,
                included = v_rec.included,
                not_included = v_rec.not_included,
                insurance = v_rec.insurance,
                languages = v_rec.languages,
                max_participants = v_rec.max_participants,
                min_participants = v_rec.min_participants,
                cancellation_policy = v_rec.cancellation_policy,
                booking_lead_time = v_rec.booking_lead_time,
                time_zone = v_rec.time_zone,
                city = v_rec.city,
                start_times = v_rec.start_times,
                cutoff_hours = v_rec.cutoff_hours,
                pricing_categories = CASE WHEN v_rec.pricing_categories IS NULL THEN experiences.pricing_categories ELSE v_rec.pricing_categories END,
                base_rate = CASE WHEN v_rec.base_rate IS NULL THEN experiences.base_rate ELSE v_rec.base_rate END,
                currency = CASE WHEN v_rec.currency IS NULL OR v_rec.currency = '' THEN experiences.currency ELSE v_rec.currency END,
                pricing_rows = CASE 
                    WHEN v_rec.pricing_rows IS NULL THEN experiences.pricing_rows 
                    ELSE v_rec.pricing_rows 
                END,
                updated_at = now()
            WHERE id = v_id AND application_id = p_application_id;
            
            IF NOT FOUND THEN
                 INSERT INTO public.experiences (
                    id, application_id, title, description, price, currency, duration_minutes, 
                    bokun_product_id, category, raw_data, metadata, photos_drive_urls, video_drive_url, video_url, status,
                    booking_link, itinerary, three_words, scheduling_mode, authentic_echoes, 
                    unforgettable_feeling, magic_moment, hidden_gem, community_connection, perfect_match,
                    meeting_point, safety_measures, requirements, included, not_included, insurance,
                    languages, max_participants, min_participants, cancellation_policy, booking_lead_time,
                    time_zone, city, start_times, cutoff_hours, pricing_categories, base_rate, pricing_rows
                ) VALUES (
                    v_id, p_application_id, v_rec.title, v_rec.description, v_rec.price, COALESCE(v_rec.currency, 'USD'), 
                    v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data, v_rec.metadata,
                    v_rec.photos_drive_urls, v_rec.video_drive_url, v_rec.video_url, v_rec.status,
                    v_rec.booking_link, v_rec.itinerary, v_rec.three_words, v_rec.scheduling_mode, v_rec.authentic_echoes, 
                    v_rec.unforgettable_feeling, v_rec.magic_moment, v_rec.hidden_gem, v_rec.community_connection, v_rec.perfect_match,
                    v_rec.meeting_point, v_rec.safety_measures, v_rec.requirements, v_rec.included, v_rec.not_included, v_rec.insurance,
                    v_rec.languages, v_rec.max_participants, v_rec.min_participants, v_rec.cancellation_policy, v_rec.booking_lead_time,
                    v_rec.time_zone, v_rec.city, v_rec.start_times, v_rec.cutoff_hours, v_rec.pricing_categories, v_rec.base_rate,
                    COALESCE(v_rec.pricing_rows, '[]'::jsonb)
                );
            END IF;
        ELSE
            INSERT INTO public.experiences (
                application_id, title, description, price, currency, duration_minutes, 
                bokun_product_id, category, raw_data, metadata, photos_drive_urls, video_drive_url, video_url, status,
                booking_link, itinerary, three_words, scheduling_mode, authentic_echoes, 
                unforgettable_feeling, magic_moment, hidden_gem, community_connection, perfect_match,
                meeting_point, safety_measures, requirements, included, not_included, insurance,
                languages, max_participants, min_participants, cancellation_policy, booking_lead_time,
                time_zone, city, start_times, cutoff_hours, pricing_categories, base_rate, pricing_rows
            ) VALUES (
                p_application_id, v_rec.title, v_rec.description, v_rec.price, COALESCE(v_rec.currency, 'USD'), 
                v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data, v_rec.metadata,
                v_rec.photos_drive_urls, v_rec.video_drive_url, v_rec.video_url, v_rec.status,
                v_rec.booking_link, v_rec.itinerary, v_rec.three_words, v_rec.scheduling_mode, v_rec.authentic_echoes, 
                v_rec.unforgettable_feeling, v_rec.magic_moment, v_rec.hidden_gem, v_rec.community_connection, v_rec.perfect_match,
                v_rec.meeting_point, v_rec.safety_measures, v_rec.requirements, v_rec.included, v_rec.not_included, v_rec.insurance,
                v_rec.languages, v_rec.max_participants, v_rec.min_participants, v_rec.cancellation_policy, v_rec.booking_lead_time,
                v_rec.time_zone, v_rec.city, v_rec.start_times, v_rec.cutoff_hours, v_rec.pricing_categories, v_rec.base_rate,
                COALESCE(v_rec.pricing_rows, '[]'::jsonb)
            )
            RETURNING id INTO v_new_id;
            
            v_inserted_ids = jsonb_set(v_inserted_ids, ARRAY[v_rec.id], to_jsonb(v_new_id));
        END IF;
        v_count := v_count + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'count', v_count, 'idMappings', v_inserted_ids);
END;
$$;
