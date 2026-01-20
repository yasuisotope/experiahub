-- Fix for "column experiences.supplier_id does not exist" error
-- This column is likely expected by n8n workflows to link experiences to suppliers via UUID.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='supplier_id') THEN
        ALTER TABLE public.experiences ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id);
    END IF;
END $$;

-- Backfill: Link existing experiences to suppliers based on matching application_id
UPDATE public.experiences e
SET supplier_id = s.id
FROM public.suppliers s
WHERE e.application_id = s.application_id
AND e.supplier_id IS NULL;
