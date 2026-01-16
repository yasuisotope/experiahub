-- Create Bookings Table if not exists
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id text NOT NULL,
    experience_title text,
    customer_name text,
    customer_email text,
    date timestamp with time zone,
    pax integer,
    price numeric,
    currency text DEFAULT 'USD',
    status text DEFAULT 'Confirmed',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view their own bookings" ON public.bookings;
CREATE POLICY "Suppliers can view their own bookings" ON public.bookings
    FOR SELECT
    USING (application_id IN (
        SELECT application_id FROM public.suppliers WHERE user_id = auth.uid() OR user_id IS NULL -- weak link fallback
    ));

-- Insert Mock Data for testing
INSERT INTO public.bookings (application_id, experience_title, customer_name, date, pax, price, status)
VALUES
    ('SUP-543C66BA', 'Authentic Echoes', 'Alice Smith', NOW() + INTERVAL '2 days', 2, 150.00, 'Confirmed'),
    ('SUP-543C66BA', 'Hidden Gems of Kyoto', 'Bob Jones', NOW() + INTERVAL '5 days', 4, 300.00, 'Pending'),
    ('SUP-543C66BA', 'Authentic Echoes', 'Charlie Brown', NOW() - INTERVAL '1 day', 1, 75.00, 'Completed')
ON CONFLICT DO NOTHING;
