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

  // Determine the N8N base URL from env vars or fallback
  let n8nBase = process.env.NEXT_PUBLIC_N8N_API_URL || process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
  
  // Remove trailing slashes and '/webhook' suffix to get the root base
  // e.g. https://n8n.isotope-blue.com/webhook -> https://n8n.isotope-blue.com
  let baseUrl = n8nBase.replace(/\/$/, '');
  if (baseUrl.endsWith('/webhook')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - '/webhook'.length);
  }

  // Construct the target URL. Note: The path is /media/unsplash/search
  const targetUrl = `${baseUrl}/media/unsplash/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(`Upstream fetch failed with status ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Unsplash Proxy] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
