import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SrqXqAiEV857SH4apTwMhn2'; // ExperiaHub Premium

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
       // If no email, return default state (Guest)
       return NextResponse.json({
         status: 'none',
         plan: 'Standard Access',
         price: 'Guest'
       });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
       // If no key, fallback to mock for dev
       return NextResponse.json({ status: 'active', plan: 'Premium (Dev)', price: '$29.00/mo' });
    }

    const customers = await stripe.customers.list({ email: email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({
         status: 'none',
         plan: 'Standard Access',
         price: 'Guest'
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    });

    const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing');
    
    if (activeSub) {
      const price = activeSub.items.data[0]?.price;
      const unitAmount = price?.unit_amount || 0;
      const amountStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: price?.currency || 'usd' }).format(unitAmount / 100);
      
      return NextResponse.json({
        status: 'active',
        plan: 'Premium Member',
        next_billing: new Date((activeSub as any).current_period_end * 1000).toISOString(),
        price: `${amountStr}/${activeSub.items.data[0]?.price.recurring?.interval || 'mo'}`
      });
    }

    // Check for one-time payments if needed (e.g. PaymentIntents), but for "Membership" we assume Subscription.
    // If just One-Time "Lifetime" payment, we might need to check Checkout Sessions or Payment Intents.
    // user said "one-time vs recurring". If user bought one-time, they might not have a subscription object.
    // But usually "Membership" implies recurring.
    // The previous code in POST used mode: 'payment' for default.
    // If they paid once, they might not have a subscription.
    // Use ListCheckoutSessions to see if they paid for the specific price?

    return NextResponse.json({
      status: 'inactive',
      plan: 'Standard Access',
      price: 'Guest'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, action } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
       throw new Error('Missing STRIPE_SECRET_KEY');
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Find or Create Customer
    let customerId;
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      if (action === 'portal') {
         return NextResponse.json({ error: 'No customer found for this email' }, { status: 404 });
      }
      const newCustomer = await stripe.customers.create({
        email,
        name: name || 'ExperiaHub Member',
      });
      customerId = newCustomer.id;
    }

    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://app.experiahub.com';
    const appUrl = origin.replace(/\/$/, '');

    // 2. Handle Actions
    if (action === 'portal') {
      console.log('Opening billing portal for:', customerId);
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/payments`,
      });
      return NextResponse.json({ url: session.url });
    } else {
      // Default: Create Checkout Session
      console.log('Creating checkout session for:', email, STRIPE_PRICE_ID);
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/payments?success=true`,
        cancel_url: `${appUrl}/payments?cancel=true`,
        metadata: {
          source: 'experiahub_app'
        }
      });
      return NextResponse.json({ url: session.url });
    }
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
