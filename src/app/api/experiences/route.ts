import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all experiences from Supabase
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('[API] Supabase fetch error:', error);
      return NextResponse.json({ error: 'Database request failed', details: error.message }, { status: 502 });
    }

    const items = (data || []).map(row => {
      // Robust image retrieval (Source of Truth Strategy)
      const structured = row.photos_drive_urls || [];
      let raw: any = {};
      try {
        raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : (row.raw_data || {});
        if (typeof raw === 'string') raw = JSON.parse(raw);
      } catch (e) {}
      const rawPhotos = raw?.photosDriveUrls || [];
      
      const isFinal = (list: string[]) => list.length > 0 && !list.some(u => u.includes('anyoneWithLink'));
      
      let photos = structured;
      if (isFinal(structured)) photos = structured;
      else if (isFinal(rawPhotos)) photos = rawPhotos;
      else {
        photos = structured.length > 0 ? structured : rawPhotos;
      }

      // Map Supabase columns to existing frontend type
      return {
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
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export const revalidate = 0;
