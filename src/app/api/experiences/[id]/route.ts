import { NextRequest, NextResponse } from 'next/server';

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

    const BASE_ID = getEnv('AIRTABLE_BASE_ID');
    const TABLE_ID = getEnv('AIRTABLE_TABLE_ID');
    const TOKEN = getEnv('AIRTABLE_TOKEN');

    // Fetch specific record by ID
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_ID)}/${experienceId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Experience not found' },
          { status: 404 }
        );
      }
      const text = await response.text();
      return NextResponse.json(
        { error: 'Airtable request failed', status: response.status, body: text },
        { status: 502 }
      );
    }

    const record: AirtableRecord = await response.json();
    const fields = record.fields || {};

    const experience = {
      id: record.id,
      bokunProductId: String(fields.bokunProductId ?? ''),
      title: fields.title ?? '',
      summary: fields.summary ?? '',
      city: fields.city ?? '',
      duration: Number(fields.Duration ?? 0),
      price: Number(fields.Price ?? 0),
      currency: String(fields.Currency ?? 'USD'),
      url: fields['Booking Link'] ?? '',
      status: fields.Status ?? 'Active',
      images: Array.isArray(fields.Images) ? fields.Images : [],
      category: fields.Category ?? '',

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