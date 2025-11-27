import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxy: Forwarding request to n8n');
    console.log('Proxy: Request body:', body);

    const response = await fetch('https://n8n.isotope-blue.com/webhook/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Proxy: n8n response status:', response.status);
    
    const responseText = await response.text();
    console.log('Proxy: n8n response text:', responseText);

    if (!response.ok) {
      console.error('Proxy: n8n returned error status:', response.status);
      return NextResponse.json(
        { error: `n8n error: ${response.status}` },
        { status: response.status }
      );
    }

    // Handle empty response
    if (!responseText || responseText.trim() === '') {
      console.log('Proxy: Empty response from n8n');
      return NextResponse.json({
        success: false,
        error: 'Empty response from n8n'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Proxy: Failed to parse n8n response as JSON:', e);
      console.error('Proxy: Raw response text:', responseText);
      
      // If it's not JSON, return it as a plain text response
      return NextResponse.json({
        success: true,
        response: responseText
      });
    }

    console.log('Proxy: Parsed n8n response:', data);
    
    // Handle different response formats from n8n
    if (data.success && data.response) {
      // Standard format: { success: true, response: "..." }
      return NextResponse.json(data);
    } else if (data.output) {
      // Direct output format: { output: "..." }
      return NextResponse.json({
        success: true,
        response: data.output
      });
    } else if (typeof data === 'string') {
      // Plain string response
      return NextResponse.json({
        success: true,
        response: data
      });
    } else if (data.success === false) {
      // Error response
      return NextResponse.json(data);
    } else {
      // Unknown format, return as-is
      console.log('Proxy: Unknown response format, returning as-is');
      return NextResponse.json({
        success: true,
        response: JSON.stringify(data)
      });
    }
    
  } catch (error) {
    console.error('Proxy: Error forwarding request to n8n:', error);
    return NextResponse.json(
      { error: 'Failed to connect to chat service' },
      { status: 500 }
    );
  }
} 