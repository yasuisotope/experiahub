-- Reset one experience to be "unlinked" (partner_id = NULL) for testing purposes
UPDATE public.experiences 
SET partner_id = NULL 
WHERE id = (
    SELECT id FROM public.experiences 
    WHERE partner_id IS NOT NULL 
    LIMIT 1
);
