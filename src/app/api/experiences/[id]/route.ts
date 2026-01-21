import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experienceId = params.id;
    
    if (!experienceId) {
      return NextResponse.json(
        { error: 'Experience ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch specific record by ID
    const { data: row, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('id', experienceId)
      .maybeSingle();

    if (error) {
      console.error('[API] Supabase fetch error:', error);
      return NextResponse.json({ error: 'Database request failed', details: error.message }, { status: 502 });
    }

    if (!row) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }

    // Robust image retrieval (Source of Truth Strategy)
    const structured = row.photos_drive_urls || [];
    let raw: any = {};
    try {
      raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : (row.raw_data || {});
      if (typeof raw === 'string') raw = JSON.parse(raw);
    } catch (e) {}
    const rawPhotos = raw?.photosDriveUrls || [];
    
    // Helper to check for finalize status
    const isFinal = (list: string[]) => list.length > 0 && !list.some(u => u.includes('anyoneWithLink'));
    
    let photos = structured;
    if (isFinal(structured)) photos = structured;
    else if (isFinal(rawPhotos)) photos = rawPhotos;
    else {
      // Fallback to whichever has content
      photos = structured.length > 0 ? structured : rawPhotos;
    }

    const experience = {
      id: row.id,
      bokunProductId: row.bokun_product_id || (row.external_id?.startsWith('BOK-') ? row.external_id : ''),
      title: row.title || '',
      summary: row.description || row.summary || '',
      city: row.city || '',
      duration: row.duration_minutes ? row.duration_minutes / 60 : 0,
      price: row.min_retail_price || row.price || 0,
      currency: row.currency || 'USD',
      url: row.booking_link || '',
      status: row.status || 'Active',
      images: photos.map((url: string) => ({ url })),
      photos: photos,
      videos: (row.video_urls || (raw?.videoUrls as string[]) || []),
      category: row.category || '',
      metadata: {
        difficulty: row.difficulty,
        requirements: row.requirements,
        cancellation: row.cancellation_policy || '24h before',
        source: row.source || 'Bokun'
      }
    };

    return NextResponse.json({ experience });
  } catch (error: any) {
    console.error('Error fetching experience:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 