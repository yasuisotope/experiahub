import { NextResponse } from 'next/server';

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

const FIELDS = [
  'bokunProductId',
  'title',
  'summary',
  'city',
  'Duration',
  'Price',
  'Currency',
  'Booking Link',
  'Status',
  'Images',
  'Category'
];

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function GET() {
  try {
    const BASE_ID = getEnv('AIRTABLE_BASE_ID');
    const TABLE_ID = getEnv('AIRTABLE_TABLE_ID');
    const TOKEN = getEnv('AIRTABLE_TOKEN');

    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}`);
    FIELDS.forEach(f => url.searchParams.append('fields[]', f));
    url.searchParams.append('sort[0][field]', 'title');
    url.searchParams.append('sort[0][direction]', 'asc');
    url.searchParams.append('maxRecords', '50');

    const r = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      // Keep fresh while we're iterating
      cache: 'no-store',
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: 'Airtable request failed', status: r.status, body: text }, { status: 502 });
    }

    const j = await r.json();
    const items = (j.records as AirtableRecord[] | undefined)?.map(rec => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        bokunProductId: String(f.bokunProductId ?? ''),
        title: f.title ?? '',
        summary: f.summary ?? '',
        city: f.city ?? '',
        duration: Number(f.Duration ?? 0),
        price: Number(f.Price ?? 0),
        currency: String(f.Currency ?? 'USD'),
        url: f['Booking Link'] ?? '',
        status: f.Status ?? 'Active',
        images: Array.isArray(f.Images) ? f.Images : [],
        category: f.Category ?? '',

      };
    }) ?? [];

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export const revalidate = 0; // no cache by default while developing

