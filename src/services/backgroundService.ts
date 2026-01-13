export type PortalBackground = {
  id?: string; // unsplash id
  url?: string; // chosen image url (regular/full)
  thumbUrl?: string; // small thumb for previews
  color?: string;
  lqip?: string; // optional data URL for blur placeholder
  authorName?: string;
  authorUrl?: string;
  linkHtml?: string; // unsplash photo url
};

// Use local proxy for all N8N calls
const N8N_BASE = '/api/n8n';

export async function searchUnsplash(query: string, page = 1, perPage = 30): Promise<any[]> {
  try {
    // Access 'media' endpoint - check if our proxy handles non-webhook paths?
    // The current proxy appends '/webhook'. Unsplash is at /media... NOT /webhook/media?
    // Wait, previous logs showed: 'https://n8n.isotope-blue.com/media/unsplash/search'
    // My proxy forces '/webhook' suffix. I need to ADJUST the proxy or use the Unsplash dedicated Route.
    // I will keep the Unsplash dedicated route /api/unsplash for simplicity + correctness.
    const res = await fetch(`/api/unsplash?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`);
    if (!res.ok) throw new Error(`Unsplash proxy error: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.error('searchUnsplash error:', err);
    return [];
  }
}

export async function getUserBackground(token: string | null): Promise<PortalBackground | null> {
  if (!token) return null;
  const res = await fetch(`${N8N_BASE}/auth/user/background/get`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return (data?.background || null) as PortalBackground | null;
}

export async function setUserBackground(token: string | null, background: PortalBackground | null): Promise<boolean> {
  if (!token) return false;
  const res = await fetch(`${N8N_BASE}/auth/user/background/set`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ background })
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return !!(data?.success ?? data?.ok);
}

export async function trackDownload(id: string): Promise<void> {
  try {
    if (!id) return;
    await fetch(`${N8N_BASE}/media/unsplash/track-download?id=${encodeURIComponent(id)}`, { method: 'POST' });
  } catch (e) {
    console.error('TrackDownload error:', e);
  }
}

export function loadCachedBackground(userId?: string | null): PortalBackground | null {
  try {
    const key = `portal_bg:${userId || 'anon'}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PortalBackground) : null;
  } catch (e) {
    console.error('Error loading cached background:', e);
    return null;
  }
}

export function saveCachedBackground(bg: PortalBackground | null, userId?: string | null): void {
  try {
    const key = `portal_bg:${userId || 'anon'}`;
    if (!bg) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(bg));
    }
  } catch {}
}

// Curated default backgrounds (no backend required). Attribution is optional here; overlay hides when missing.
export function getCuratedBackgrounds(): PortalBackground[] {
  // 9 distinct scenic images (landscapes/water/cities) sized for backgrounds
  const items: Array<{ url: string; thumb: string }> = [
    { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1494475673543-6a6a27143b22?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1494475673543-6a6a27143b22?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1526779259212-756e5d5d7a48?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1526779259212-756e5d5d7a48?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1519608425089-7f3bfa6f6bb8?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1519608425089-7f3bfa6f6bb8?q=50&w=400&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=50&w=400&auto=format&fit=crop' }
  ];
  // Always return a shuffled copy to avoid same two placeholders showing
  return items
    .filter((x) => x.url && x.thumb)
    .slice()
    .sort(() => Math.random() - 0.5)
    .map((x) => ({ url: x.url, thumbUrl: x.thumb }));
}

export function prefetchBackgroundImage(url?: string): void {
  try {
    if (!url) return;
    const img = new Image();
    img.src = url;
  } catch {}
}


