'use client';

import React from 'react';
import { Box, Typography, Paper, Stack, Tabs, Tab, Button, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Drawer, ToggleButtonGroup, ToggleButton, Popover, Skeleton, Fab } from '@mui/material';
import Link from 'next/link';
import { CalendarMonth, AccessTime, LocationOn, Groups } from '@mui/icons-material';

import BackgroundImage from '@/components/BackgroundImage';
import BokunBookingWidget from '@/components/BokunBookingWidget';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, prefetchBackgroundImage, setUserBackground, trackDownload, getCuratedBackgrounds, type PortalBackground } from '@/services/backgroundService';

const upcomingBookings: Booking[] = [
  {
    id: 1,
    title: 'Kyoto Cultural Tour',
    date: '2024-08-15',
    time: '09:00 - 17:00',
    location: 'Kyoto, Japan',
    participants: 2,
    status: 'confirmed',
    price: '¥25,000',
  },
  {
    id: 2,
    title: 'Tea Ceremony Experience',
    date: '2024-08-16',
    time: '14:00 - 16:00',
    location: 'Gion District, Kyoto',
    participants: 1,
    status: 'pending',
    price: '¥8,000',
  }
];

const pastBookings: Booking[] = [
  {
    id: 3,
    title: 'Fushimi Inari Night Tour',
    date: '2024-07-20',
    time: '19:00 - 21:00',
    location: 'Fushimi Inari Shrine',
    participants: 2,
    status: 'completed',
    price: '¥12,000',
  }
];

type Booking = {
  id: number | string;
  title: string;
  date: string;
  time: string;
  location: string;
  participants: number;
  status: 'confirmed' | 'pending' | 'completed';
  price: string;
};

