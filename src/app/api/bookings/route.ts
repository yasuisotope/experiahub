import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bokunService } from '@/services/bokunService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch bookings from Supabase for this user (identified by token/session)
    // Note: In production we'd decode the JWT to get the user email/id
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      bookings: bookings || [],
      upcoming: (bookings || []).filter(b => new Date(b.date) >= new Date()),
      past: (bookings || []).filter(b => new Date(b.date) < new Date())
    });
  } catch (error: any) {
    console.error('Bookings Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { experienceId, date, startTimeId, pax, customer } = body;

    // 1. Create Booking in Bokun
    const bokunRes = await bokunService.createBooking({
      productId: experienceId,
      date,
      startTimeId,
      pax,
      customer
    });

    if (!bokunRes.success) {
      return NextResponse.json({ error: 'Bokun booking failed', details: bokunRes.error }, { status: 400 });
    }

    // 2. Clear Payment via Stripe (Mock for now, would use stripe service here)
    // const paymentIntent = await stripeService.createIntent(...);

    // 3. Record in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bokunData = bokunRes.data as any;
    const finalPrice = body.price || bokunData?.totalPrice || 0;
    const finalCurrency = body.currency || bokunData?.currency || 'USD';
    const finalTitle = body.title || bokunData?.productBookings?.[0]?.productTitle || 'Experience';

    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert([{
        application_id: 'GLOBAL', 
        experience_title: finalTitle,
        customer_name: customer.name,
        customer_email: customer.email,
        date: `${date}T${body.time || '00:00'}:00Z`,
        pax: pax.adult,
        price: finalPrice,
        currency: finalCurrency,
        status: 'Confirmed',
        payment_status: 'PAID',
        bokun_booking_id: bokunData?.confirmationCode || bokunData?.id,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.warn('Database record failed, but Bokun booking succeeded:', dbError);
    }

    return NextResponse.json({
      success: true,
      booking,
      bokunResponse: bokunRes.data
    });
  } catch (error: any) {
    console.error('Booking Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
