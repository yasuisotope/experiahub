-- =================================================================
-- SYSTEM LEVEL SCHEMA & PERSISTENCE FIX (V145)
-- =================================================================

DO $$
BEGIN
    -- 1. Ensure Structured Media Columns Exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='photos_drive_urls') THEN
        ALTER TABLE public.experiences ADD COLUMN photos_drive_urls text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='video_drive_url') THEN
        ALTER TABLE public.experiences ADD COLUMN video_drive_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='video_url') THEN
        ALTER TABLE public.experiences ADD COLUMN video_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='status') THEN
        ALTER TABLE public.experiences ADD COLUMN status text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='booking_link') THEN
        ALTER TABLE public.experiences ADD COLUMN booking_link text;
    END IF;

    -- 2. Ensure Narrative Columns Exist (Check against the ones from add_narrative_columns_to_experiences)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='itinerary') THEN
        ALTER TABLE public.experiences ADD COLUMN itinerary text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='three_words') THEN
        ALTER TABLE public.experiences ADD COLUMN three_words text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='scheduling_mode') THEN
        ALTER TABLE public.experiences ADD COLUMN scheduling_mode text;
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
END $$;

-- 2. Update RPC to handle structured media and status
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
        perfect_match text
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
                photos_drive_urls = CASE 
                    WHEN v_rec.photos_drive_urls IS NULL OR array_length(v_rec.photos_drive_urls, 1) = 0 THEN experiences.photos_drive_urls
                    -- If incoming has placeholders AND existing is finalize, KEEP existing
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
                updated_at = now()
            WHERE id = v_id AND application_id = p_application_id;
            
            IF NOT FOUND THEN
                 INSERT INTO public.experiences (
                    id, application_id, title, description, price, currency, duration_minutes, 
                    bokun_product_id, category, raw_data, photos_drive_urls, video_drive_url, video_url, status,
                    booking_link, itinerary, three_words, scheduling_mode, authentic_echoes, 
                    unforgettable_feeling, magic_moment, hidden_gem, community_connection, perfect_match
                ) VALUES (
                    v_id, p_application_id, v_rec.title, v_rec.description, v_rec.price, v_rec.currency, 
                    v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data,
                    v_rec.photos_drive_urls, v_rec.video_drive_url, v_rec.video_url, v_rec.status,
                    v_rec.booking_link, v_rec.itinerary, v_rec.three_words, v_rec.scheduling_mode, v_rec.authentic_echoes, 
                    v_rec.unforgettable_feeling, v_rec.magic_moment, v_rec.hidden_gem, v_rec.community_connection, v_rec.perfect_match
                );
            END IF;
        ELSE
            INSERT INTO public.experiences (
                application_id, title, description, price, currency, duration_minutes, 
                bokun_product_id, category, raw_data, photos_drive_urls, video_drive_url, video_url, status,
                booking_link, itinerary, three_words, scheduling_mode, authentic_echoes, 
                unforgettable_feeling, magic_moment, hidden_gem, community_connection, perfect_match
            ) VALUES (
                p_application_id, v_rec.title, v_rec.description, v_rec.price, COALESCE(v_rec.currency, 'USD'), 
                v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data,
                v_rec.photos_drive_urls, v_rec.video_drive_url, v_rec.video_url, v_rec.status,
                v_rec.booking_link, v_rec.itinerary, v_rec.three_words, v_rec.scheduling_mode, v_rec.authentic_echoes, 
                v_rec.unforgettable_feeling, v_rec.magic_moment, v_rec.hidden_gem, v_rec.community_connection, v_rec.perfect_match
            )
            RETURNING id INTO v_new_id;
            
            v_inserted_ids = jsonb_set(v_inserted_ids, ARRAY[v_rec.id], to_jsonb(v_new_id));
        END IF;
        v_count := v_count + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'count', v_count, 'idMappings', v_inserted_ids);
END;
$$;
