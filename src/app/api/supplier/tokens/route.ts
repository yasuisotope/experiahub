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
    switch (action) {
      case 'list': endpoint = '/supplier/user/tokens/list'; break;
      case 'create': endpoint = '/supplier/user/tokens/create'; break;
      case 'delete': endpoint = '/supplier/user/tokens/delete'; break;
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
