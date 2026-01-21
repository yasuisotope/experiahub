import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bokunService } from '@/services/bokunService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the booking to find the Bokun ID
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Cancel in Bokun if it has a Bokun ID
    if (booking.bokun_booking_id) {
      const bokunRes = await bokunService.cancelBooking(booking.bokun_booking_id, reason);
      if (!bokunRes.success) {
        console.warn('Bokun cancellation failed, continuing with DB update:', bokunRes.error);
      }
    }

    // 3. Initiate Stripe Refund (Mocked for now)
    // if (booking.payment_intent_id) { ... }

    // 4. Update Supabase status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully.'
    });

  } catch (error: any) {
    console.error('Cancellation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
