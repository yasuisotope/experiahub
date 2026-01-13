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
WHERE id = 'SUP-543C66BA';

-- Option 2: If using flat columns
/*
UPDATE public.suppliers
SET
    company_name = 'ExperiaHub Test Corp',
    billing_address = '123 Innovation Drive',
    tax_id = 'JP-123456789',
    legal_name = 'ExperiaHub Legal Entity KK',
    representative_name = 'Yasu Saito'
WHERE id = 'SUP-543C66BA';
*/