const BookingCard = ({ booking, isPast = false, onReschedule, onCancel, onOpen, onShare }: { booking: Booking; isPast?: boolean; onReschedule?: (b: Booking) => void; onCancel?: (b: Booking) => void; onOpen?: (b: Booking) => void; onShare?: (b: Booking) => void }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(74, 124, 140, 0.1)',
      borderRadius: 2,
      opacity: isPast ? 0.7 : 1,
      transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, opacity 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      cursor: 'pointer',
      '&:focus-visible': {
        outline: '2px solid rgba(74,124,140,0.45)',
        outlineOffset: 2,
        borderColor: 'rgba(74,124,140,0.35)'
      },
      '&:hover': {
        opacity: 1,
        backgroundColor: 'rgba(240, 248, 250, 0.6)',
        borderColor: 'rgba(74, 124, 140, 0.25)',
        boxShadow: '0 0 0 2px rgba(74,124,140,0.08) inset'
      },
    }}
    onClick={() => onOpen && onOpen(booking)}
    role="button"
    tabIndex={0}
    aria-label={`Open booking details for ${booking.title}`}
  >
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontFamily: 'Urbanist',
            fontWeight: 600,
            color: '#4A4A4A',
          }}
        >
          {booking.title}
        </Typography>
        <Typography
          sx={{
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
            fontFamily: 'Urbanist',
            fontWeight: 500,
            borderRadius: 1,
            ...(booking.status === 'confirmed' && {
              color: '#2e7d32',
              bgcolor: 'rgba(46, 125, 50, 0.1)',
            }),
            ...(booking.status === 'pending' && {
              color: '#ed6c02',
              bgcolor: 'rgba(237, 108, 2, 0.1)',
            }),
            ...(booking.status === 'completed' && {
              color: '#666666',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
            }),
          }}
        >
          {booking.status}
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {booking.date}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {booking.time}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {booking.location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Groups sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {booking.participants} {booking.participants === 1 ? 'person' : 'people'}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          sx={{
            fontSize: '1rem',
            fontFamily: 'Urbanist',
            fontWeight: 600,
            color: 'rgba(74, 124, 140, 0.9)',
          }}
        >
          {booking.price}
        </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {!isPast && booking.date && (
            <Button
              variant="text"
              size="small"
              component={Link}
              href={`/schedule?date=${encodeURIComponent(booking.date)}`}
              onClick={(e) => e.stopPropagation()}
            >
              View in Schedule
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            onClick={(e) => { e.stopPropagation(); onShare && onShare(booking); }}
          >
            Share
          </Button>
        </Stack>
      </Box>
    </Stack>
  </Paper>
);

export default function BookingsPage() {
  const [tab, setTab] = React.useState<'saved'|'upcoming'|'past'|'canceled'>('upcoming');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState<any[]>([]);
  const [upcoming, setUpcoming] = React.useState<Booking[]>(upcomingBookings);
  const [past, setPast] = React.useState<Booking[]>(pastBookings);
  const [canceled, setCanceled] = React.useState<Booking[]>([]);
  const [removeBusyId, setRemoveBusyId] = React.useState<string | number | null>(null);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error'; actionHref?: string }>({ open: false, message: '', severity: 'success' });
  const [addSchedOpen, setAddSchedOpen] = React.useState(false);
  const [selectedSaved, setSelectedSaved] = React.useState<any | null>(null);
  const [addDate, setAddDate] = React.useState('');
  const [addTime, setAddTime] = React.useState('');
  const [slotTimes, setSlotTimes] = React.useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');
  const [rescheduleSlots, setRescheduleSlots] = React.useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  // Saved filters
  const [filterCity, setFilterCity] = React.useState<string>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [priceMin, setPriceMin] = React.useState<string>('');
  const [priceMax, setPriceMax] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<'added'|'price_asc'|'price_desc'>('added');
  // Bokun widget dialog
  const [widgetOpen, setWidgetOpen] = React.useState(false);
  const [widgetProductId, setWidgetProductId] = React.useState<string | null>(null);
  // Background selection
  const [bg, setBg] = React.useState<PortalBackground | null>(null);
  const [bgAnchorEl, setBgAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [bgSearch, setBgSearch] = React.useState('');
  const [bgResults, setBgResults] = React.useState<any[]>([]);
  const [bgPage, setBgPage] = React.useState(1);
  const [bgLoading, setBgLoading] = React.useState(false);
  const [bgLoadingMore, setBgLoadingMore] = React.useState(false);
  const [bgSeed, setBgSeed] = React.useState(0);
  // Support dialog
  const [supportOpen, setSupportOpen] = React.useState(false);

  const openAddToSchedule = async (s: any) => {
    setSelectedSaved(s);
    setAddSchedOpen(true);
    setAddDate('');
    setAddTime('');
    setSlotTimes([]);
    try {
      setSlotsLoading(true);
      const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Look ahead up to 14 days for next available slot
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const res = await fetch(`${base}/supplier/bokun/availability`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ experienceId: s.experienceId || s.bokunProductId || s.id, date: dateStr })
        });
        if (res.ok) {
          const j = await res.json();
          const times: string[] = Array.isArray(j.slots) ? j.slots.map((x: any) => x.time || x.startTime || x.start || '').filter(Boolean) : [];
          if (times.length > 0) {
            setAddDate(dateStr);
            setSlotTimes(times);
            setAddTime(times[0].slice(0,5));
            break;
          }
        }
      }
    } catch {
      // silent prefill failure
    } finally {
      setSlotsLoading(false);
    }
  };

  // Load and persist filter selections
  React.useEffect(() => {
    try {
      const fc = localStorage.getItem('saved_filter_city');
      const fcat = localStorage.getItem('saved_filter_category');
      const pmin = localStorage.getItem('saved_filter_price_min');
      const pmax = localStorage.getItem('saved_filter_price_max');
      const sb = localStorage.getItem('saved_filter_sort');
      if (fc) setFilterCity(fc);
      if (fcat) setFilterCategory(fcat);
      if (pmin !== null) setPriceMin(pmin);
      if (pmax !== null) setPriceMax(pmax);
      if (sb === 'added' || sb === 'price_asc' || sb === 'price_desc') setSortBy(sb);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('saved_filter_city', filterCity);
      localStorage.setItem('saved_filter_category', filterCategory);
      localStorage.setItem('saved_filter_price_min', String(priceMin ?? ''));
      localStorage.setItem('saved_filter_price_max', String(priceMax ?? ''));
      localStorage.setItem('saved_filter_sort', sortBy);
    } catch {}
  }, [filterCity, filterCategory, priceMin, priceMax, sortBy]);

  const filteredSaved = React.useMemo(() => {
    const list = Array.isArray(saved) ? saved : [];
    return list
      .filter((s: any) => filterCity === 'all' || s.city === filterCity)
      .filter((s: any) => filterCategory === 'all' || s.category === filterCategory)
      .filter((s: any) => {
        const price = Number(s.price || 0);
        const minOk = priceMin ? price >= Number(priceMin) : true;
        const maxOk = priceMax ? price <= Number(priceMax) : true;
        return minOk && maxOk;
      })
      .sort((a: any, b: any) => {
        const pa = Number(a.price || 0);
        const pb = Number(b.price || 0);
        if (sortBy === 'price_asc') return pa - pb;
        if (sortBy === 'price_desc') return pb - pa;
        return 0;
      });
  }, [saved, filterCity, filterCategory, priceMin, priceMax, sortBy]);

  const shareBooking = async (id: number | string) => {
    try {
      const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://app.experiahub.com'}/bookings/${id}`;
      if (navigator.share) {
        await navigator.share({ title: 'ExperiaHub Booking', url });
      } else {
        await navigator.clipboard.writeText(url);
        setSnack({ open: true, message: 'Link copied to clipboard', severity: 'success' });
      }
    } catch {
      setSnack({ open: true, message: 'Unable to share. Please try again.', severity: 'error' });
    }
  };

  const fetchLists = React.useCallback(async () => {
    let alive = true;
    try {
      setLoading(true);
      const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
      const headersBase: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headersBase.Authorization = `Bearer ${token}`;
      
      // Fetch saved bookmarks
      const rSaved = await fetch(`${base}/bookmarks/list`, { headers: headersBase, cache: 'no-store' });
      if (rSaved.ok) {
        const j = await rSaved.json();
        if (alive) setSaved(Array.isArray(j) ? j : (j.items || []));
      }
      
      // Fetch user bookings from new API
      const rBookings = await fetch(`${base}/user/bookings`, { headers: headersBase, cache: 'no-store' });
      if (rBookings.ok) {
        const bookingData = await rBookings.json();
        if (alive && bookingData.success) {
          // Map bookings to Booking type
          const mapBooking = (b: any): Booking => ({
            id: b.bookingId || b.id || '',
            title: b.title || 'Experience',
            date: b.experienceDate || b.bookingDate || '',
            time: b.experienceTime || '',
            location: b.location || '',
            participants: b.participants || 1,
            status: (b.status === 'cancelled' ? 'completed' : b.status) || 'confirmed' as 'confirmed' | 'pending' | 'completed',
            price: b.totalPrice ? `${b.currency || 'USD'} ${b.totalPrice}` : ''
          });
          
          setUpcoming((bookingData.upcoming || []).map(mapBooking));
          setPast((bookingData.past || []).map(mapBooking));
          setCanceled((bookingData.bookings || []).filter((b: any) => b.status === 'cancelled').map(mapBooking));
        }
      }
    } catch {
    } finally {
      if (alive) setLoading(false);
    }
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    (async () => {
      try { await fetchLists(); } catch {}
    })();
  }, [fetchLists]);

  // Refresh Saved list when bookmarks are updated elsewhere (e.g., Chat Details)
  React.useEffect(() => {
    const handler = async () => {
      try { await fetchLists(); } catch {}
      try {
        setSnack({ open: true, message: 'Saved updated', severity: 'success' });
      } catch {}
    };
    if (typeof window !== 'undefined') window.addEventListener('bookmarks:updated', handler as EventListener);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('bookmarks:updated', handler as EventListener); };
  }, [fetchLists]);

  React.useEffect(() => {
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

  return (
    <>
      <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          maxWidth: 800,
          mx: 'auto',
          bgcolor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          overflowY: 'auto',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontSize: '2rem',
            color: '#4A4A4A',
            fontFamily: 'Cormorant Garamond',
            fontWeight: 500,
          }}
        >
          My Bookings
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, position: 'sticky', top: 0, zIndex: 5, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(74,124,140,0.08)', py: 1, px: 0.5 }}>
          <Box sx={{ display: 'inline-flex', p: 0.5, borderRadius: '999px', bgcolor: 'rgba(74,124,140,0.06)', border: '1px solid rgba(74,124,140,0.18)' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={tab}
              onChange={(_, v) => v && setTab(v)}
              sx={{
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                  borderRadius: '999px',
                  px: 1.75,
                  py: 0.5,
                  textTransform: 'none',
                  fontFamily: 'Urbanist',
                  fontSize: '0.85rem',
                color: '#4A4A4A',
                  '&:not(:first-of-type)': { ml: 0.5 },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(74,124,140,0.14)',
                    color: '#2F2F2F',
                    boxShadow: 'inset 0 0 0 1px rgba(74,124,140,0.28)'
                  },
                  '&:hover': {
                    bgcolor: 'rgba(74,124,140,0.12)'
                  },
                  '&:focus-visible': {
                    outline: '2px solid rgba(74,124,140,0.45)',
                    outlineOffset: 2
                  }
                }
              }}
            >
              <ToggleButton value="saved">Saved</ToggleButton>
              <ToggleButton value="upcoming">Booked (Upcoming)</ToggleButton>
              <ToggleButton value="past">Booked (Past)</ToggleButton>
              <ToggleButton value="canceled">Canceled</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Button component={Link} href="/schedule" variant="outlined" size="small">View in Schedule</Button>
        </Stack>

        {tab === 'saved' && (
          <Box>
            <Typography sx={{ fontFamily: 'Urbanist', color: '#666', mb: 1 }}>Saved experiences</Typography>
            {/* Filters row */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="city-label">City</InputLabel>
                <Select labelId="city-label" label="City" value={filterCity} onChange={(e)=>setFilterCity(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  {Array.from(new Set(saved.map((s:any)=>s.city).filter(Boolean))).map((c:string)=> (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="cat-label">Category</InputLabel>
                <Select labelId="cat-label" label="Category" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  {Array.from(new Set(saved.map((s:any)=>s.category).filter(Boolean))).map((c:string)=> (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField size="small" label="Min price" type="number" value={priceMin} onChange={(e)=>setPriceMin(e.target.value)} sx={{ width: 120 }} />
              <TextField size="small" label="Max price" type="number" value={priceMax} onChange={(e)=>setPriceMax(e.target.value)} sx={{ width: 120 }} />
              <FormControl size="small" sx={{ minWidth: 180, ml: 'auto' }}>
                <InputLabel id="sort-label">Sort</InputLabel>
                <Select labelId="sort-label" label="Sort" value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
                  <MenuItem value="added">Date added</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
              <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{filteredSaved.length} results</Typography>
            </Stack>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading saved…</Typography>
              </Box>
            ) : saved.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                  You haven’t saved any experiences yet.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {filteredSaved
                  .filter((s:any) => filterCity === 'all' || s.city === filterCity)
                  .filter((s:any) => filterCategory === 'all' || s.category === filterCategory)
                  .filter((s:any) => {
                    const price = Number(s.price || 0);
                    const minOk = priceMin ? price >= Number(priceMin) : true;
                    const maxOk = priceMax ? price <= Number(priceMax) : true;
                    return minOk && maxOk;
                  })
                  .sort((a:any, b:any) => {
                    const pa = Number(a.price || 0);
                    const pb = Number(b.price || 0);
                    if (sortBy === 'price_asc') return pa - pb;
                    if (sortBy === 'price_desc') return pb - pa;
                    return 0;
                  })
                  .map((s:any) => (
                  <Paper key={s.id} variant="outlined" sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {s.image ? (
                        <Box component="img" src={s.image} alt={s.title} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, border: '1px solid rgba(74,124,140,0.15)' }} />
                      ) : null}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{s.title}</Typography>
                        <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{s.city}{s.category ? ` • ${s.category}` : ''}</Typography>
                        {(s.price || s.currency) && (
                          <Typography sx={{ fontFamily: 'Urbanist', color: 'rgba(74,124,140,0.9)', fontWeight: 600 }}>
                            {s.price}{s.currency ? ` ${s.currency}` : ''}
            </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button component={Link} href={`/experiences/${s.experienceId}`} variant="outlined" size="small">View</Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            const pid = String(s.bokunProductId || s.experienceId || s.id || '');
                            if (!pid) return;
                            setWidgetProductId(pid);
                            setWidgetOpen(true);
                          }}
                        >
                          Book now
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => openAddToSchedule(s)}>Add to Schedule</Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={removeBusyId === s.id}
                          onClick={async () => {
                            try {
                              setRemoveBusyId(s.id);
                              const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                              const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                              if (token) headers.Authorization = `Bearer ${token}`;
                              const res = await fetch(`${base}/bookmarks/remove`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ id: s.id })
                              });
                              if (!res.ok) throw new Error('Failed');
                              setSaved((list) => list.filter((x) => x.id !== s.id));
                              setSnack({ open: true, message: 'Removed from saved', severity: 'success' });
                            } catch {
                              setSnack({ open: true, message: 'Failed to remove', severity: 'error' });
                            } finally {
                              setRemoveBusyId(null);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {tab === 'upcoming' && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading bookings…</Typography>
              </Box>
            ) : upcoming.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>No upcoming bookings.</Typography>
              </Paper>
            ) : (
              upcoming.map((booking) => (
                <Box key={booking.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarMonth sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 20 }} />
            <Typography
              sx={{
                fontSize: '1.2rem',
                color: '#4A4A4A',
                fontFamily: 'Cormorant Garamond',
                fontWeight: 600,
              }}
            >
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
            </Typography>
                  </Box>
                  <BookingCard
                    booking={booking}
                    onOpen={(b) => {
                      setSelectedBooking(b);
                      setDetailsOpen(true);
                      // lazy load details
                      (async () => {
                        try {
                          setDetailsLoading(true);
                          setDetailsError(null);
                          const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                          const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                          if (token) headers.Authorization = `Bearer ${token}`;
                          const bookingId = typeof b.id === 'string' ? b.id : String(b.id);
                          const res = await fetch(`${base}/user/bookings/${encodeURIComponent(bookingId)}`, { headers, cache: 'no-store' });
                          if (!res.ok) throw new Error(`Failed (${res.status})`);
                          const j = await res.json();
                          setDetails(j.success ? j.booking : j);
                        } catch (e: any) {
                          setDetailsError(e?.message || 'Failed to load details');
                        } finally {
                          setDetailsLoading(false);
                        }
                      })();
                    }}
                    onReschedule={async (b) => {
                      setSelectedBooking(b);
                      setRescheduleDate('');
                      setRescheduleTime('');
                      setRescheduleSlots([]);
                      setRescheduleOpen(true);
                      try {
                        setRescheduleLoading(true);
                        const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                        const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (token) headers.Authorization = `Bearer ${token}`;
                        // Try next 7 days for available slots (Bókun)
                        const today = new Date();
                        const collected: string[] = [];
                        for (let i=0;i<7;i++) {
                          const d = new Date(today);
                          d.setDate(today.getDate()+i);
                          const dateStr = d.toISOString().slice(0,10);
                          const r = await fetch(`${base}/supplier/bokun/availability`, { method: 'POST', headers, body: JSON.stringify({ experienceId: (details?.bokunProductId || b.id), date: dateStr }) });
                          if (r.ok) {
                            const j = await r.json();
                            const times: string[] = Array.isArray(j.slots) ? j.slots.map((x:any)=>x.time||x.startTime||x.start||'').filter(Boolean) : [];
                            if (times.length) {
                              setRescheduleDate(dateStr);
                              setRescheduleSlots(times);
                              setRescheduleTime(times[0].slice(0,5));
                              break;
                            }
                          }
                        }
                      } catch {
                      } finally {
                        setRescheduleLoading(false);
                      }
                    }}
                    onCancel={async (b) => {
                      try {
                        const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                        const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (token) headers.Authorization = `Bearer ${token}`;
                        const bookingId = typeof b.id === 'string' ? b.id : String(b.id);
                        const res = await fetch(`${base}/user/bookings/${encodeURIComponent(bookingId)}/cancel`, { 
                          method: 'POST', 
                          headers, 
                          body: JSON.stringify({ reason: 'Customer requested cancellation' }) 
                        });
                        if (!res.ok) {
                          const error = await res.json().catch(() => ({}));
                          throw new Error(error.error || 'Failed to cancel booking');
                        }
                        setSnack({ open: true, message: 'Booking canceled', severity: 'success' });
                        setUpcoming((list) => list.filter((x) => x.id !== b.id));
                        setCanceled((list) => [{ ...b, status: 'completed' }, ...list]);
                        await fetchLists(); // Refresh list
                      } catch (e: any) {
                        setSnack({ open: true, message: e?.message || 'Failed to cancel', severity: 'error' });
                      }
                    }}
                    onShare={(b) => shareBooking(b.id)}
                  />
                </Box>
              ))
            )}
          </Box>
        )}

        {tab === 'past' && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading bookings…</Typography>
              </Box>
            ) : past.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>No past bookings.</Typography>
              </Paper>
            ) : (
              past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isPast onShare={(b) => shareBooking(b.id)} />
              ))
            )}
          </Box>
        )}

        {tab === 'canceled' && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading bookings…</Typography>
              </Box>
            ) : canceled.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
                <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>No canceled bookings.</Typography>
              </Paper>
            ) : (
              canceled.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isPast onShare={(b) => shareBooking(b.id)} />
              ))
            )}
          </Box>
        )}
      </Box>
      </BackgroundImage>
      {/* Add to Schedule dialog */}
      <Dialog open={addSchedOpen} onClose={() => setAddSchedOpen(false)}>
        <DialogTitle>Add to Schedule</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 2, pt: 2, alignItems: 'center' }}>
          <TextField
            label="Date"
            type="date"
            value={addDate}
            onChange={async (e) => {
              const d = e.target.value;
              setAddDate(d);
              if (!selectedSaved) return;
              try {
                setSlotsLoading(true);
                setSlotTimes([]);
                const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                const res = await fetch(`${base}/supplier/bokun/availability`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ experienceId: selectedSaved.experienceId, date: d })
                });
                if (res.ok) {
                  const j = await res.json();
                  const times = Array.isArray(j.slots) ? j.slots.map((s: any) => s.time || s.startTime || s.start || '').filter((t: string) => t) : [];
                  setSlotTimes(times);
                  if (times.length > 0) setAddTime(times[0].slice(0,5));
                }
              } catch {
              } finally {
                setSlotsLoading(false);
              }
            }}
            InputLabelProps={{ shrink: true }}
          />
          {slotsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading times…</Typography>
            </Box>
          ) : slotTimes.length > 0 ? (
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="time-select-label">Time</InputLabel>
              <Select
                labelId="time-select-label"
                label="Time"
                value={addTime}
                onChange={(e) => setAddTime(e.target.value as string)}
              >
                {slotTimes.map((t) => (
                  <MenuItem key={t} value={t.slice(0,5)}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField label="Time" type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} InputLabelProps={{ shrink: true }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSchedOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (!selectedSaved || !addDate || !addTime) return;
                const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                const startISO = new Date(`${addDate}T${addTime}:00`).toISOString();
                const endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
                const res = await fetch(`${base}/schedule/add`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    experienceId: selectedSaved.experienceId,
                    title: selectedSaved.title,
                    startISO,
                    endISO,
                    location: selectedSaved.city || ''
                  })
                });
                if (!res.ok) throw new Error('Failed');
                setSnack({ open: true, message: 'Added to schedule', severity: 'success', actionHref: `/schedule?date=${addDate}` });
                setAddSchedOpen(false);
                setAddDate('');
                setAddTime('');
                setSelectedSaved(null);
                setSlotTimes([]);
              } catch {
                setSnack({ open: true, message: 'Failed to add to schedule', severity: 'error' });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bokun widget dialog for Saved items */}
      <Dialog open={widgetOpen} onClose={() => setWidgetOpen(false)} fullWidth maxWidth="md" aria-labelledby="booking-widget-title-saved">
        <DialogContent sx={{ p: 0, paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
          {widgetProductId && (
            <BokunBookingWidget
              productId={widgetProductId}
              source="saved"
              onError={(err) => console.error('Booking widget error:', err)}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Details drawer */}
      <Drawer anchor="right" open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <Box sx={{ width: 360, p: 3 }} role="dialog" aria-modal>
          {!selectedBooking ? null : (
            <Stack spacing={2}>
              <Typography sx={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: '#4A4A4A' }}>
                {selectedBooking.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
                <Typography sx={{ fontSize: '0.95rem', fontFamily: 'Urbanist', color: '#666666' }}>
                  {selectedBooking.date} {selectedBooking.time}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
                <Typography sx={{ fontSize: '0.95rem', fontFamily: 'Urbanist', color: '#666666' }}>
                  {selectedBooking.location}
                </Typography>
              </Box>
              {detailsLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={18} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading booking details…</Typography>
                </Box>
              ) : detailsError ? (
                <Alert severity="error" action={<Button size="small" onClick={async () => {
                  if (!selectedBooking) return;
                  try {
                    setDetailsLoading(true);
                    setDetailsError(null);
                    const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                    const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (token) headers.Authorization = `Bearer ${token}`;
                    const bookingId = typeof selectedBooking.id === 'string' ? selectedBooking.id : String(selectedBooking.id);
                    const res = await fetch(`${base}/user/bookings/${encodeURIComponent(bookingId)}`, { headers, cache: 'no-store' });
                    if (!res.ok) throw new Error(`We couldn't load your booking. (${res.status})`);
                    const j = await res.json();
                    setDetails(j.success ? j.booking : j);
                  } catch (e: any) {
                    setDetailsError(e?.message || 'We couldn’t load your booking. Please retry.');
                  } finally {
                    setDetailsLoading(false);
                  }
                }}>Retry</Button>}>
                  {detailsError}
                </Alert>
              ) : details ? (
                <>
              {details.cancellationPolicy && (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.9)' }}>
                      <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600, mb: 0.5 }}>Refund policy</Typography>
                      <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{details.cancellationPolicy}</Typography>
                      {details.refundableUntil && (
                        <Typography sx={{ fontFamily: 'Urbanist', color: '#666', mt: 0.5 }}>Refundable until: {new Date(details.refundableUntil).toLocaleString()}</Typography>
                      )}
                    </Paper>
                  )}
              {/* Optional media when available */}
              {Array.isArray((details as any)?.photos) && (details as any).photos.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600, mb: 0.5 }}>Photos</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {(details as any).photos.slice(0, 6).map((src: string, i: number) => (
                      <Box key={i} component="img" src={src} alt={`photo-${i}`} loading="lazy" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 1 }} />
                    ))}
                  </Box>
                </Box>
              )}
              {Array.isArray((details as any)?.videos) && (details as any).videos.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600, mb: 0.5 }}>Videos</Typography>
                  <Stack spacing={1}>
                    {(details as any).videos.slice(0, 2).map((src: string, i: number) => (
                      <Box key={i} component="video" src={src} controls preload="metadata" sx={{ width: '100%', borderRadius: 1 }} />
                    ))}
                  </Stack>
                </Box>
              )}
                  {details.participants ? (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Participants: {details.participants}</Typography>
                  ) : null}
                  {details.price ? (
                    <Typography sx={{ fontFamily: 'Urbanist', color: 'rgba(74,124,140,0.9)', fontWeight: 600 }}>{details.price}</Typography>
                  ) : null}
                </>
              ) : null}
              <Stack spacing={0.75} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" size="small" onClick={() => setRescheduleOpen(true)} sx={{ textTransform: 'none', borderRadius: '999px', px: 1.5, py: 0.25 }}>Reschedule</Button>
                  <Button variant="outlined" color="error" size="small" onClick={async () => {
                  if (!selectedBooking) return;
                  try {
                    const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                    const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (token) headers.Authorization = `Bearer ${token}`;
                    const bookingId = typeof selectedBooking.id === 'string' ? selectedBooking.id : String(selectedBooking.id);
                    const res = await fetch(`${base}/user/bookings/${encodeURIComponent(bookingId)}/cancel`, { 
                      method: 'POST', 
                      headers, 
                      body: JSON.stringify({ reason: 'Customer requested cancellation' }) 
                    });
                    if (!res.ok) {
                      const error = await res.json().catch(() => ({}));
                      throw new Error(error.error || 'Failed to cancel booking');
                    }
                    setSnack({ open: true, message: 'Booking canceled', severity: 'success' });
                    setUpcoming((list) => list.filter((x) => x.id !== selectedBooking.id));
                    setCanceled((list) => [{ ...selectedBooking, status: 'completed' }, ...list]);
                    setDetailsOpen(false);
                    await fetchLists(); // Refresh list
                  } catch {
                    setSnack({ open: true, message: 'Failed to cancel', severity: 'error' });
                  }
                }} sx={{ textTransform: 'none', borderRadius: '999px', px: 1.5, py: 0.25 }}>Cancel</Button>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={{ flexWrap: 'wrap', mt: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    href={`/bookings/${selectedBooking.id}`}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '999px',
                      px: 1.5,
                      py: 0.25,
                      color: 'rgba(74,124,140,0.9)',
                      borderColor: 'rgba(74,124,140,0.18)',
                      '&:hover': { bgcolor: 'rgba(74,124,140,0.08)', borderColor: 'rgba(74,124,140,0.28)' }
                    }}
                  >
                    Open details
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    href={`/schedule?date=${encodeURIComponent(selectedBooking.date)}`}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '999px',
                      px: 1.5,
                      py: 0.25,
                      color: 'rgba(74,124,140,0.9)',
                      borderColor: 'rgba(74,124,140,0.18)',
                      '&:hover': { bgcolor: 'rgba(74,124,140,0.08)', borderColor: 'rgba(74,124,140,0.28)' }
                    }}
                  >
                    View in Schedule
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => selectedBooking && shareBooking(selectedBooking.id)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '999px',
                      px: 1.5,
                      py: 0.25,
                      color: 'rgba(74,124,140,0.9)',
                      borderColor: 'rgba(74,124,140,0.18)',
                      '&:hover': { bgcolor: 'rgba(74,124,140,0.08)', borderColor: 'rgba(74,124,140,0.28)' }
                    }}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.print()}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '999px',
                      px: 1.5,
                      py: 0.25,
                      color: 'rgba(74,124,140,0.9)',
                      borderColor: 'rgba(74,124,140,0.18)',
                      '&:hover': { bgcolor: 'rgba(74,124,140,0.08)', borderColor: 'rgba(74,124,140,0.28)' }
                    }}
                  >
                    Print
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          )}
        </Box>
      </Drawer>
      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)}>
        <DialogTitle>Reschedule booking</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 2, pt: 2, alignItems: 'center' }}>
          <TextField label="Date" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          {rescheduleLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading times…</Typography>
            </Box>
          ) : (rescheduleSlots.length > 0 ? (
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="res-time-label">Time</InputLabel>
              <Select labelId="res-time-label" label="Time" value={rescheduleTime} onChange={(e)=>setRescheduleTime(String(e.target.value))}>
                {rescheduleSlots.map((t)=> (
                  <MenuItem key={t} value={t.slice(0,5)}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField label="Time" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} InputLabelProps={{ shrink: true }} />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;
                const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                const startISO = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
                const endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
                const res = await fetch(`${base}/bookings/reschedule`, { method: 'POST', headers, body: JSON.stringify({ bookingId: selectedBooking.id, startISO, endISO }) });
                if (!res.ok) throw new Error('Failed');
                setSnack({ open: true, message: 'Booking rescheduled', severity: 'success' });
                setRescheduleOpen(false);
                await fetchLists();
              } catch {
                setSnack({ open: true, message: 'Failed to reschedule', severity: 'error' });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          action={snack.actionHref ? <Button component={Link} href={snack.actionHref} size="small">Open</Button> : undefined}
        >
          {snack.message}
        </Alert>
      </Snackbar>
      <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'user'} />
      <Popover
        open={Boolean(bgAnchorEl)}
        anchorEl={bgAnchorEl}
        onClose={()=>{ setBgAnchorEl(null); }}
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
              <TextField size="small" label="Search photos" value={bgSearch} onChange={(e)=>{ const v=e.target.value; setBgSearch(v); if(!v.trim()){ setBgResults([]); setBgPage(1); setBgSeed((s)=>s+1);} }} fullWidth />
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
              {(!bgSearch.trim() ? getCuratedBackgrounds().slice().sort(()=>Math.random()-0.5) : []).map((p, idx)=> (
                <Box key={`cur_${idx}`} role="button" tabIndex={0} aria-label="Use curated background" sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }} onKeyDown={async (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); (e.currentTarget as any).click?.(); } }} onClick={async ()=>{
                  const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                  const next = { url: p.url, thumbUrl: p.thumbUrl } as PortalBackground;
                  setBg(next);
                  prefetchBackgroundImage(p.url);
                  saveCachedBackground(next, 'user');
                  try { await setUserBackground(token, next); } catch {}
                  setBgAnchorEl(null);
              }}>
                  <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block', background:'#e9eef2' }} />
                </Box>
              ))}
              {bgResults.map((p:any)=>{
                const id = p?.id; const url = p?.urls?.full || p?.urls?.regular || ''; const thumb = p?.urls?.small || p?.urls?.thumb || '';
                const authorName = p?.user?.name || ''; const authorUrl = p?.user?.links?.html || p?.user?.portfolio_url || '';
                return (
                  <Box key={id} role="button" tabIndex={0} aria-label={`Use image by ${authorName||'author'}`} sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }} onKeyDown={async (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); (e.currentTarget as any).click?.(); } }} onClick={async ()=>{
                    const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                    const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as PortalBackground;
                    setBg(next);
                    prefetchBackgroundImage(url);
                    saveCachedBackground(next, 'user');
                    try { await trackDownload(id); } catch {}
                    try { await setUserBackground(token, next); } catch {}
                    setBgAnchorEl(null);
                }}>
                    <img src={thumb} alt={`Unsplash: ${p?.alt_description || authorName || 'photo'}`} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                  </Box>
                );
              })}
            </Box>
            {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={60} />)}
          </Stack>
        </Paper>
      </Popover>
      <Fab color="primary" aria-label="Contact support" onClick={()=>setSupportOpen(true)} sx={{ position: 'fixed', right: 20, bottom: 24, zIndex: 2000, bgcolor: 'rgba(74,124,140,0.9)', '&:hover': { bgcolor: 'rgba(74,124,140,1)' } }}>
        <SupportAgentIcon />
      </Fab>
      <Fab color="default" aria-label="Background" onClick={(e)=>{ setBgSeed((s)=>s+1); setBgAnchorEl(e.currentTarget);} } sx={{ position: 'fixed', right: 20, bottom: 92, zIndex: 2000, bgcolor: 'rgba(255,255,255,0.9)', color: '#4a7c8c' }}>
        <WallpaperIcon />
      </Fab>
    </>
  );
}