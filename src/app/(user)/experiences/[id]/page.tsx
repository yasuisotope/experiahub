'use client';

import { useEffect, useState } from 'react';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, prefetchBackgroundImage, setUserBackground, trackDownload, getCuratedBackgrounds, type PortalBackground } from '@/services/backgroundService';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Chip, CircularProgress, Popover, Stack, TextField, Button, Skeleton } from '@mui/material';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import Fab from '@mui/material/Fab';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import BokunBookingWidget from '@/components/BokunBookingWidget';

type Experience = {
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

export default function ExperiencePage() {
  const params = useParams();
  const [experience, setExperience] = useState<Experience | null>(null);
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
  const [isTranslucent, setIsTranslucent] = useState(true);

  useEffect(() => {
    const handler = (e: CustomEvent) => setIsTranslucent(e.detail.isTransparent);
    window.addEventListener('ui:transparency', handler as any);
    return () => window.removeEventListener('ui:transparency', handler as any);
  }, []);

  useEffect(() => {
    const fetchExperience = async () => {
      // ... logic unchanged ...
      try {
        setLoading(true);
        const response = await fetch(`/api/experiences/${params.id}`, { 
          cache: 'no-store' 
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load experience');
        }
        
        setExperience(data.experience);
      } catch (err: any) {
        setError(err?.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExperience();
    }
  }, [params.id]);

  // ... (keeping other effects) ...

  // Skipping to Return JSX update for brevity of this instruction if possible, but replace tool needs exact match.
  // I will just construct the replacements at the top and the return.
  
  // Actually, I can replace the WHOLE top part.
  
  // But let's stay safer.
  // I will just add state at top.
  
  // And replace return below.
  // This tool call is for STATE insertion.
  
  useEffect(() => {
    const fetchExperience = async () => {
      // ...
    }
    // ...
  }, [params.id]);

// Wait, I can't insert easily without matching context.
// I will target the `const [bgSeed` line and `useEffect` block.


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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: 'rgba(74, 124, 140, 0.9)' }} />
      </Box>
    );
  }

  if (error || !experience) {
    return (
      <Box sx={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <Typography color="error" variant="h6">
          {error || 'Experience not found'}
        </Typography>
      </Box>
    );
  }

  return (
    <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: '0 16px', height: '100%', overflowY: 'auto', bgcolor: isTranslucent ? 'rgba(255, 255, 255, 0.6)' : '#fff', backdropFilter: isTranslucent ? 'blur(12px)' : 'none', borderRadius: '16px' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4, pt: 4 }}>
        {/* Experience Details */}
        <Paper sx={{ p: 3, height: 'fit-content', borderRadius: '16px' }}>
          <Typography variant="h4" sx={{ mb: 2, fontFamily: 'Urbanist', color: '#010057', fontWeight: 500 }}>
            {experience.title}
          </Typography>
          
          {experience.images?.[0]?.url && (
            <Box sx={{ mb: 3 }}>
              <img
                src={experience.images[0].url}
                alt={experience.title}
                style={{
                  width: '100%',
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 16,
                }}
              />
            </Box>
          )}

          <Typography variant="body1" sx={{ mb: 3, color: '#666', lineHeight: 1.6, fontFamily: 'Urbanist' }}>
            {experience.summary}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {experience.city && (
              <Chip 
                label={experience.city} 
                variant="outlined" 
                sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.2)', fontFamily: 'Urbanist' }}
              />
            )}
            {experience.category && (
              <Chip 
                label={experience.category} 
                variant="outlined"
                sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.2)', fontFamily: 'Urbanist' }}
              />
            )}
            {experience.duration && (
              <Chip 
                label={`${experience.duration}h`} 
                variant="outlined"
                sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.2)', fontFamily: 'Urbanist' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#010057', fontFamily: 'Urbanist', fontWeight: 500 }}>
              {experience.price ? `${experience.currency} ${experience.price}` : 'Price TBA'}
            </Typography>
            <Chip 
              label={experience.status} 
              color={experience.status === 'Active' ? 'success' : 'warning'}
              size="small"
              sx={{ fontFamily: 'Urbanist' }}
            />
          </Box>
        </Paper>

        {/* Booking Widget */}
        <Paper sx={{ p: 3, borderRadius: '16px' }}>
          <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Urbanist', fontWeight: 500, color: '#010057' }}>
            Book This Experience
          </Typography>
          
          {process.env.NEXT_PUBLIC_BOKUN_DISABLED === '0' && experience.bokunProductId ? (
            <BokunBookingWidget 
              productId={experience.bokunProductId}
              onError={(error) => console.error('Booking widget error:', error)}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 400,
              backgroundColor: '#f8f9fa',
              borderRadius: 1,
              border: '1px solid #dee2e6'
            }}>
              <Typography variant="body2" color="text.secondary">
                {process.env.NEXT_PUBLIC_BOKUN_DISABLED === '1' 
                  ? 'Booking integration coming soon'
                  : 'Booking widget not available for this experience'
                }
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
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