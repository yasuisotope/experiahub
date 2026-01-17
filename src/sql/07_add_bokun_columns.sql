-- Add Bokun integration columns
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bokun_vendor_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS bokun_booking_id text;

-- Add Unique Constraint for Upsert Support
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_bokun_booking_id_key;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_bokun_booking_id_key UNIQUE (bokun_booking_id);

-- Add Index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_bokun_id ON public.bookings(bokun_booking_id);
