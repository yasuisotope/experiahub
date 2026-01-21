import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Stack, CircularProgress, Alert } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import BokunBookingWidget from '@/components/BokunBookingWidget';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import type { Experience } from '@/types/chat';
import { track } from '@/services/analytics';

// analytics centralized in services/analytics

export default function DetailsPanel({ exp, onClose, onBook }: { exp: Experience | null; onClose?: () => void; onBook?: (exp: Experience) => void }) {
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Array<{ time: string; capacity?: number }>>([]);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const { isLoggedIn } = useWordPressAuth();
  const [openWidget, setOpenWidget] = useState(false);
  const showWidgetCta = (process.env.NEXT_PUBLIC_SHOW_WIDGET_CTA ?? process.env.SHOW_WIDGET_CTA ?? 'true') !== 'false';
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || active === panelRef.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  useEffect(() => {
    setSlots([]);
    setAvailError(null);
  }, [exp?.title]);

  // Focus management
  useEffect(() => {
    if (exp && panelRef.current) {
      panelRef.current.focus();
    }
    
    const fetchAvail = async () => {
      const pid = (exp as any)?.bokunProductId || (exp as any)?.id;
      if (!pid || pid.startsWith('temp_')) return;
      
      setLoadingAvail(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : '';
        // Use local date to ensure we see 'today' in the user's timezone
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const res = await fetch(`/api/bokun/availability/${pid}?date=${date}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const avail = data.availability;
          if (avail && Array.isArray(avail.times)) {
            setSlots(avail.times.map((t: any) => ({ time: t.time || (t.hour + ':' + t.minute), capacity: t.capacity })));
          } else if (Array.isArray(avail)) {
            // Octo format
            setSlots(avail.map((t: any) => ({ time: t.startTime, capacity: t.remainingCapacity })));
          }
        }
      } catch (err) {
        console.error('Avail fetch error:', err);
      } finally {
        setLoadingAvail(false);
      }
    };
    
    if (exp) fetchAvail();
  }, [exp]);

  if (!exp) return null;
  const handleBookmark = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      if (!token) { setBookmarkMessage('Please log in to bookmark.'); return; }
      const payload: any = {
        id: (exp as any)?.id || (exp as any)?.bokunProductId || '',
        title: exp.title,
        city: (exp as any)?.city,
        category: (exp as any)?.category,
        price: (exp as any)?.price,
        currency: (exp as any)?.currency,
        bokunProductId: (exp as any)?.bokunProductId || undefined,
        source: (exp as any)?.source || 'chat',
      };
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to bookmark');
      setBookmarkMessage('Saved to Bookings → Saved');
      try { track('bookmark_add', { title: exp.title, city: (exp as any)?.city, productId: (exp as any)?.bokunProductId || (exp as any)?.id }); } catch {}
      try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('bookmarks:updated')); } } catch {}
    } catch (e: any) {
      setBookmarkMessage(e?.message || 'Could not save');
    } finally {
      setTimeout(() => setBookmarkMessage(null), 2500);
    }
  };
  return (
    <Paper id="details-panel" role="dialog" aria-modal="true" aria-labelledby="details-title" tabIndex={-1} ref={panelRef} onKeyDown={handleKeyDown} elevation={0} sx={{ p: 2, m: 2, bgcolor: 'rgba(255,255,255,0.9)', border: '0', borderRadius: 1, boxShadow: '0 0 0 0 transparent', outline: 'none' }}>
      <Stack spacing={1.25}>
        <Typography
          id="details-title"
          sx={{
            fontFamily: 'Playfair Display',
            fontSize: { xs: '1.35rem', sm: '1.6rem' },
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#010057'
          }}
        >
          {exp.title}
        </Typography>
        {(exp.price || exp.currency) && (
          <Typography sx={{ fontFamily: 'Nunito', color: '#010057', fontWeight: 600, fontSize: '1.1rem' }}>
            {exp.price}{exp.currency ? ` ${exp.currency}` : ''}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, color: '#666', fontFamily: 'Inter' }}>
          <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>Verified provider</Typography>
          <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>Secure checkout (Bokun/Stripe)</Typography>
          {(exp as any)?.metadata?.cancellation && (
            <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{(exp as any).metadata.cancellation}</Typography>
          )}
        </Box>
        <Typography sx={{ fontFamily: 'Inter', color: '#666', fontSize: '0.85rem' }}>{[exp.city, exp.category, exp.duration].filter(Boolean).join(' • ')}</Typography>
        {exp.summary && (
          <Typography sx={{ fontFamily: 'Nunito', color: '#444', fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 }}>{exp.summary}</Typography>
        )}
        {/* Photos (gated) */}
        {isLoggedIn ? (
          Array.isArray(exp.photos) && exp.photos.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {exp.photos.slice(0, 6).map((src, i) => (
                <Box key={i} component="img" src={src} alt={`photo-${i}`} loading="lazy" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 1 }} />
              ))}
            </Box>
          )
        ) : (
          <Typography sx={{ fontFamily: 'Inter', color: '#666' }}>
            Log in to view photos and videos. You can still book via the widget below.
          </Typography>
        )}

        {/* Videos (gated) */}
        {isLoggedIn && Array.isArray(exp.videos) && exp.videos.length > 0 && (
          <Stack spacing={1}>
            {exp.videos.slice(0, 2).map((src, i) => (
              <Box key={i} component="video" src={src} controls preload="metadata" style={{ width: '100%', borderRadius: 4 }} />
            ))}
          </Stack>
        )}

        {/* Price */}
        {(exp.price || exp.currency) && (
          <Typography sx={{ fontFamily: 'Inter', color: '#010057' }}>
            {exp.price}{exp.currency ? ` ${exp.currency}` : ''}
          </Typography>
        )}

        {/* Schedule */}
        {exp.schedule && (
          <Box sx={{ fontFamily: 'Inter', color: '#444' }}>
            {Array.isArray(exp.schedule)
              ? exp.schedule.slice(0, 6).map((s: any, i: number) => (
                  <Typography key={i} sx={{ fontSize: '0.95rem' }}>
                    {typeof s === 'string' ? s : (s?.time || s?.label || JSON.stringify(s))}
                  </Typography>
                ))
              : <Typography sx={{ fontSize: '0.95rem' }}>{JSON.stringify(exp.schedule)}</Typography>
            }
          </Box>
        )}

        {/* Availability (live fetch) */}
        {Array.isArray(slots) && slots.length > 0 && (
          <Box sx={{ fontFamily: 'Inter', color: '#010057' }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Upcoming times</Typography>
            <Stack spacing={0.5}>
              {slots.slice(0, 8).map((s, i) => (
                <Typography key={i} sx={{ fontSize: '0.95rem' }}>{s.time}{s.capacity ? ` • ${s.capacity} left` : ''}</Typography>
              ))}
            </Stack>
          </Box>
        )}
        <Typography sx={{ fontFamily: 'Inter', color: '#666', mt: 0.5, fontSize: '0.85rem' }}>
          Times shown are indicative. <strong>View live availability</strong> in the booking widget.
        </Typography>
        {loadingAvail && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={16} /><Typography sx={{ fontFamily: 'Inter', color: '#666' }}>Checking availability…</Typography></Box>}
        {availError && <Alert severity="warning" sx={{ fontFamily: 'Inter' }}>{availError}</Alert>}

        {/* Provider Info */}
        {(exp.source || (exp as any)?.metadata?.source) && (
          <Typography sx={{ fontFamily: 'Inter', color: '#666' }}>
            Provider: {exp.source || (exp as any)?.metadata?.source}
          </Typography>
        )}
        {/* Primary actions */}
        <Stack
          direction="column"
          spacing={1.25}
          sx={{ alignItems: 'stretch' }}
        >
          {showWidgetCta && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                onBook?.(exp);
                const pid = (exp as any)?.bokunProductId || (exp as any)?.productId || (exp as any)?.id;
                if (!pid) return;
                track('checkout_click', { productId: pid, title: exp.title, city: exp.city, category: exp.category, source: 'panel' });
              }}
              aria-label={`Book now for ${exp.title}`}
              sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#4A7C8C' }, fontFamily: 'Inter', textTransform: 'none' }}
            >
              Book Now
            </Button>
          )}
          {showWidgetCta && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                onBook?.(exp);
                const pid = (exp as any)?.bokunProductId || (exp as any)?.productId || (exp as any)?.id;
                if (!pid) return;
                track('widget_open', { source: 'panel', title: exp.title, city: exp.city, category: exp.category, productId: pid });
              }}
              aria-label={`Check availability for ${exp.title}`}
              sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#4A7C8C' }, fontFamily: 'Inter', textTransform: 'none' }}
            >
              Check availability
            </Button>
          )}
        </Stack>
        {/* Secondary actions */}
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" aria-label="Bookmark experience" onClick={handleBookmark} sx={{ fontFamily: 'Inter', textTransform: 'none', color: '#010057', borderColor: '#010057' }}>Bookmark</Button>
          {onClose && (
            <Button
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                track('details_close', { reason: 'close_button' });
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('details:close'));
                }
              }}
              aria-label="Close details"
              sx={{ fontFamily: 'Inter', textTransform: 'none', color: '#666' }}
            >
              Close
            </Button>
          )}
        </Stack>
        {bookmarkMessage && (
          <Alert severity="info" sx={{ mt: 1, fontFamily: 'Nunito' }}>{bookmarkMessage}</Alert>
        )}
      </Stack>
    </Paper>
  );
}