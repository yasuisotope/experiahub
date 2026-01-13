import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Unsplash API Credentials
// Ideally these should be in environment variables, but hardcoding provided key for immediate fix.
const UNSPLASH_ACCESS_KEY = 'DDzXTZVCKOwOwVxQniyA4vqCTtcEaqKRoN4I2WUTfH0'; 
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const page = searchParams.get('page') || '1';
  const per_page = searchParams.get('per_page') || '30';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const targetUrl = `${UNSPLASH_API_URL}?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}`;
    
    const res = await fetch(targetUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Unsplash Logic] Upstream Error ${res.status}:`, errorText);
      return NextResponse.json({ 
          error: 'Unsplash API Error', 
          status: res.status, 
          details: errorText 
      }, { status: res.status });
    }

    const data = await res.json();
    
    // The frontend expects { results: [...] } or just [...]
    // Unsplash API returns { total: ..., total_pages: ..., results: [...] }
    // This matches the frontend expectation (data.results).
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Unsplash Logic] Internal Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
