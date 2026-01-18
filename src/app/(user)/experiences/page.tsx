'use client';

import { useEffect, useState } from 'react';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, prefetchBackgroundImage, setUserBackground, trackDownload, getCuratedBackgrounds, type PortalBackground } from '@/services/backgroundService';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Fab from '@mui/material/Fab';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

type Exp = {
  id: string;
  bokunProductId: string;
  title: string;
  summary: string;
  city: string;
  duration: number;
  price: number;
  currency: string;
  url: string;
  status: string;
  images: { url?: string }[];
  category?: string;
};

export default function ExperiencesPage() {
  const [items, setItems] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [bgAnchorEl, setBgAnchorEl] = useState<HTMLElement | null>(null);
  const [bgSearch, setBgSearch] = useState<string>('');
  const [bgResults, setBgResults] = useState<any[]>([]);
  const [bgLoading, setBgLoading] = useState<boolean>(false);
  const [bgPage, setBgPage] = useState<number>(1);
  const [bgLoadingMore, setBgLoadingMore] = useState<boolean>(false);
  const [bgSeed, setBgSeed] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/experiences', { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Failed to load');
        setItems(j.items || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cached = loadCachedBackground('user');
        if (cached) setBg(cached);
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
        const remote = await getUserBackground(token);
        if (remote) { setBg(remote); saveCachedBackground(remote, 'user'); }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!bgAnchorEl) return;
      if (bgSearch.trim()) return;
      try {
        setBgLoading(true);
        const topics = ['nature','city','ocean','mountains','forest','sky','beach','night','sunset','architecture'];
        const q = topics[Math.floor(Math.random() * topics.length)];
        const results = await searchUnsplash(q, 1, 30);
        setBgResults(Array.isArray(results) ? results : []);
        setBgPage(1);
      } finally { setBgLoading(false); }
    })();
  }, [bgAnchorEl, bgSeed, bgSearch]);

  return (
    <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
    <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px', height: '100dvh', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderRadius: 8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Experiences</h1>
      {process.env.NEXT_PUBLIC_BOKUN_DISABLED === '1' && (
        <div style={{ background: '#FFF6EC', color: '#9f5c00', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          Booking API activation in progress. Experience data is synchronized with the Supplier Portal.
        </div>
      )}
      {process.env.NEXT_PUBLIC_BOKUN_DISABLED === '0' && (
        <div style={{ background: '#E6F4EA', color: '#1e7e34', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          ✓ Bokun integration active. Real-time availability and booking available.
        </div>
      )}
      {loading && <div>Loading experiences…</div>}
      {!loading && error && (
        <div style={{ color: '#c92a2a' }}>{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <div>No experiences yet.</div>
      )}
      <div style={{ display: 'grid', gap: 16 }}>
        {items.map((x) => (
          <a
            key={x.id}
            href={`/experiences/${x.id}`}
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: '#fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              textDecoration: 'none',
              color: '#333',
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              {x.images?.[0]?.url ? (
                <img
                  src={x.images[0].url as string}
                  alt={x.title}
                  width={140}
                  height={88}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div style={{ width: 140, height: 88, background: '#F0F4F6', borderRadius: 8 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{x.title || 'Untitled'}</div>
                <div style={{ fontSize: 13, color: '#666', margin: '6px 0 10px' }}>{x.summary}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
                  <span>{x.city || '—'}</span>
                  <span>•</span>
                  <span>{x.duration ? `${x.duration}h` : '—'}</span>
                  <span>•</span>
                  <span>{x.price ? `${x.currency} ${x.price}` : 'Price TBA'}</span>
                  <span style={{ marginLeft: 'auto', color: x.status === 'Active' ? '#2f9e44' : '#e8590c' }}>{x.status}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
    <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'user'} />
    <Popover
      open={Boolean(bgAnchorEl)}
      anchorEl={bgAnchorEl}
      onClose={() => { setBgAnchorEl(null); setBgSeed(0); }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Paper
        sx={{ p: 2, width: 360, maxHeight: 420, overflowY: 'auto' }}
        onScroll={async (e:any)=>{
          try {
            if (!bgSearch.trim() || bgLoadingMore) return;
            const el = e.currentTarget as HTMLElement;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
            if (!nearBottom) return;
            setBgLoadingMore(true);
            const next = bgPage + 1;
            const more = await searchUnsplash(bgSearch.trim(), next, 30);
            const existing = new Set((bgResults||[]).map((x:any)=>x?.id));
            const merged = [...bgResults, ...more.filter((x:any)=> !existing.has(x?.id))];
            setBgResults(merged);
            setBgPage(next);
          } finally { setBgLoadingMore(false); }
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search photos"
              value={bgSearch}
              onChange={(e) => {
                const v = e.target.value;
                setBgSearch(v);
                if (!v.trim()) { setBgResults([]); setBgPage(1); setBgSeed(s => s + 1); }
              }}
              fullWidth
              InputProps={{
                endAdornment: bgSearch ? (
                  <IconButton size="small" aria-label="Clear" onClick={() => { setBgSearch(''); setBgResults([]); setBgPage(1); setBgSeed(s => s + 1); }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null
              }}
            />
            <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} onClick={async ()=>{
              try {
                setBgLoading(true);
                const results = await searchUnsplash(bgSearch.trim(), 1, 30);
                setBgResults(Array.isArray(results)?results:[]);
                setBgPage(1);
              } finally { setBgLoading(false); }
            }}>Go</Button>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {(!bgSearch.trim() && bgResults.length === 0 ? getCuratedBackgrounds().slice().sort(()=>Math.random()-0.5) : []).map((p, idx)=> (
              <Box
                key={`cur_${idx}`}
                role="button"
                tabIndex={0}
                aria-label="Use curated background"
                sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                onClick={async () => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                  const next = { url: p.url, thumbUrl: p.thumbUrl } as PortalBackground;
                  setBg(next);
                  prefetchBackgroundImage(p.url);
                  saveCachedBackground(next, 'user');
                  try { await setUserBackground(token, next); } catch {}
                  setBgAnchorEl(null);
                }}
              >
                <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block', background:'#e9eef2' }} />
              </Box>
            ))}
            {bgResults.map((p:any)=>{
              const id = p?.id; const url = p?.urls?.full || p?.urls?.regular || ''; const thumb = p?.urls?.small || p?.urls?.thumb || '';
              const authorName = p?.user?.name || ''; const authorUrl = p?.user?.links?.html || p?.user?.portfolio_url || '';
              return (
                <Box
                  key={id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Use image by ${authorName || 'author'}`}
                  sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                  onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                  onClick={async ()=>{
                    const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                    const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as PortalBackground;
                    setBg(next);
                    prefetchBackgroundImage(url);
                    saveCachedBackground(next, 'user');
                    try { await trackDownload(id); } catch (e) { console.warn('unsplash track failed', e); }
                    try { await setUserBackground(token, next); } catch {}
                    setBgAnchorEl(null);
                  }}
                >
                  <img src={thumb} alt={`Unsplash: ${p?.alt_description || authorName || 'photo'}`} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                </Box>
              );
            })}
          </Box>
          {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={60} />)}
          <Button size="small" color="error" variant="outlined" onClick={async ()=>{
            const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
            setBg(null); saveCachedBackground(null, 'user');
            try { await setUserBackground(token, null as any); } catch {}
            setBgAnchorEl(null);
          }}>Remove</Button>
        </Stack>
      </Paper>
    </Popover>
    <Fab
      color="primary"
      aria-label="Contact support"
      onClick={()=>setSupportOpen(true)}
      sx={{ position: 'fixed', right: 20, bottom: 24, zIndex: 2000, bgcolor: 'rgba(74,124,140,0.9)', '&:hover': { bgcolor: 'rgba(74,124,140,1)' } }}
    >
      <SupportAgentIcon />
    </Fab>
    <Fab
      color="default"
      aria-label="Background"
      onClick={(e)=>{ setBgSeed((s)=>s+1); setBgAnchorEl(e.currentTarget); }}
      sx={{ position: 'fixed', right: 20, bottom: 92, zIndex: 2000, bgcolor: 'rgba(255,255,255,0.9)', color: '#4a7c8c' }}
    >
      <WallpaperIcon />
    </Fab>
    </BackgroundImage>
  );
}

