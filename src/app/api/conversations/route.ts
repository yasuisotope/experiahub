import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const limit = searchParams.get('limit') || '10';

    // Call the n8n workflow to get recent conversations
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.isotope-blue.com';
    const response = await fetch(`${n8nUrl}/webhook/conversations?userId=${userId}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`n8n returned status: ${response.status}`);
      // Return empty conversations instead of error
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    
    // Ensure we always return a valid response
    if (!data.success) {
      console.error('n8n returned error:', data);
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Return empty conversations instead of error
    return NextResponse.json(
      { 
        success: true, 
        conversations: [],
        total: 0,
        timestamp: new Date().toISOString()
      }
    );
  }
} 