-- Check count of experiences for the specific Supplier
SELECT count(*) as total_experiences 
FROM public.experiences 
WHERE application_id = 'SUP-543C66BA';

-- Show the rows to verify content
SELECT id, title, application_id, bokun_product_id 
FROM public.experiences 
WHERE application_id = 'SUP-543C66BA';
