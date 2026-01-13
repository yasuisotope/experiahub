import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const page = searchParams.get('page') || '1';
  const per_page = searchParams.get('per_page') || '30';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  let n8nBase = process.env.NEXT_PUBLIC_N8N_API_URL || process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
  
  if (n8nBase.includes('n8n.experiahub.com')) {
      n8nBase = 'https://n8n.isotope-blue.com/webhook';
  }

  // Ensure webhook suffix matches our expectation for Unsplash endpoint location
  if (!n8nBase.endsWith('/webhook')) {
      n8nBase += '/webhook';
  }

  const targetUrl = `${n8nBase}/media/unsplash/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
        // Return debug info
        return NextResponse.json({ 
            error: 'Unsplash Proxy Upstream Error', 
            status: res.status, 
            targetUrl // LEAK TARGET URL
        }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Unsplash Proxy] Error:', error);
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error', 
        targetUrl // LEAK TARGET URL
    }, { status: 500 });
  }
}
