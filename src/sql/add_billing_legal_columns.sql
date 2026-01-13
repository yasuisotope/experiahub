-- =================================================================
-- ADD MISSING COLUMNS FOR BILLING, LEGAL, AND LOCATIONS
-- =================================================================
-- These columns are required for the Company Settings (Billing, Legal, Locations)
-- to be saved directly to Supabase, bypassing the missing N8N workflows.

DO $$
BEGIN
    -- Billing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_company_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_company_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_address') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_address text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_country') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_country text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_tax_id') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_tax_id text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_invoice_email') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_invoice_email text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='billing_currency') THEN
        ALTER TABLE public.suppliers ADD COLUMN billing_currency text;
    END IF;

    -- Legal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_reg_number') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_reg_number text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_vat_number') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_vat_number text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_terms_url') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_terms_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_privacy_url') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_privacy_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legal_representative') THEN
        ALTER TABLE public.suppliers ADD COLUMN legal_representative text;
    END IF;

    -- Locations (JSON Array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='locations_json') THEN
        ALTER TABLE public.suppliers ADD COLUMN locations_json jsonb;
    END IF;

    -- User Profile (Ensure these exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contact_name') THEN
        ALTER TABLE public.suppliers ADD COLUMN contact_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contact_phone') THEN
        ALTER TABLE public.suppliers ADD COLUMN contact_phone text;
    END IF;

END $$;
