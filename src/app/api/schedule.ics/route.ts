import { NextRequest, NextResponse } from 'next/server';
import { decryptPayload } from '@/lib/secureToken';

// Lightweight CORS
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.experiahub.com';
  const allow = origin && origin === allowed ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    Vary: 'Origin'
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

type Item = { id: string; title: string; startISO: string; endISO: string; location?: string; details?: string };

function toGoogleDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeICS(s: string) {
  return s.replace(/\\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const from = searchParams.get('from') || new Date().toISOString().slice(0, 10);
    const to = searchParams.get('to');

    let authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      const data = decryptPayload(token);
      if (!data || !data.wpToken || !data.exp || Date.now() > Number(data.exp)) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders(req) });
      }
      // Check per-user revocation timestamp via n8n
      try {
        const revBase = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
        const revRes = await fetch(`${revBase}/schedule/revocation/get`, {
          headers: { Authorization: `Bearer ${data.wpToken}` },
          cache: 'no-store'
        });
        if (revRes.ok) {
          const rev = await revRes.json();
          const revokedAfter = Number(rev?.revokedAfter);
          const iat = Number(data.iat || 0);
          if (Number.isFinite(revokedAfter) && revokedAfter > 0 && iat <= revokedAfter) {
            return NextResponse.json({ error: 'Token revoked' }, { status: 401, headers: corsHeaders(req) });
          }
        }
      } catch {}
      authHeaders.Authorization = `Bearer ${data.wpToken}`;
    }
    const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
    const qs = new URLSearchParams({ from, ...(to ? { to } : {}) }).toString();
    const res = await fetch(`${base}/schedule?${qs}`, {
      headers: authHeaders,
      cache: 'no-store'
    });
    const items: Item[] = res.ok ? await res.json() : [];

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ExperiaHub//Schedule Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    const now = toGoogleDate(new Date().toISOString());
    for (const ev of items) {
      const uid = `${ev.id}@experiahub.com`;
      const dtStart = toGoogleDate(ev.startISO);
      const dtEnd = toGoogleDate(ev.endISO);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${escapeICS(ev.title)}`);
      if (ev.location) lines.push(`LOCATION:${escapeICS(ev.location)}`);
      if (ev.details) lines.push(`DESCRIPTION:${escapeICS(ev.details)}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');

    const body = lines.join('\r\n');
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="experiahub-schedule.ics"',
        ...corsHeaders(req)
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate ICS' }, { status: 500 });
  }
}


