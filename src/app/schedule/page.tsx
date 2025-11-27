'use client';

import React from 'react';
import { Box, Typography, Paper, Stack, IconButton, Menu, MenuItem, Drawer, TextField, InputAdornment, Select, FormControl, InputLabel, Button, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Tooltip, Fab, Popover, Skeleton } from '@mui/material';
import { CalendarMonth, AccessTime, LocationOn, Groups, FlightTakeoff, Hotel, Restaurant, MoreVert, Search as SearchIcon, ChevronLeft, ChevronRight, Share as ShareIcon } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, type PortalBackground } from '@/services/backgroundService';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useRouter } from 'next/navigation';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import { searchUnsplash, prefetchBackgroundImage, setUserBackground, trackDownload, getCuratedBackgrounds } from '@/services/backgroundService';

type ScheduleEvent = {
  id: string;
  type: 'tour' | 'hotel' | 'dining' | 'activity' | 'transport';
  title: string;
  time: string;
  location: string;
  details: string;
  icon: React.ReactNode;
  bookingId?: string;
  provider?: string;
  photos?: string[];
  videos?: string[];
};

type ScheduleDay = {
  id: number;
  date: string;
  events: ScheduleEvent[];
};

const fallbackSchedule: ScheduleDay[] = [
  {
    id: 1,
    date: '2024-08-15',
    events: [
      {
        id: 'e1',
        type: 'tour',
        title: 'Kyoto Cultural Tour',
        time: '09:00 - 17:00',
        location: 'Kyoto, Japan',
        details: 'Full-day guided tour of Kyoto\'s cultural highlights',
        icon: <Groups sx={{ fontSize: 18 }} />,
      },
      {
        id: 'e2',
        type: 'hotel',
        title: 'Check-in: Kyoto Traditional Inn',
        time: '17:30',
        location: 'Gion District',
        details: 'Traditional Japanese-style accommodation',
        icon: <Hotel sx={{ fontSize: 18 }} />,
      },
      {
        id: 'e3',
        type: 'dining',
        title: 'Dinner Reservation',
        time: '19:00',
        location: 'Pontocho Alley',
        details: 'Traditional Kyoto cuisine',
        icon: <Restaurant sx={{ fontSize: 18 }} />,
      }
    ]
  },
  {
    id: 2,
    date: '2024-08-16',
    events: [
      {
        id: 'e4',
        type: 'activity',
        title: 'Tea Ceremony Experience',
        time: '14:00 - 16:00',
        location: 'Gion District',
        details: 'Traditional tea ceremony with a tea master',
        icon: <Groups sx={{ fontSize: 18 }} />,
      },
      {
        id: 'e5',
        type: 'transport',
        title: 'Departure',
        time: '18:00',
        location: 'Kyoto Station',
        details: 'Shinkansen to Tokyo',
        icon: <FlightTakeoff sx={{ fontSize: 18 }} />,
      }
    ]
  }
];

type CalendarEvent = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  location?: string;
  details?: string;
};

function toGoogleDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildGoogleCalendarUrl(event: CalendarEvent) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const text = `&text=${encodeURIComponent(event.title)}`;
  const dates = `&dates=${toGoogleDate(event.startISO)}/${toGoogleDate(event.endISO)}`;
  const details = event.details ? `&details=${encodeURIComponent(event.details)}` : '';
  const location = event.location ? `&location=${encodeURIComponent(event.location)}` : '';
  return `${base}${text}${dates}${details}${location}`;
}

