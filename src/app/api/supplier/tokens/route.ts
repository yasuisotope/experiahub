import { NextResponse } from 'next/server';

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_API_URL || '';
const API_KEY = process.env.SUPPLIER_TOKENS_API_KEY || '';

export async function POST(request: Request) {
  if (!API_KEY) {
    console.error('Missing SUPPLIER_TOKENS_API_KEY env var');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    let endpoint = '';
    // Using the specific UUID path found by the user
    const WEBHOOK_UUID = 'ce795c81-bfb0-4400-a25f-8dcb67d6f89e';
    
    switch (action) {
      case 'list': endpoint = `/webhook/${WEBHOOK_UUID}/supplier/user/tokens/list`; break;
      case 'create': endpoint = `/webhook/${WEBHOOK_UUID}/supplier/user/tokens/create`; break;
      case 'delete': endpoint = `/webhook/${WEBHOOK_UUID}/supplier/user/tokens/delete`; break;
      default: return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const url = `${N8N_BASE}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error: any) {
    console.error('Token proxy error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Proxy failed' }, { status: 500 });
  }
}
