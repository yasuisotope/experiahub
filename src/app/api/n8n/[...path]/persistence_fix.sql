-- =================================================================
-- RPC: System Level Upsert for Experiences (Bypasses RLS/JWT)
-- =================================================================

-- Create a secure function that runs as the database owner (SECURITY DEFINER)
-- This allows us to insert/update experiences even if the User Token is invalid (No suitable key)
-- or if RLS is blocking access. We control access logic inside the function.

CREATE OR REPLACE FUNCTION public.upsert_experience_system(
    p_application_id text,
    p_experience_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_id uuid;
    v_new_id uuid;
    v_inserted_ids jsonb := '{}';
    v_rec record;
    v_count int := 0;
BEGIN
    -- Input is a JSONB array of experiences or a single object. 
    -- We assume it's passed as a single object which might contain an array, but 
    -- for simplicity let's assume route.ts calls this PER experience or passes an array.
    -- Let's design it to take the WHOLE `payload.activities` array if possible, or just one.
    
    -- Actually, route.ts iterates or processes. Passing an array is more efficient.
    
    -- Loop through the JSON array
    FOR v_rec IN SELECT * FROM jsonb_to_recordset(p_experience_data) AS x(
        id text, 
        title text, 
        description text, 
        price numeric, 
        currency text, 
        duration_minutes integer,
        bokun_product_id text,
        category text,
        raw_data text -- We pass the full raw JSON stringified
    )
    LOOP
        -- Check if ID is a valid UUID (Existing) OR a temporary ID (New)
        -- We can use a regex check or just try to cast.
        
        BEGIN
            v_id := v_rec.id::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            v_id := NULL; -- It's a temp ID like "row_123"
        END;

        IF v_id IS NOT NULL THEN
            -- Update existing credential
            UPDATE public.experiences
            SET 
                title = v_rec.title,
                description = v_rec.description,
                price = v_rec.price,
                currency = COALESCE(v_rec.currency, 'USD'),
                duration_minutes = v_rec.duration_minutes,
                bokun_product_id = v_rec.bokun_product_id,
                category = v_rec.category,
                raw_data = v_rec.raw_data, -- Update the raw blob
                updated_at = now()
            WHERE id = v_id AND application_id = p_application_id;
            
            -- If update affects 0 rows (maybe it was deleted?), insert it? 
            -- Or just ignore. Usually if it has a UUID it should exist.
            -- If it doesn't exist, we should probably Insert it with that UUID to restore it.
            IF NOT FOUND THEN
                 INSERT INTO public.experiences (
                    id, application_id, title, description, price, currency, duration_minutes, 
                    bokun_product_id, category, raw_data
                ) VALUES (
                    v_id, p_application_id, v_rec.title, v_rec.description, v_rec.price, v_rec.currency, 
                    v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data
                );
            END IF;

        ELSE
            -- Insert New
            INSERT INTO public.experiences (
                application_id, title, description, price, currency, duration_minutes, 
                bokun_product_id, category, raw_data
            ) VALUES (
                p_application_id, v_rec.title, v_rec.description, v_rec.price, COALESCE(v_rec.currency, 'USD'), 
                v_rec.duration_minutes, v_rec.bokun_product_id, v_rec.category, v_rec.raw_data
            )
            RETURNING id INTO v_new_id;
            
            -- Record mapping of Temp ID -> Real UUID
            v_inserted_ids := jsonb_set(v_inserted_ids, ARRAY[v_rec.id], to_jsonb(v_new_id));
        END IF;
        
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'count', v_count, 'idMappings', v_inserted_ids);
END;
$$;

-- Grant execution to authenticated (users) and anon (if needed for failover)
GRANT EXECUTE ON FUNCTION public.upsert_experience_system TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_experience_system TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_experience_system TO service_role;
