-- =================================================================
-- FIX DATABASE SCHEMA AND DATA FOR EXPERIAHUB SUPPLIER PORTAL
-- =================================================================

-- 1. ALTER TABLE to add likely missing columns expected by N8N
--    We use "IF NOT EXISTS" to safely run this multiple times.

DO $$
BEGIN
    -- Add 'business_name'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='business_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN business_name text;
    END IF;

    -- Add 'full_name'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='full_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN full_name text;
    END IF;

    -- Add 'booking_link' (Confirmed missing by Error 500)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='booking_link') THEN
        ALTER TABLE public.suppliers ADD COLUMN booking_link text;
    END IF;

    -- Add 'privacy_consent'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='privacy_consent') THEN
        ALTER TABLE public.suppliers ADD COLUMN privacy_consent boolean DEFAULT false;
    END IF;

    -- Add 'onboarding_json' (Crucial for N8N data mapping)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='onboarding_json') THEN
        ALTER TABLE public.suppliers ADD COLUMN onboarding_json jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add 'status' if missing (Validation)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='status') THEN
        ALTER TABLE public.suppliers ADD COLUMN status text DEFAULT 'Draft';
    END IF;
END $$;

-- 2. UPDATE DATA for the test user to resolve N8N 500 Errors
--    This populates the new columns with valid mock data.

UPDATE public.suppliers
SET
    business_name = 'ExperiaHub Test Corp',
    full_name = 'Yasu Saito',
    email = 'mika.goto@kyotogorilla.com', -- Matching user session
    phone = '+81-90-1234-5678',
    booking_link = 'https://experiahub.com/booking',
    privacy_consent = true,
    status = 'Approved', -- Ensure user can access portal
    
    -- Populate JSONB with structure expected by N8N
    onboarding_json = jsonb_build_object(
        'billing', jsonb_build_object(
            'companyName', 'ExperiaHub Test Corp',
            'taxId', 'JP-87654321',
            'billingAddress', '1-2-3 Marunouchi, Chiyoda-ku, Tokyo',
            'billingEmail', 'billing@experiahub.com'
        ),
        'legal', jsonb_build_object(
             'legalName', 'ExperiaHub Technologies KK',
             'registrationNumber', '0123-45-6789',
             'representativeName', 'Yasu Saito'
        ),
        'locations', jsonb_build_array(
             jsonb_build_object('id', 'loc_1', 'name', 'Tokyo HQ', 'address', 'Tokyo, Japan')
        ),
        'contactName', 'Yasu Saito',
        'contactEmail', 'mika.goto@kyotogorilla.com',
        'legalBusinessName', 'ExperiaHub Test Corp'
    )
WHERE application_id = 'SUP-543C66BA';

-- 3. VERIFY
SELECT application_id, business_name, booking_link, onboarding_json FROM public.suppliers WHERE application_id = 'SUP-543C66BA';
