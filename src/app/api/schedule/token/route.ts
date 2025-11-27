import { NextRequest, NextResponse } from 'next/server';
import { encryptPayload } from '@/lib/secureToken';

// Simple in-memory rate limiter (per runtime instance)
type Bucket = { count: number; resetAt: number };
const rlBuckets: Map<string, Bucket> = new Map();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LIMIT = 50; // 50 requests per window

function getClientKey(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for') || '';
  const xr = req.headers.get('x-real-ip') || '';
  const ip = (xf.split(',')[0]?.trim()) || xr || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const b = rlBuckets.get(key);
  if (!b || b.resetAt < now) {
    rlBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= LIMIT) return false;
  b.count += 1;
  return true;
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.experiahub.com';
  const allow = origin && origin === allowed ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    Vary: 'Origin'
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const key = getClientKey(req);
    if (!checkRateLimit(key)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: corsHeaders(req) });
    }
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization' }, { status: 401, headers: corsHeaders(req) });
    }
    const wpToken = auth.split(' ')[1];
    // Optional JSON body: { ttlHours?: number }
    let ttlHours = 24 * 7; // default 7 days
    try {
      const body = await req.json().catch(() => null);
      const n = Number(body?.ttlHours);
      if (Number.isFinite(n) && n > 0 && n <= 24 * 180) {
        ttlHours = Math.floor(n);
      }
    } catch {}
    const now = Date.now();
    const exp = now + 1000 * 60 * 60 * ttlHours;
    const token = encryptPayload({ wpToken, exp, iat: now });
    return NextResponse.json({ token }, { status: 200, headers: corsHeaders(req) });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to mint token' }, { status: 500 });
  }
}


