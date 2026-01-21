'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Stack, Button, MenuItem, Select, FormControl, InputLabel, TextField, Snackbar, Alert, Tooltip, Popover, Skeleton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserProfile from '@/components/profile/UserProfile';
import { useWordPressAuth } from '@/contexts/WordPressContext';

import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, prefetchBackgroundImage, setUserBackground, trackDownload, getCuratedBackgrounds, type PortalBackground } from '@/services/backgroundService';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import Fab from '@mui/material/Fab';
import ClearIcon from '@mui/icons-material/Clear';
import IconBtn from '@mui/material/IconButton';

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn } = useWordPressAuth();
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [ttlHours, setTtlHours] = useState<number>(24 * 7);
  const [token, setToken] = useState<string>('');
  const [copySnack, setCopySnack] = useState<{open:boolean,message:string,severity:'success'|'error'}>({open:false,message:'',severity:'success'});
  const [history, setHistory] = useState<Array<{token:string, issuedAt:number, expiresAt:number}>>([]);
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

  const icsUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.experiahub.com';
    return token ? `${base}/api/schedule.ics?token=${encodeURIComponent(token)}` : '';
  }, [token]);

  const mintToken = async () => {
    try {
      const wpToken = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      if (!wpToken) throw new Error('Not authenticated');
      const res = await fetch('/api/schedule/token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${wpToken}` },
        body: JSON.stringify({ ttlHours })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setToken(String(data.token || ''));
      // Append to history UI (client-side only, server stores via n8n in the future)
      setHistory((h)=>[{ token: String(data.token||''), issuedAt: Date.now(), expiresAt: Date.now()+ttlHours*3600*1000 }, ...h].slice(0,20));
      setCopySnack({open:true,message:'Token generated',severity:'success'});
    } catch (e:any) {
      setCopySnack({open:true,message:e?.message||'Failed to generate token',severity:'error'});
    }
  };

  const listHistory = async () => {
    try {
      const wpToken = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      if (!wpToken) return;
      const res = await fetch('/api/supplier/revocation/get', { headers: { Authorization: `Bearer ${wpToken}` } });
      // Placeholder: backend could return actual history later; for now we keep local-only
    } catch {}
  };

  const revokeOne = async (tok: string) => {
    try {
      // Temporary UX: local hide. Server supports revoke-all today; per-token revoke to be added later in n8n
      setHistory((h)=>h.filter(x=>x.token!==tok));
      setCopySnack({open:true,message:'Token removed locally (server will support per-token revoke soon)',severity:'success'});
    } catch {}
  };

  useEffect(()=>{ listHistory(); }, []);

  const copyUrl = async () => {
    try {
      if (!icsUrl) throw new Error('Generate a token first');
      await navigator.clipboard.writeText(icsUrl);
      setCopySnack({open:true,message:'Subscription URL copied',severity:'success'});
    } catch (e:any) {
      setCopySnack({open:true,message:e?.message||'Copy failed',severity:'error'});
    }
  };

  const revokeAll = async () => {
    try {
      const wpToken = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      if (!wpToken) throw new Error('Not authenticated');
      const res = await fetch((process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook') + '/schedule/revocation/set', {
        method: 'POST',
        headers: { Authorization: `Bearer ${wpToken}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d?.error || 'Failed to revoke');
      }
      setToken('');
      setCopySnack({open:true,message:'All previous tokens revoked',severity:'success'});
    } catch (e:any) {
      setCopySnack({open:true,message:e?.message||'Revocation failed',severity:'error'});
    }
  };

  useEffect(() => {
    const loadBg = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
        const cached = loadCachedBackground('user');
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) { setBg(server); saveCachedBackground(server, 'user'); }
      } catch {}
    };
    loadBg();
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
      } finally {
        setBgLoading(false);
      }
    })();
  }, [bgAnchorEl, bgSeed, bgSearch]);

  return (
    <ProtectedRoute>
      <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
      <>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            maxWidth: 800,
            mx: 'auto',
            bgcolor: isTranslucent ? 'rgba(255, 255, 255, 0.6)' : '#fff',
            backdropFilter: isTranslucent ? 'blur(12px)' : 'none',
            overflowY: 'hidden',
			borderRadius: '16px', // Standardize corners
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton 
              onClick={() => router.back()}
              sx={{ mr: 2, color: '#010057' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ color: '#010057', fontFamily: 'Urbanist', fontWeight: 500 }}>
              Edit Profile
            </Typography>
          </Box>
          <UserProfile />

          <Paper elevation={0} sx={{ mt: 3, p: 2, border: '1px solid rgba(1,0,87,0.12)', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Urbanist', color: '#010057', fontWeight: 500 }}>Calendar</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="ttl-label">Token Expiry</InputLabel>
                <Select labelId="ttl-label" label="Token Expiry" value={ttlHours} onChange={(e)=>setTtlHours(Number(e.target.value))}>
                  <MenuItem value={24}>24 hours</MenuItem>
                  <MenuItem value={24*7}>7 days</MenuItem>
                  <MenuItem value={24*30}>30 days</MenuItem>
                  <MenuItem value={24*90}>90 days</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Creates a private, expiring token for your ICS feed">
                <Button variant="contained" onClick={mintToken} sx={{ bgcolor: '#010057' }}>Generate token</Button>
              </Tooltip>
              <Tooltip title="Use this URL in Google (From URL) or Apple (Subscribe)">
                <Button variant="outlined" onClick={copyUrl} disabled={!token}>Copy subscription URL</Button>
              </Tooltip>
              <Button color="error" variant="outlined" onClick={revokeAll}>Revoke all tokens</Button>
            </Stack>
            <TextField fullWidth size="small" sx={{ mt: 2 }} value={icsUrl} label="Subscription URL (.ics)" InputProps={{ readOnly: true }} />
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>Add to Google Calendar: Settings → Add calendar → From URL. Apple Calendar: File → New Calendar Subscription.</Typography>
            {history.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontFamily: 'Urbanist', color: '#010057', mb: 1 }}>Issued Tokens</Typography>
                {history.map((h, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.token}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                      Exp: {new Date(h.expiresAt).toLocaleString()}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={()=>revokeOne(h.token)}>Remove</Button>
                  </Stack>
                ))}
              </Box>
            )}
          </Paper>
          <Snackbar open={copySnack.open} autoHideDuration={3000} onClose={()=>setCopySnack(s=>({...s,open:false}))}>
            <Alert severity={copySnack.severity} onClose={()=>setCopySnack(s=>({...s,open:false}))}>{copySnack.message}</Alert>
          </Snackbar>
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
                      <IconBtn size="small" aria-label="Clear" onClick={() => { setBgSearch(''); setBgResults([]); setBgPage(1); setBgSeed(s => s + 1); }}>
                        <ClearIcon fontSize="small" />
                      </IconBtn>
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
      </>
      </BackgroundImage>
    </ProtectedRoute>
  );
}