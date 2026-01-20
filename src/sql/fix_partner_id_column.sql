DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='partner_id') THEN
        ALTER TABLE public.experiences ADD COLUMN partner_id uuid;
    END IF;
END $$;

-- Backfill partner_id from supplier_id (assuming they are the same for now, or just leave null if no partners table)
-- If partners table existed, we would link it. But since we don't see it, we will just add the column to satisfy the n8n node.
-- It is likely n8n checks for this column existence.

UPDATE public.experiences 
SET partner_id = supplier_id 
WHERE partner_id IS NULL AND supplier_id IS NOT NULL;
