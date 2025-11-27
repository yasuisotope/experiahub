import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiKey: process.env.BOKUN_API_KEY ? 'Set' : 'Not set',
    apiSecret: process.env.BOKUN_API_SECRET ? 'Set' : 'Not set',
    baseUrl: process.env.BOKUN_BASE_URL || 'Not set',
  });
}