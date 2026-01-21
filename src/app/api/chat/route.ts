import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch('https://n8n.isotope-blue.com/webhook/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `n8n error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    let text = data.output || data.response || '';
    let experiences = data.experiences || [];

    // Robust Backend Synthesis if experiences array is empty
    if (experiences.length === 0 && text) {
      const items: any[] = [];
      const re = /(?:^|\n|\s)(\d{1,2})\.\s*([\s\S]+?)(?=(?:\n\s*\d{1,2}\.\s*)|$)/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) && items.length < 5) {
        const part = match[2].trim();
        const firstLine = part.split('\n')[0].trim();
        const title = firstLine || 'Experience';
        const cityMatch = part.match(/\(([^)]+)\)/);
        const city = cityMatch?.[1]?.trim() || '';
        const durMatch = part.match(/(\d+(?:\.\d+)?)\s*hours?/i);
        const duration = durMatch?.[0] || '';
        const summaryPart = part.split(/–|\u2013|•/).slice(1).join(' ').trim();
        const summary = summaryPart || part;
        items.push({ title, city, duration, summary, source: 'AI Synthesis' });
      }
      experiences = items;
    }

    // Persist synthesized experiences to Supabase to get real IDs
    if (experiences.length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const processed = await Promise.all(experiences.map(async (exp: any) => {
        // Try to find existing by title and city
        const { data: existing } = await supabase
          .from('experiences')
          .select('id, bokun_product_id')
          .eq('title', exp.title)
          .maybeSingle();

        if (existing) {
          return { ...exp, id: existing.id, bokunProductId: existing.bokun_product_id };
        }

        // If not found, we could insert, but let's at least ensure they have a stable temporary ID 
        // or a marker that they need mapping.
        return { ...exp, id: exp.id || `temp_${Math.random().toString(36).substr(2, 9)}` };
      }));
      experiences = processed;
    }

    return NextResponse.json({
      success: true,
      response: text,
      experiences,
      cta: data.cta || null
    });
    
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
 