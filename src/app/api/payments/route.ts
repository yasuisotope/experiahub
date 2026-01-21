import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_1SrqXqAiEV857SH4apTwMhn2'; // ExperiaHub Premium

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a production env, we would verify the JWT here to get the email
    // For now, we'll try to find the customer by email if provided in headers or query, 
    // or return a neutral state if we can't identify the Stripe customer yet.
    // Ideally, the user's email is stored in the JWT payload.
    
    // Mocking "Active" if we can't verify for the sake of the UI demo, 
    // but in reality we should query Stripe.
    
    return NextResponse.json({
      status: 'active', // Placeholder until we have the user's stripe_customer_id in Supabase
      plan: 'Premium',
      next_billing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: '$29.00/mo'
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

    const { email, name } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
       throw new Error('Missing STRIPE_SECRET_KEY');
    }

    // 1. Find or Create Customer
    let customerId;
    if (email) {
      const customers = await stripe.customers.list({ email: email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email,
          name: name || 'ExperiaHub Member',
        });
        customerId = newCustomer.id;
      }
    }

    // 2. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment', // Changed to payment for one-time price, use 'subscription' if recurring
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments`,
      metadata: {
        source: 'experiahub_app'
      }
    });

    return NextResponse.json({
      url: session.url
    });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
