import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Reconstruct the path (e.g., "supplier/onboarding/save")
  const path = params.path.join('/');
  
  // 2. Get the Query String
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';

  // 3. Determine N8N Target Base URL
  // We want to target the /webhook endpoint base by default for these calls
  let n8nEnv = process.env.NEXT_PUBLIC_N8N_API_URL || process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
  
  // Guard: If Env Var points to the broken 'experiahub.com' N8N, force the working one.
  if (n8nEnv.includes('n8n.experiahub.com')) {
      n8nEnv = 'https://n8n.isotope-blue.com/webhook';
  }
  
  // Normalization: Ensure n8nEnv ends with /webhook if the proxy logic expects it.
  let targetBase = n8nEnv.replace(/\/$/, '');
  if (!targetBase.endsWith('/webhook')) {
      targetBase += '/webhook';
  }

  const targetUrl = `${targetBase}/${path}${queryString}`;

  try {
    // 4. Prepare Headers (Forward Authorization, Content-Type)
    const headers = new Headers();
    const authHeader = request.headers.get('authorization');
    if (authHeader) headers.set('Authorization', authHeader);
    
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    // 5. Prepare Body (if not GET/HEAD)
    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const blob = await request.blob();
      body = blob; 
    }

    // 6. Execute Request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // Important: catch-all proxy shouldn't cache by default usually
      cache: 'no-store'
    });

    // 7. Return Response
    // We need to return the upstream status and data
    const data = await response.arrayBuffer(); // use arrayBuffer to handle binary or json
    
    // Forward response headers if needed (optional, but good for content-type)
    const responseHeaders = new Headers();
    if (response.headers.get('content-type')) {
        responseHeaders.set('content-type', response.headers.get('content-type')!);
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (e: any) {
    console.error('[N8N Proxy] Error:', e);
    return NextResponse.json({ error: 'Proxy failed', details: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: any) { return proxyRequest(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return proxyRequest(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return proxyRequest(req, ctx); }
export async function PATCH(req: NextRequest, ctx: any) { return proxyRequest(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return proxyRequest(req, ctx); }
