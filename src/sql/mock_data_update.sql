/*
UPDATE public.suppliers
SET
    billing_data = jsonb_build_object(
        'companyName', 'ExperiaHub Test Corp',
        'address', '123 Innovation Drive',
        'city', 'Tech City',
        'country', 'Japan',
        'taxId', 'JP-123456789',
        'invoiceEmail', 'billing@experiahub.com',
        'currency', 'USD'
    ),
    legal_data = jsonb_build_object(
        'legalName', 'ExperiaHub Legal Entity KK',
        'regNumber', '987654321',
        'vatNumber', 'JP-VAT-999',
        'termsUrl', 'https://experiahub.com/terms',
        'privacyUrl', 'https://experiahub.com/privacy',
        'representative', 'Yasu Saito'
    ),
    locations_data = jsonb_build_array(
        jsonb_build_object(
            'name', 'Main Office',
            'address', '456 Startup Lane',
            'city', 'Tokyo',
            'country', 'Japan',
            'timeZone', 'Asia/Tokyo'
        )
    ),
    profile_data = jsonb_build_object(
        'displayName', 'Experia Admin',
        'phone', '+81-90-1234-5678'
    )
WHERE application_id = 'SUP-543C66BA';
*/

/*-- CHECK SCHEMA FIRST (Run this to see columns if unsure)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers';

-- OPTION 3: JSONB Columns (billing, legal, locations, profile) WITHOUT _data suffix
-- Attempts to update assuming the table stores data in structured JSONB columns.
UPDATE public.suppliers
SET 
    billing = jsonb_build_object(
        'companyName', 'ExperiaHub Test Corp',
        'taxId', 'JP-87654321',
        'billingAddress', '1-2-3 Marunouchi, Chiyoda-ku, Tokyo',
        'billingEmail', 'billing@experiahub.com'
    ),
    legal = jsonb_build_object(
        'legalName', 'ExperiaHub Technologies KK',
        'registrationNumber', '0123-45-6789',
        'representativeName', 'Yasu Saito',
        'dateOfIncorporation', '2023-01-01'
    ),
    locations = jsonb_build_array(
        jsonb_build_object(
            'id', 'loc_1',
            'name', 'Tokyo HQ',
            'address', '1-2-3 Marunouchi, Chiyoda-ku, Tokyo, Japan'
        ),
         jsonb_build_object(
            'id', 'loc_2',
            'name', 'Kyoto Branch',
            'address', '4-5-6 Karasuma, Nakagyo-ku, Kyoto, Japan'
        )
    ),
    profile = jsonb_build_object(
        'fullName', 'Supplier Admin',
        'email', 'admin@experiahub.com',
        'phone', '+81-90-1234-5678',
        'role', 'Administrator'
    )
WHERE application_id = 'mock-app-id-001';
*/

-- Option 2: If using flat columns
UPDATE public.suppliers
SET
    company_name = 'ExperiaHub Test Corp',
    billing_address = '123 Innovation Drive',
    tax_id = 'JP-123456789',
    legal_name = 'ExperiaHub Legal Entity KK',
    representative_name = 'Yasu Saito'
WHERE application_id = 'SUP-543C66BA';