function buildICS(event: CalendarEvent) {
  const uid = `${event.id}@experiahub.com`;
  const dtStamp = toGoogleDate(new Date().toISOString());
  const dtStart = toGoogleDate(event.startISO);
  const dtEnd = toGoogleDate(event.endISO);
  const escape = (s: string) => (s || '').replace(/\\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExperiaHub//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escape(event.title)}`,
    event.location ? `LOCATION:${escape(event.location)}` : '',
    event.details ? `DESCRIPTION:${escape(event.details)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

function downloadICS(event: CalendarEvent) {
  const ics = buildICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseTimeRangeToIso(dateStr: string, timeRange: string): { startISO: string; endISO: string } {
  const [startPart, endPart] = timeRange.split('-').map((s) => s.trim());
  const toIso = (t: string) => new Date(`${dateStr}T${t.length === 5 ? t + ':00' : t}`).toISOString();
  const startISO = toIso(startPart);
  const endISO = toIso(endPart || startPart);
  return { startISO, endISO };
}

const EventCard = ({ event, date, onOpenDetails }: { event: ScheduleEvent; date: string; onOpenDetails: (e: ScheduleEvent) => void }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const calendarEvent: CalendarEvent = React.useMemo(() => {
    const { startISO, endISO } = parseTimeRangeToIso(date, event.time);
    return {
      id: event.id,
      title: event.title,
      startISO,
      endISO,
      location: event.location,
      details: event.details
    };
  }, [date, event]);

  return (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(74, 124, 140, 0.1)',
      borderRadius: 2,
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        cursor: 'pointer',
        '&:focus-visible': {
          outline: '2px solid rgba(74,124,140,0.45)',
          outlineOffset: 2,
          borderColor: 'rgba(74,124,140,0.35)'
        },
      '&:hover': {
          backgroundColor: 'rgba(240, 248, 250, 0.6)',
          borderColor: 'rgba(74, 124, 140, 0.25)',
          boxShadow: '0 0 0 2px rgba(74,124,140,0.08) inset'
      },
    }}
      onClick={() => onOpenDetails(event)}
      role="button"
      tabIndex={0}
      aria-label={`Open event details for ${event.title}`}
  >
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'rgba(74, 124, 140, 0.9)' }}>
            {event.icon}
          </Box>
          <Typography
            sx={{
              fontSize: '1rem',
              fontFamily: 'Urbanist',
              fontWeight: 600,
              color: '#4A4A4A',
            }}
          >
            {event.title}
          </Typography>
        </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          sx={{
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
            fontFamily: 'Urbanist',
            fontWeight: 500,
            color: 'rgba(74, 124, 140, 0.9)',
            bgcolor: 'rgba(74, 124, 140, 0.1)',
            borderRadius: 1,
                textTransform: 'capitalize'
          }}
        >
          {event.type}
        </Typography>
            <IconButton aria-label="event actions" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e); }} size="small">
              <MoreVert fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose} onClick={(e) => e.stopPropagation()}>
              <MenuItem onClick={() => { window.open(buildGoogleCalendarUrl(calendarEvent), '_blank', 'noopener'); handleMenuClose(); }}>Add to Google Calendar</MenuItem>
              <MenuItem onClick={() => { downloadICS(calendarEvent); handleMenuClose(); }}>Download .ics</MenuItem>
            </Menu>
          </Box>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {event.time}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
            {event.location}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          fontSize: '0.85rem',
          fontFamily: 'Urbanist',
          color: '#666666',
          fontStyle: 'italic',
        }}
      >
        {event.details}
      </Typography>
    </Stack>
  </Paper>
);
};

export default function SchedulePage() {
  const router = useRouter();
  const [bg, setBg] = React.useState<PortalBackground | null>(null);
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
  const [selectedEvent, setSelectedEvent] = React.useState<(ScheduleEvent & { date: string }) | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [filterMonth, setFilterMonth] = React.useState<string>('all');
  const [searchText, setSearchText] = React.useState<string>('');
  const { isLoggedIn } = useWordPressAuth();
  const wpToken = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>(() => {
    if (typeof window === 'undefined') return 'list';
    const saved = window.localStorage.getItem('schedule_mode');
    return (saved === 'calendar' || saved === 'list') ? (saved as 'list'|'calendar') : 'list';
  });
  const [calendarView, setCalendarView] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'dayGridMonth';
    return window.localStorage.getItem('schedule_calendar_view') || 'dayGridMonth';
  });
  const searchParams = useSearchParams();
  const deepLinkDate = searchParams?.get('date') || '';
  const dayRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState<string>('');
  const [rescheduleTime, setRescheduleTime] = React.useState<string>('');
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [jumpMonth, setJumpMonth] = React.useState(() => new Date().toISOString().slice(0,7));
  const calendarRef = React.useRef<any>(null);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [bgAnchorEl, setBgAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bgSearch, setBgSearch] = React.useState<string>('');
  const [bgResults, setBgResults] = React.useState<any[]>([]);
  const [bgPage, setBgPage] = React.useState<number>(1);
  const [bgLoading, setBgLoading] = React.useState<boolean>(false);
  const [bgLoadingMore, setBgLoadingMore] = React.useState<boolean>(false);

  const [remoteSchedule, setRemoteSchedule] = React.useState<ScheduleDay[] | null>(null);
  const monthStoreRef = React.useRef<Map<string, ScheduleDay[]>>(new Map());
  const loadingMonthsRef = React.useRef<Set<string>>(new Set());

  const ymdMonth = (d: Date) => d.toISOString().slice(0,7); // YYYY-MM
  const monthStart = (ym: string) => new Date(`${ym}-01T00:00:00`);
  const monthEndExclusive = (ym: string) => { const d = monthStart(ym); d.setMonth(d.getMonth()+1); return d; };

  const upsertMonthDays = (ym: string, events: Array<{ id: string; title: string; startISO: string; endISO: string; location?: string; details?: string; type?: ScheduleEvent['type']; bookingId?: string; provider?: string }>) => {
    const byDate = new Map<string, ScheduleEvent[]>();
    events.forEach((ev) => {
      const start = new Date(ev.startISO);
      const end = new Date(ev.endISO);
      const ymd = start.toISOString().slice(0,10);
      const time = `${start.toTimeString().slice(0,5)} - ${end.toTimeString().slice(0,5)}`;
      const iconByType: Partial<Record<ScheduleEvent['type'], React.ReactNode>> = {
        tour: <Groups sx={{ fontSize: 18 }} />,
        hotel: <Hotel sx={{ fontSize: 18 }} />,
        dining: <Restaurant sx={{ fontSize: 18 }} />,
        activity: <Groups sx={{ fontSize: 18 }} />,
        transport: <FlightTakeoff sx={{ fontSize: 18 }} />
      };
      const entry: ScheduleEvent = {
        id: ev.id,
        type: (ev.type as ScheduleEvent['type']) || 'activity',
        title: ev.title,
        time,
        location: ev.location || '',
        details: ev.details || '',
        icon: iconByType[(ev.type as ScheduleEvent['type']) || 'activity'] || <Groups sx={{ fontSize: 18 }} />,
        bookingId: ev.bookingId,
        provider: ev.provider,
        photos: Array.isArray((ev as any)?.photos) ? ((ev as any).photos as string[]).filter(Boolean) : undefined,
        videos: Array.isArray((ev as any)?.videos) ? ((ev as any).videos as string[]).filter(Boolean) : undefined
      };
      if (!byDate.has(ymd)) byDate.set(ymd, []);
      byDate.get(ymd)!.push(entry);
    });
    const days: ScheduleDay[] = Array.from(byDate.entries())
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([date, events], idx) => ({ id: idx+1, date, events }));
    monthStoreRef.current.set(ym, days);
    // Rebuild remoteSchedule from store
    const merged = Array.from(monthStoreRef.current.values()).flat().sort((a,b)=>a.date.localeCompare(b.date));
    setRemoteSchedule(merged);
  };

  const ensureMonthLoaded = async (ym: string) => {
    if (!ym || loadingMonthsRef.current.has(ym) || monthStoreRef.current.has(ym)) return;
    loadingMonthsRef.current.add(ym);
    try {
      const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
      const from = monthStart(ym).toISOString().slice(0,10);
      const to = monthEndExclusive(ym).toISOString().slice(0,10);
      const res = await fetch(`${base}/schedule?from=${from}&to=${to}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        cache: 'no-store'
      });
      if (!res.ok) { return; }
      const data: Array<{ id: string; title: string; startISO: string; endISO: string; location?: string; details?: string; type?: ScheduleEvent['type']; bookingId?: string; provider?: string }> = await res.json();
      upsertMonthDays(ym, data);
    } catch {}
    finally {
      loadingMonthsRef.current.delete(ym);
    }
  };

  // Initial: load current and next month
  React.useEffect(() => {
    const now = new Date();
    const curr = ymdMonth(now);
    const next = ymdMonth(new Date(now.getFullYear(), now.getMonth()+1, 1));
    ensureMonthLoaded(curr);
    ensureMonthLoaded(next);
  }, []);

  const sourceSchedule = remoteSchedule && remoteSchedule.length > 0 ? remoteSchedule : fallbackSchedule;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('schedule_mode', viewMode);
    }
  }, [viewMode]);

  const allMonths = React.useMemo(() => {
    const months = new Set<string>();
    sourceSchedule.forEach((d) => {
      const m = new Date(d.date).toISOString().slice(0, 7); // YYYY-MM
      months.add(m);
    });
    return Array.from(months).sort();
  }, [sourceSchedule]);

  const filteredSchedule = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return sourceSchedule
      .filter((d) => filterMonth === 'all' || new Date(d.date).toISOString().startsWith(filterMonth))
      .map((d) => ({
        ...d,
        events: d.events.filter((e) => {
          if (!q) return true;
          const hay = `${e.title} ${e.location} ${e.details}`.toLowerCase();
          return hay.includes(q);
        })
      }))
      .filter((d) => d.events.length > 0);
  }, [filterMonth, searchText, sourceSchedule]);

  const getCurrentShareDate = React.useCallback((): string => {
    try {
      if (viewMode === 'calendar' && calendarRef.current?.getApi) {
        const d: Date = calendarRef.current.getApi().getDate();
        return new Date(d).toISOString().slice(0,10);
      }
      const first = filteredSchedule?.[0]?.date;
      if (first) return first;
      return new Date().toISOString().slice(0,10);
    } catch {
      return new Date().toISOString().slice(0,10);
    }
  }, [viewMode, filteredSchedule]);

  // Apply deep-linking: set month filter and scroll to date when provided
  React.useEffect(() => {
    if (!deepLinkDate) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate)) {
      const monthStr = deepLinkDate.slice(0, 7);
      setFilterMonth((prev) => (prev === monthStr ? prev : monthStr));
      // Scroll after next paint
      const id = `day-${deepLinkDate}`;
      const handle = window.setTimeout(() => {
        const el = dayRefs.current[id];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => window.clearTimeout(handle);
    }
  }, [deepLinkDate]);

  const openDetails = (event: ScheduleEvent, date: string) => {
    setSelectedEvent({ ...event, date });
    setIsDetailsOpen(true);
  };

  const scrollToDay = (dateStr: string) => {
    const id = `day-${dateStr}`;
    const handle = window.setTimeout(() => {
      const el = dayRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
    return () => window.clearTimeout(handle);
  };

  return (
    <MainLayout>
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
            mb: 4,
            fontSize: '2rem',
            color: '#4A4A4A',
            fontFamily: 'Cormorant Garamond',
            fontWeight: 500,
          }}
        >
          Schedule
        </Typography>

        <Stack spacing={1} sx={{ mb: 2, position: 'sticky', top: 0, zIndex: 5, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(74,124,140,0.08)', py: 1.25, px: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="month-filter-label">Month filter</InputLabel>
              <Select
                labelId="month-filter-label"
                label="Month filter"
                native
                value={filterMonth}
                onChange={(e) => { const v = e.target.value; setFilterMonth(v); if (v !== 'all') ensureMonthLoaded(v); }}
              >
                <option value="all">All months</option>
                {allMonths.map((m) => (
                  <option key={m} value={m}>{new Date(`${m}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</option>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="month"
              label="Jump month"
              value={jumpMonth}
              onChange={(e)=>{ const val = e.target.value; setJumpMonth(val); if (viewMode === 'calendar') { try { calendarRef.current?.getApi?.().gotoDate(`${val}-01`); } catch {} } else { if (val) setFilterMonth(val); } }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              placeholder="Search schedule"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'rgba(74, 124, 140, 0.9)' }} />
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Tooltip title="Copy link to this date">
              <IconButton size="small" onClick={async ()=>{
                const date = getCurrentShareDate();
                const url = `${window.location.origin}/schedule?date=${date}`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: 'ExperiaHub Schedule', url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    setSnack({ open: true, message: 'Link copied', severity: 'success' });
                  }
                } catch {}
              }} aria-label="share date">
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'inline-flex', p: 0.5, borderRadius: '999px', bgcolor: 'rgba(74,124,140,0.06)', border: '1px solid rgba(74,124,140,0.18)' }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMode}
                onChange={(_, v) => v && setViewMode(v)}
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
                <ToggleButton value="list">List</ToggleButton>
                <ToggleButton value="calendar">Calendar</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {/* Center group: navigation; grows to center elements nicely */}
            {viewMode === 'list' ? (
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <Button size="small" variant="outlined" onClick={() => { const today = new Date().toISOString().slice(0,10); setFilterMonth(today.slice(0,7)); scrollToDay(today); }}>Today</Button>
              </Box>
            ) : (
              <Box sx={{ flex: 1 }} />
            )}

            {/* Right group: tools */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title={`Your timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'}. Events shown in local time.`}>
                <Typography sx={{ fontSize: '0.75rem', color: '#666', fontFamily: 'Urbanist', bgcolor: 'rgba(74,124,140,0.08)', border: '1px solid rgba(74,124,140,0.18)', px: 1, py: 0.25, borderRadius: 1 }}>
                  {`TZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'}`}
                </Typography>
              </Tooltip>
              {(() => {
                const from = (() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); })();
                const to = (() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().slice(0,10); })();
                const tokenPayload = wpToken ? encodeURIComponent(btoa(JSON.stringify({ wpToken, exp: Date.now() + 1000*60*60*24*7 }))) : '';
                const icsHref = `/api/schedule.ics?token=${tokenPayload}&from=${from}&to=${to}`;
                if (isLoggedIn && wpToken) {
                  return (
                    <Tooltip title="Private feed; token expires as set in Profile → Calendar.">
                      <Button component={Link} href={icsHref} variant="outlined" size="small">
                        Subscribe to Calendar (ICS)
                      </Button>
                    </Tooltip>
                  );
                }
                return (
                  <Button component={Link} href={`/login?next=${encodeURIComponent('/schedule')}`} variant="outlined" size="small">
                    Log in to subscribe
                  </Button>
                );
              })()}
            </Box>
          </Box>
        </Stack>

        {viewMode === 'list' ? (
        <Stack spacing={4}>
            {filteredSchedule.map((day) => (
              <Box key={day.id} ref={(el: HTMLDivElement | null) => { dayRefs.current[`day-${day.date}`] = el; }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarMonth sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 20 }} />
                <Typography
                  sx={{
                    fontSize: '1.2rem',
                    color: '#4A4A4A',
                    fontFamily: 'Cormorant Garamond',
                    fontWeight: 600,
                  }}
                >
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              {day.events.map((event) => (
                  <EventCard key={event.id} event={event} date={day.date} onOpenDetails={(e) => openDetails(e, day.date)} />
              ))}
            </Box>
          ))}
        </Stack>
        ) : (
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, p: 1 }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={calendarView}
              initialDate={deepLinkDate && /^\d{4}-\d{2}-\d{2}$/.test(deepLinkDate) ? deepLinkDate : undefined}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
              height="auto"
              dayMaxEventRows={4}
              nowIndicator
              eventOverlap
              slotEventOverlap
              expandRows
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              datesSet={(arg) => {
                const type = arg.view?.type;
                if (type && typeof window !== 'undefined') {
                  window.localStorage.setItem('schedule_calendar_view', type);
                }
                // Lazy-load the visible month
                try {
                  const currentDate: Date = arg.view?.currentStart || new Date();
                  const ym = currentDate.toISOString().slice(0,7);
                  ensureMonthLoaded(ym);
                } catch {}
              }}
              events={sourceSchedule.flatMap((day) =>
                day.events.map((e) => {
                  const isAllDay = /all\s*day/i.test(e.time || '');
                  const { startISO, endISO } = parseTimeRangeToIso(day.date, e.time);
                  return {
                    id: e.id,
                    title: e.title,
                    start: startISO,
                    end: endISO,
                    allDay: isAllDay
                  };
                })
              )}
              eventClick={(info) => {
                const id = info.event.id;
                const day = sourceSchedule.find((d) => d.events.some((ev) => ev.id === id));
                const ev = day?.events.find((ev) => ev.id === id);
                if (ev && day) openDetails(ev, day.date);
              }}
            />
          </Box>
        )}

        <Drawer anchor="right" open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)}>
          <Box sx={{ width: 360, p: 3 }} role="dialog" aria-modal>
            {selectedEvent && (
              <Stack spacing={2}>
                <Typography sx={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: '#4A4A4A' }}>
                  {selectedEvent.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'Urbanist', color: '#666666' }}>
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'Urbanist', color: '#666666' }}>
                    {selectedEvent.time}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: 'rgba(74, 124, 140, 0.9)', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.95rem', fontFamily: 'Urbanist', color: '#666666' }}>
                    {selectedEvent.location}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.9rem', fontFamily: 'Urbanist', color: '#666666' }}>
                  {selectedEvent.details}
                </Typography>
                {/* Optional media if provided in event details mapping */}
                {Array.isArray((selectedEvent as any)?.photos) && (selectedEvent as any).photos.length > 0 && (
                  <Box>
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600, mb: 0.5 }}>Photos</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                      {(selectedEvent as any).photos.slice(0,6).map((src: string, i: number) => (
                        <Box key={i} component="img" src={src} alt={`photo-${i}`} loading="lazy" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 1 }} />
                      ))}
                    </Box>
                  </Box>
                )}
                {Array.isArray((selectedEvent as any)?.videos) && (selectedEvent as any).videos.length > 0 && (
                  <Box>
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600, mb: 0.5 }}>Videos</Typography>
                    <Stack spacing={1}>
                      {(selectedEvent as any).videos.slice(0,2).map((src: string, i: number) => (
                        <Box key={i} component="video" src={src} controls preload="metadata" sx={{ width: '100%', borderRadius: 1 }} />
                      ))}
                    </Stack>
                  </Box>
                )}

                {(() => {
                  const { startISO, endISO } = parseTimeRangeToIso(selectedEvent.date, selectedEvent.time);
                  const ce: CalendarEvent = {
                    id: selectedEvent.id,
                    title: selectedEvent.title,
                    startISO,
                    endISO,
                    location: selectedEvent.location,
                    details: selectedEvent.details
                  };
                  return (
                    <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                      <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, cursor: 'pointer' }} onClick={() => window.open(buildGoogleCalendarUrl(ce), '_blank', 'noopener')}>
                        <Typography sx={{ fontSize: '0.85rem', fontFamily: 'Urbanist', color: 'rgba(74, 124, 140, 0.9)' }}>Add to Google Calendar</Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, cursor: 'pointer' }} onClick={() => downloadICS(ce)}>
                        <Typography sx={{ fontSize: '0.85rem', fontFamily: 'Urbanist', color: 'rgba(74, 124, 140, 0.9)' }}>Download .ics</Typography>
                      </Paper>
                    </Stack>
                  );
                })()}

                {/* Booking actions */}
                {selectedEvent.bookingId && (
                  <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                    <Button variant="contained" size="small" onClick={() => router.push(`/bookings/${selectedEvent.bookingId}`)}>View booking</Button>
                    <Button variant="outlined" size="small" onClick={() => { setRescheduleOpen(true); }}>Reschedule</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setCancelOpen(true)}>Cancel</Button>
                  </Stack>
                )}
              </Stack>
            )}
          </Box>
        </Drawer>

        {/* Reschedule dialog */}
        <Dialog open={!!rescheduleOpen} onClose={() => setRescheduleOpen(false)}>
          <DialogTitle>Reschedule booking</DialogTitle>
          <DialogContent sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleOpen(false)}>Close</Button>
            <Button
              onClick={async () => {
                try {
                  if (!selectedEvent?.bookingId || !rescheduleDate || !rescheduleTime || !wpToken) return;
                  const startISO = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
                  const endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
                  const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                  const res = await fetch(`${base}/bookings/reschedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wpToken}` },
                    body: JSON.stringify({ bookingId: selectedEvent.bookingId, startISO, endISO })
                  });
                  if (!res.ok) throw new Error('Failed');
                  setSnack({ open: true, message: 'Booking rescheduled', severity: 'success' });
                  setRescheduleOpen(false);
                } catch (e) {
                  setSnack({ open: true, message: 'Unable to reschedule', severity: 'error' });
                }
              }}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel confirm dialog */}
        <Dialog open={!!cancelOpen} onClose={() => setCancelOpen(false)}>
          <DialogTitle>Cancel booking?</DialogTitle>
          <DialogActions>
            <Button onClick={() => setCancelOpen(false)}>No</Button>
            <Button
              color="error"
              variant="contained"
              onClick={async () => {
                try {
                  if (!selectedEvent?.bookingId || !wpToken) return;
                  const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
                  const res = await fetch(`${base}/bookings/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wpToken}` },
                    body: JSON.stringify({ bookingId: selectedEvent.bookingId })
                  });
                  if (!res.ok) throw new Error('Failed');
                  setSnack({ open: true, message: 'Booking canceled', severity: 'success' });
                  setCancelOpen(false);
                } catch (e) {
                  setSnack({ open: true, message: 'Unable to cancel', severity: 'error' });
                }
              }}
            >
              Yes, cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
        </Snackbar>
      </Box>
      </BackgroundImage>
      <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'user'} />
      <Popover open={Boolean(bgAnchorEl)} anchorEl={bgAnchorEl} onClose={()=>setBgAnchorEl(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Paper sx={{ p: 2, width: 360, maxHeight: 420, overflowY: 'auto' }} onScroll={async (e:any)=>{
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
        }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Search photos" value={bgSearch} onChange={(e)=>{ const v=e.target.value; setBgSearch(v); if(!v.trim()){ setBgResults([]); setBgPage(1);} }} fullWidth />
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
              {(!bgSearch.trim() ? getCuratedBackgrounds() : []).map((p, idx)=> (
                <Box key={`cur_${idx}`} role="button" tabIndex={0} aria-label="Use curated background" sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }} onKeyDown={async (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); (e.currentTarget as any).click?.(); } }} onClick={async ()=>{
                  const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                  const next = { url: p.url, thumbUrl: p.thumbUrl } as any;
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
                    const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as any;
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
      <Fab color="default" aria-label="Background" onClick={(e)=>setBgAnchorEl(e.currentTarget)} sx={{ position: 'fixed', right: 20, bottom: 92, zIndex: 2000, bgcolor: 'rgba(255,255,255,0.9)', color: '#4a7c8c' }}>
        <WallpaperIcon />
      </Fab>
    </MainLayout>
  );
}