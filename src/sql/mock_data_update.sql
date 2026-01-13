-- CHECK SCHEMA FIRST (Run this to see columns if unsure)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers';

-- OPTION 4: Verified N8N Columns (business_name, full_name, onboarding_json)
-- Based on 'ExperiaHub Supplier Onboarding Save.json' workflow which successfully updates 'suppliers'.

UPDATE public.suppliers
SET
    business_name = 'ExperiaHub Test Corp', -- Matches N8N 'business_name' field
    full_name = 'Yasu Saito',               -- Matches N8N 'full_name' field
    email = 'admin@experiahub.com',         -- Matches N8N 'email' field
    phone = '+81-90-1234-5678',             -- Matches N8N 'phone' field
    booking_link = 'https://experiahub.com',-- Matches N8N 'booking_link' field
    privacy_consent = true,                 -- Matches N8N 'privacy_consent' field
    
    -- Structure matches 'onboarding_json' used in N8N. 
    -- This field seems to hold the rich data structure (billing, legal, etc.)
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
        'contactEmail', 'admin@experiahub.com',
        'legalBusinessName', 'ExperiaHub Test Corp'
    )
WHERE application_id = 'mock-app-id-001'; -- REPLACE WITH YOUR ACTUAL APPLICATION ID (e.g. SUP-...)
