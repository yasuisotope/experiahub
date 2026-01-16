'use client';

// Route segment config removed as this is a Client Component
// useSearchParams usage automatically opts into dynamic rendering where needed


import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Paper, Typography, Alert, Button, Stack, TextField, List, ListItemButton, ListItemText, Divider, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, MenuItem, Select, FormControl, InputLabel, Chip, Fade, Skeleton, Container, Grid, Tooltip, CircularProgress, ToggleButtonGroup, ToggleButton, Fab, Popover, Tabs, Tab } from '@mui/material';
import { FormControlLabel, Switch } from '@mui/material';
// BackgroundImage removed

import ClearIcon from '@mui/icons-material/Clear';
import Image from 'next/image';
import { Add as AddIcon, Edit as EditIcon, DeleteOutline as DeleteOutlineIcon, Close as CloseIcon, CheckCircleOutline as CheckCircleOutlineIcon, Apartment as ApartmentIcon, PersonOutline as PersonOutlineIcon, Collections as CollectionsIcon, ContentCopy as ContentCopyIcon, Share as ShareIcon, Save as SaveIcon, PlayArrow as PlayArrowIcon, Check as CheckIcon, Sync as SyncIcon, Key as KeyIcon, VpnKey as VpnKeyIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { AuthService } from '@/services/authService';
import OnboardingForm from '@/components/supplier/OnboardingForm';
import SupportDialog from '@/components/support/SupportDialog';
import GridLikeMedia from '@/components/supplier/GridLikeMedia';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import { getUserBackground, setUserBackground, searchUnsplash, trackDownload, loadCachedBackground, saveCachedBackground, getCuratedBackgrounds, prefetchBackgroundImage, type PortalBackground } from '@/services/backgroundService';
import { trackBackgroundChange, trackBackgroundRemove } from '@/services/analytics';

const getBaseUrl = () => {
  // Use local proxy to avoid CORS and Env issues
  return '/api/n8n';
};
const N8N_BASE = getBaseUrl();
// Removed exposed TOKENS_API_KEY. Now handled in /api/supplier/tokens

async function parseJsonSafe(res: Response): Promise<any | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("[SupplierPortal] JSON Parse Error:", e);
    return null;
  }
}

const defaultTimeZone = 'Asia/Tokyo';

// GridLikeMedia definition moved to @/components/supplier/GridLikeMedia.tsx

function ActivitiesSkeleton({ experiences, onUpdate, onSave, onToast, onEditDetails }: { experiences: any[]; onUpdate: React.Dispatch<React.SetStateAction<any[]>>; onSave: (exps: any[]) => Promise<void>; onToast: (m: string) => void; onEditDetails?: (activity: any) => void }) {
  type Activity = {
    id: string;
    title: string;
    summary: string;
    city: string;
    durationMinutes: string;
    maxParticipants?: string;
    minParticipants?: string;
    category?: string;
    price?: string;
    currency?: string;
    cancellationPolicy?: string;
    bookingLeadTime?: string;
    bookingLink?: string;
    languages?: string;
    schedulingMode?: string;
    startTimes?: string;
    cutoffHours?: string;
    pricingCategories?: string;
    baseRate?: string;
    bokunProductId?: string;
    authenticEchoes?: string;
    unforgettableFeeling?: string;
    magicMoment?: string;
    hiddenGem?: string;
    communityConnection?: string;
    perfectMatch?: string;
    threeWords?: string;
    safetyMeasures?: string;
    requirements?: string;
    included?: string;
    notIncluded?: string;
    insurance?: string;
  };
  /* State lifted to parent */
  const rows = experiences;
  const setRows = onUpdate;
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Activity | null>(null);
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [city, setCity] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState('');
  const [maxPart, setMaxPart] = React.useState('');
  const [minPart, setMinPart] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [currency, setCurrency] = React.useState('JPY');
  const [cancelPolicy, setCancelPolicy] = React.useState('');
  const [leadTime, setLeadTime] = React.useState('');
  const [bookingLink, setBookingLink] = React.useState('');
  const [languages, setLanguages] = React.useState('');
  const [schedulingMode, setSchedulingMode] = React.useState('');
  const [startTimes, setStartTimes] = React.useState('');
  const [cutoffHours, setCutoffHours] = React.useState('');
  const [pricingCategories, setPricingCategories] = React.useState('');
  const [baseRate, setBaseRate] = React.useState('');
  const [filterText, setFilterText] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'title'|'city'|'durationMinutes'|'price'>('title');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('asc');
  const [inlineId, setInlineId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [rowErrors, setRowErrors] = React.useState<Record<string, string[]>>({});
  const [undo, setUndo] = React.useState<{ id: string; row: Activity } | null>(null);
  const appId = React.useMemo(() => { try { return localStorage.getItem('supplier_application_id') || ''; } catch { return ''; } }, []);

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setCity('');
    setDurationMinutes('');
    setMaxPart('');
    setMinPart('');
    setCategory('');
    setPrice('');
    setCurrency('JPY');
    setCancelPolicy('');
    setLeadTime('');
    setBookingLink('');
    setLanguages('');
    setSchedulingMode('');
    setStartTimes('');
    setCutoffHours('');
    setPricingCategories('');
    setBaseRate('');
    setEditing(null);
  };
  const openAdd = () => { resetForm(); setOpen(true); };
  const openEdit = (a: Activity) => {
    setEditing(a);
    setTitle(a.title);
    setSummary(a.summary || '');
    setCity(a.city || '');
    setDurationMinutes(a.durationMinutes || '');
    setMaxPart(a.maxParticipants || '');
    setMinPart(a.minParticipants || '');
    setCategory(a.category || '');
    setPrice(a.price || '');
    setCurrency(a.currency || 'JPY');
    setCancelPolicy(a.cancellationPolicy || '');
    setLeadTime(a.bookingLeadTime || '');
    setBookingLink(a.bookingLink || '');
    setLanguages(a.languages || '');
    setSchedulingMode(a.schedulingMode || '');
    setStartTimes(a.startTimes || '');
    setCutoffHours(a.cutoffHours || (a.bookingLeadTime || ''));
    setPricingCategories(a.pricingCategories || '');
    setBaseRate(a.baseRate || '');
    setOpen(true);
  };
  const remove = (id: string) => {
    setRows((rs) => {
      const found = rs.find((r) => r.id === id);
      if (found) setUndo({ id, row: found });
      return rs.filter((r) => r.id !== id);
    });
    onToast('Deleted. Undo?');
  };

  // LocalStorage logic removed - handled by parent component



  const saveAll = async () => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const payload = { applicationId: appId, activities: rows.map(({ id, ...rest }) => ({ ...rest, id })) };
      const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await parseJsonSafe(res) || {};
      
      if (!res.ok) {
           throw new Error(json.error || `Server Error ${res.status}`);
      }
      
      if (json.idMappings) {
           // Update temp IDs to real IDs
           setRows(prev => prev.map(r => {
                if (json.idMappings[r.id]) {
                     return { ...r, id: json.idMappings[r.id] };
                }
                return r;
           }));
      }

      onToast('Activities saved');
    } catch (e: any) {
      console.error('Save Error:', e);
      onToast(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const submitForm = () => {
    if (!title.trim()) { onToast('Title required'); return; }
    const next: Activity = {
      ...editing, // Preserve existing fields (like authenticEchoes) NOT managed by this form!
      id: editing?.id || `row_${Date.now()}`,
      title,
      summary,
      city,
      durationMinutes,
      maxParticipants: maxPart,
      minParticipants: minPart,
      category,
      price,
      currency,
      cancellationPolicy: cancelPolicy,
      bookingLeadTime: leadTime,
      bookingLink,
      languages,
      schedulingMode,
      startTimes,
      cutoffHours,
      pricingCategories,
      baseRate,
      bokunProductId: editing?.bokunProductId || ''
    };
    const updatedRows = editing ? rows.map((r) => (r.id === editing.id ? next : r)) : [next, ...rows];
    setRows(updatedRows);
    onSave(updatedRows); // Persist immediately
    setOpen(false); resetForm();
  };

  const fetchHasAnyPhoto = React.useCallback(async (activityIdForCheck?: string): Promise<boolean> => {
    if (!appId) return false;
    try {
      const params = new URLSearchParams({ applicationId: appId });
      if (activityIdForCheck) params.set('activityId', activityIdForCheck);
      const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`);
      const json = await parseJsonSafe(res);
      const urls = json?.photosDriveUrls || [];
      return Array.isArray(urls) && urls.length > 0;
    } catch { return false; }
  }, [appId]);

  const validateActivity = async (a: Activity): Promise<string[]> => {
    const errors: string[] = [];
    // Tier 1 (Draft)
    if (!a.title?.trim()) errors.push('Tier 1: Title is required');
    if (!a.summary?.trim()) errors.push('Tier 1: Description is required');
    if (!a.durationMinutes?.trim()) errors.push('Tier 1: Duration (minutes) is required');
    if (!a.city?.trim()) errors.push('Tier 1: City (LOCATION) is required');
    if (!a.category?.trim()) errors.push('Tier 1: Category (CATEGORIES) is required');
    const hasPhoto = await fetchHasAnyPhoto(a.id);
    if (!hasPhoto) errors.push('Tier 1: At least one photo is required');
    // Tier 2 (Bookable)
    if (!a.schedulingMode?.trim()) errors.push('Tier 2: Scheduling mode is required');
    if (!a.startTimes?.trim()) errors.push('Tier 2: Start times/hours are required');
    if (!a.maxParticipants?.toString().trim()) errors.push('Tier 2: Capacity (max participants) is required');
    if (!(a.cutoffHours || a.bookingLeadTime)?.toString().trim()) errors.push('Tier 2: Cutoff/lead time is required');
    if (!a.currency?.trim()) errors.push('Tier 2: Currency is required');
    if (!a.pricingCategories?.trim()) errors.push('Tier 2: At least one pricing category is required');
    if (!a.baseRate?.toString().trim() && !a.price?.toString().trim()) errors.push('Tier 2: At least one rate is required');
    return errors;
  };

  const onSync = async (a: Activity) => {
    if (!appId) { onToast('Missing application ID'); return; }
    const errs = await validateActivity(a);
    if (errs.length) {
      setRowErrors((m) => ({ ...m, [a.id]: errs }));
      onToast('Please fix validation errors');
      return;
    }
    setRowErrors((m) => ({ ...m, [a.id]: [] }));
    try {
      const payload = {
        applicationId: appId,
        activity: {
          ...a,
          DESCRIPTION: a.summary,
          DURATION: a.durationMinutes,
          LOCATION: a.city,
          CATEGORIES: a.category,
          PRICING: { baseRate: a.baseRate || a.price, currency: a.currency },
          PRICING_CATEGORIES: a.pricingCategories,
          RATES: [{ name: 'Base', amount: a.baseRate || a.price, currency: a.currency }],
          AVAILABILITY_RULES: { schedulingMode: a.schedulingMode, startTimes: a.startTimes },
          CUTOFF: a.cutoffHours || a.bookingLeadTime,
          EXTERNAL_ID: a.id,
          // Marketing & Story (Restored Fields)
          AUTHENTIC_ECHOES: a.authenticEchoes,
          UNFORGETTABLE_FEELING: a.unforgettableFeeling,
          MAGIC_MOMENT: a.magicMoment,
          HIDDEN_GEM: a.hiddenGem,
          COMMUNITY_CONNECTION: a.communityConnection,
          PERFECT_MATCH: a.perfectMatch,
          THREE_WORDS: a.threeWords,
          // Logistics & Safety
          SAFETY_MEASURES: a.safetyMeasures,
          REQUIREMENTS: a.requirements,
          INCLUDED: a.included,
          NOT_INCLUDED: a.notIncluded,
          INSURANCE: a.insurance
        }
      };
      const res = await fetch(`${N8N_BASE}/supplier/activities/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await parseJsonSafe(res);
      if (!json) {
        if (res.ok) { onToast('Published (No ID returned)'); return; }
        throw new Error('Sync failed (Empty response)');
      }
      if (!json?.success) throw new Error(json?.error || 'Sync failed');
      const bokunId = json.bokunProductId || '';
      setRows((rs) => rs.map((r) => r.id === a.id ? { ...r, bokunProductId: bokunId } : r));
      onToast(`Published! ID: ${bokunId || 'Pending'}`);
    } catch (e: any) {
      onToast(e?.message || 'Publish failed');
    }
  };



  const isPublishable = (r: Activity) => {
    // Basic check: must have title, city, duration, and at least one story element or logistic element
    return !!(r.title && r.city && r.durationMinutes);
  };

  return (
    <Box>


      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField 
        placeholder="Filter experiences..." 
        size="small" 
        value={filterText} 
        onChange={(e) => setFilterText(e.target.value)} 
        sx={{ bgcolor: '#fff', borderRadius: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Select 
            size="small" 
            value={sortKey} 
            onChange={(e) => setSortKey(e.target.value as any)}
            sx={{ bgcolor: '#fff', borderRadius: 1 }}
        >
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="city">City</MenuItem>
          <MenuItem value="durationMinutes">Duration</MenuItem>
          <MenuItem value="price">Price</MenuItem>
        </Select>
        <Select 
            size="small" 
            value={sortDir} 
            onChange={(e) => setSortDir(e.target.value as any)}
            sx={{ bgcolor: '#fff', borderRadius: 1 }}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd} sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#020080' }, borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}>Add</Button>
          <Button variant="outlined" onClick={saveAll} disabled={saving} sx={{ borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#010057', borderColor: '#010057' }}>{saving ? 'Saving…' : 'Save all'}</Button>
          {undo && (
            <Button size="small" onClick={() => { setRows((rs)=>[undo.row, ...rs]); setUndo(null); setTimeout(()=>onToast('Restored'), 0); }}>Undo</Button>
          )}
        </Stack>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Title</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>City</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Duration (min)</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Price</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Bókun</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows
            .filter(r => [r.title,r.city,r.durationMinutes].join(' ').toLowerCase().includes(filterText.toLowerCase()))
            .sort((a,b)=>{ const va=(a as any)[sortKey]||''; const vb=(b as any)[sortKey]||''; const comp=String(va).localeCompare(String(vb),undefined,{numeric:true,sensitivity:'base'}); return sortDir==='asc'?comp:-comp; })
            .map((r) => (
            <TableRow key={r.id} hover>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.title} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,title:e.target.value}:x))} /> : r.title}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.city} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,city:e.target.value}:x))} /> : r.city}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.durationMinutes} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,durationMinutes:e.target.value}:x))} /> : r.durationMinutes}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.price||''} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,price:e.target.value}:x))} /> : (r.price||'')}</TableCell>
              <TableCell align="center">{r.bokunProductId ? <Typography variant="caption" sx={{ color: '#2e7d32' }}>{r.bokunProductId}</Typography> : <Typography variant="caption" sx={{ color: '#999' }}>—</Typography>}</TableCell>
              <TableCell align="center">
                {inlineId===r.id ? (
                  <Button size="small" onClick={()=>setInlineId(null)}>Done</Button>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton onClick={() => { setInlineId(r.id); }} size="small"><EditIcon fontSize="small" /></IconButton>
                      <IconButton onClick={() => { if (window.confirm('Delete this experience?')) remove(r.id); }} size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => {
                      const copy = { ...r, id: `row_${Date.now()}` as string, title: r.title ? `${r.title} (Copy)` : 'Untitled (Copy)', bokunProductId: '' } as any;
                      setRows(rs => [copy, ...rs]);
                      onToast('Experience duplicated');
                    }}>Duplicate</Button>
                    <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#010057', borderColor: '#010057', whiteSpace: 'nowrap' }} onClick={()=>onEditDetails && onEditDetails(r)}>Add Details</Button>
                    <Button size="small" variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={()=>onSync(r)}>Publish</Button>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ))}
          {rows.map((r) => (
            rowErrors[r.id]?.length ? (
              <TableRow key={`${r.id}_errors`}>
                <TableCell colSpan={6}>
                  <Alert severity="error">
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Fix the following to sync:</Typography>
                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                      {rowErrors[r.id].map((e, i) => (<li key={i}><Typography variant="caption">{e}</Typography></li>))}
                    </ul>
                  </Alert>
                </TableCell>
              </TableRow>
            ) : null
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={4} align="center" sx={{ color: '#777' }}>No experiences yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Title" helperText="Product title in Bokun (short, clear)" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField label="Summary" helperText="Short description (one or two sentences)" value={summary} onChange={(e)=>setSummary(e.target.value)} fullWidth multiline minRows={2} />
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} fullWidth />
              <TextField label="Duration (minutes)" type="number" inputProps={{ min: 0, step: 1 }} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="Max participants" type="number" inputProps={{ min: 1, step: 1 }} value={maxPart} onChange={(e)=>setMaxPart(e.target.value)} fullWidth />
              <TextField label="Min participants" type="number" inputProps={{ min: 1, step: 1 }} value={minPart} onChange={(e)=>setMinPart(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="Category" helperText="E.g., Tours, Activities, Culinary" value={category} onChange={(e)=>setCategory(e.target.value)} fullWidth />
              <TextField label="Price" type="number" inputProps={{ min: 0, step: '0.01' }} value={price} onChange={(e)=>setPrice(e.target.value)} fullWidth />
              <TextField label="Currency" value={currency} onChange={(e)=>setCurrency(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="Scheduling mode" helperText="fixed_start_times | opening_hours" value={schedulingMode} onChange={(e)=>setSchedulingMode(e.target.value)} fullWidth />
              <TextField label="Start times / hours" helperText="e.g. 09:00, 13:00 or 09:00-17:00" value={startTimes} onChange={(e)=>setStartTimes(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="Cutoff / Lead time (hours)" type="number" inputProps={{ min: 0, step: 1 }} value={cutoffHours} onChange={(e)=>setCutoffHours(e.target.value)} fullWidth />
              <TextField label="Pricing categories" helperText="e.g. Adult, Child" value={pricingCategories} onChange={(e)=>setPricingCategories(e.target.value)} fullWidth />
              <TextField label="Base rate" helperText="numeric amount" type="number" inputProps={{ min: 0, step: '0.01' }} value={baseRate} onChange={(e)=>setBaseRate(e.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField label="Cancellation policy" value={cancelPolicy} onChange={(e)=>setCancelPolicy(e.target.value)} fullWidth />
              <TextField label="Booking lead time" helperText="Minimum time before start to accept bookings" value={leadTime} onChange={(e)=>setLeadTime(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Booking link" value={bookingLink} onChange={(e)=>setBookingLink(e.target.value)} fullWidth />
            <TextField label="Languages (comma-separated)" value={languages} onChange={(e)=>setLanguages(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submitForm} variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}>{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

function PricingScheduleSkeleton({ onToast }: { onToast: (m: string) => void }) {
  const [pricingNotes, setPricingNotes] = React.useState('');
  const [scheduleNotes, setScheduleNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const appId = React.useMemo(() => { try { return localStorage.getItem('supplier_application_id') || ''; } catch { return ''; } }, []);

  React.useEffect(() => {
    const load = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/pricing/get?applicationId=${encodeURIComponent(appId)}`);
        const json = await parseJsonSafe(res);
        if (json?.success && json.notes) {
          setPricingNotes(json.notes.pricingNotes || '');
          setScheduleNotes(json.notes.scheduleNotes || '');
        }
      } catch {}
    };
    load();
  }, [appId]);

  const onSave = async () => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${N8N_BASE}/supplier/pricing/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, notes: { pricingNotes, scheduleNotes } })
      });
      const json = await parseJsonSafe(res);
      if (!json) { if (res.ok) return; throw new Error('Save failed'); }
      if (!json.success) throw new Error(json.error || 'Save failed');
      onToast('Saved');
    } catch (e: any) { onToast(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <Stack spacing={2}>
      <TextField label="Pricing Notes" value={pricingNotes} onChange={(e) => setPricingNotes(e.target.value)} multiline minRows={4} fullWidth />
      <TextField label="Schedule Notes" value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} multiline minRows={4} fullWidth />
      <Stack direction="row" spacing={1}>
        <Button onClick={onSave} disabled={saving} variant="contained" sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#020080' }, fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}>{saving ? 'Saving…' : 'Save'}</Button>
      </Stack>
    </Stack>
  );
}

// Hook moved to top level logic in component
function useSupplierAppIdInternal() {
  const params = useSearchParams();
  const [appId, setAppId] = React.useState<string>('');
  React.useEffect(() => {
    const fromUrl = params?.get('appId') || params?.get('id') || '';
    const fromStorage = typeof window !== 'undefined' ? (localStorage.getItem('supplier_application_id') || '') : '';
    const ensure = fromUrl || fromStorage;
    if (ensure) {
      setAppId(ensure);
      try { localStorage.setItem('supplier_application_id', ensure); } catch {}
    }
  }, [params]);
  return appId;
}
// function useSupplierAppId() removed as it was buggy. Logic is now inside component.

export default function SupplierPortalPage() {
  const { isLoggedIn, isLoading, logout, login, user } = useSupplierAuth() as any;
  const appId = useSupplierAppIdInternal();
  const [bg, setBg] = React.useState<PortalBackground | null>(null);
  const [bgAnchorEl, setBgAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bgSearch, setBgSearch] = React.useState<string>('');
  const [bgResults, setBgResults] = React.useState<any[]>([]);
  const [bgLoading, setBgLoading] = React.useState<boolean>(false);
  const [bgPage, setBgPage] = React.useState<number>(1);
  const [bgLoadingMore, setBgLoadingMore] = React.useState<boolean>(false);
  const [bgSeed, setBgSeed] = React.useState<number>(0);
  const [statusData, setStatusData] = React.useState<any>(null);
  // Stable curated list to prevent re-render flicker
  const [curatedBgs] = React.useState<PortalBackground[]>(() => getCuratedBackgrounds());

  // Load saved background on mount
  React.useEffect(() => {
    const loadBg = async () => {
      try {
        const token = AuthService.getToken();
        const cached = loadCachedBackground('supplier'); 
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) { setBg(server); saveCachedBackground(server, 'supplier'); }
      } catch {}
    };
    loadBg();
  }, []);

  const loadRandomBg = React.useCallback(async () => {
    try {
      setBgLoading(true);
      const topics = ['nature','city','ocean','mountains','forest','sky','beach','night','sunset','architecture'];
      const q = topics[Math.floor(Math.random() * topics.length)];
      const results = await searchUnsplash(q, 1, 30);
      setBgResults(Array.isArray(results) ? results : []);
      setBgPage(1);
    } finally { setBgLoading(false); }
  }, [setBgLoading, setBgResults, setBgPage]);
  // Load fresh random images when opening the Background picker with no query
  // Load fresh random images when opening the Background picker with no query
  // Load fresh random images when opening the Background picker with no query
  React.useEffect(() => {
    (async () => {
      if (!bgAnchorEl) return;
      if (bgSearch.trim()) return;
      try {
        setBgLoading(true);
        const topics = ['nature','city','ocean','mountains','forest','sky','beach','night','sunset','architecture'];
        const q = topics[Math.floor(Math.random() * topics.length)];
        const results = await searchUnsplash(q, 1, 30);
        if (Array.isArray(results) && results.length > 0) {
          setBgResults(results);
        } else {
           // Fallback if Unsplash key is invalid or quota exceeded
          setBgResults(getCuratedBackgrounds()); 
        }
        setBgPage(1);
      } catch {
        setBgResults(getCuratedBackgrounds());
      } finally {
        setBgLoading(false);
      }
    })();
  }, [bgAnchorEl, bgSeed, bgSearch]);
  const [tab, setTab] = React.useState<number>(0);
  const [section, setSection] = React.useState<'welcome'|'company'|'user'|'experiences'|'information'>('company');
  const [toast, setToast] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<{ section: string; timestamp: string } | null>(null);
  const handleSaveSuccess = (sectionName: string) => {
    setSaveSuccess({ section: sectionName, timestamp: new Date().toLocaleString() });
    setToast(`${sectionName} saved`);
  };
  const [subsection, setSubsection] = React.useState<'profile'|'billing'|'legal'|'locations'|'user_profile'|'user_security'|'user_tokens'|'overview'|'details'|'media'|'pricing'|'availability'|'policies'|'distribution'|'validation'|'sync'|'payouts_overview'|'payouts_connect'|'resources'|'reports'|'help'|'status'>('profile');
  const [activitiesSimple, setActivitiesSimple] = React.useState<{ id: string; title: string }[]>([]);
  const [selectedExperienceId, setSelectedExperienceId] = React.useState<string>('');
  type Experience = {
    id: string;
    title: string;
    summary: string;
    itinerary?: string;
    meetingPoint?: string;
    city: string;
    durationMinutes: string;
    maxParticipants?: string;
    minParticipants?: string;
    category?: string;
    price?: string;
    currency?: string;
    cancellationPolicy?: string;
    bookingLeadTime?: string;
    bookingLink?: string;
    languages?: string;
    schedulingMode?: string;
    startTimes?: string;
    cutoffHours?: string;
    pricingCategories?: string;
    baseRate?: string;
    timeZone?: string;
    latitude?: string;
    longitude?: string;
    ratesJson?: string;
    bokunProductId?: string;
    airtableId?: string;
    lastSyncedAt?: string;
    authenticEchoes?: string;
    unforgettableFeeling?: string;
    magicMoment?: string;
    hiddenGem?: string;
    communityConnection?: string;
    perfectMatch?: string;
    threeWords?: string;
    safetyMeasures?: string;
    requirements?: string;
    included?: string;
    notIncluded?: string;
    insurance?: string;
  };
  const [experiences, setExperiences] = React.useState<Experience[]>([]);
  const [details, setDetails] = React.useState<Partial<Experience>>({});
  const [validating, setValidating] = React.useState(false);
  const [validationIssues, setValidationIssues] = React.useState<string[]>([]);
  const [validationMap, setValidationMap] = React.useState<Record<string, number>>({});
  const defaultTimeZone = 'Asia/Tokyo';
const defaultCurrency = 'USD';

// Standardized button style matching OnboardingForm "Save Profile"
const PRIMARY_BUTTON_SX = {
  px: 3, py: 0.8, borderRadius: 1,
  bgcolor: '#010057', color: '#fff',
  fontWeight: 700, fontFamily: 'Nunito, sans-serif',
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(1, 0, 87, 0.2)',
  transition: 'all 0.5s ease',
  width: 'fit-content',
  alignSelf: 'flex-end',
  '&:hover': {
    bgcolor: '#ffbf00',
    boxShadow: '0 6px 16px rgba(255, 191, 0, 0.3)',
    transform: 'translateY(-1px)'
  }
};
  const SUGGESTED_CATEGORIES = React.useMemo(() => ['Cultural','Food & Drink','Adventure','Nature','Sightseeing','Wellness','Nightlife','Workshops','Museums'], []);
  const TIME_ZONES = React.useMemo(() => ['UTC','Asia/Tokyo','America/Los_Angeles','Europe/London'], []);
  const [pricingRows, setPricingRows] = React.useState<{ category: string; amount: string; currency: string }[]>([]);
  const [alsoUpsertAirtable, setAlsoUpsertAirtable] = React.useState<boolean>(false);
  // Stripe status placeholders (filled by n8n later)
  const [payoutStatus, setPayoutStatus] = React.useState<'pending'|'verified'|'unknown'>('unknown');
  const [stripeAccountId, setStripeAccountId] = React.useState<string>('');
  const [stripeDashboardUrl, setStripeDashboardUrl] = React.useState<string>('');
  const [hasBegun, setHasBegun] = React.useState(false);
  const [showAuth, setShowAuth] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<'login' | 'signup'>('login');
  // Transparency State - Moved to top level to avoid conditional hook error
  const [isTransparent, setIsTransparent] = React.useState(true);
  const [username, setUsername] = React.useState('');
  
  // Force 'signup' tab if we have an appId (Onboarding Flow)
  React.useEffect(() => {
    if (appId && !isLoggedIn) {
      setAuthTab('signup');
    }
  }, [appId, isLoggedIn]);
  const [password, setPassword] = React.useState('');
  const [suUsername, setSuUsername] = React.useState('');
  const [suEmail, setSuEmail] = React.useState('');
  const [suPassword, setSuPassword] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await login(username, password);
      // login helper in context handles localStorage but we can check success
      if (res?.error) throw new Error(res.error);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await (await import('@/services/authService')).AuthService.register(suUsername, suEmail, suPassword);
      if (!res.success) {
        setAuthError(res.error || 'Registration failed');
        return;
      }
      // Log them in automatically
      await login(suUsername, suPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    } finally {
      setAuthLoading(false);
    }
  };
  const refreshPayoutStatus = React.useCallback(async () => {
    if (!appId) return;
    try {
      const token = AuthService.getToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${N8N_BASE}/supplier/payouts/status?applicationId=${encodeURIComponent(appId)}`, { 
        cache: 'no-store',
        headers 
      });
      if (!res.ok) { setPayoutStatus('unknown'); setStripeAccountId(''); setStripeDashboardUrl(''); return; }
      const j = await res.json();
      const st = (j?.status || 'unknown').toLowerCase();
      setPayoutStatus(st === 'verified' ? 'verified' : (st === 'pending' ? 'pending' : 'unknown'));
      setStripeAccountId(j?.accountId || '');
      setStripeDashboardUrl(j?.dashboardUrl || '');
    } catch {
      setPayoutStatus('unknown'); setStripeAccountId(''); setStripeDashboardUrl('');
    }
  }, [appId]);

  React.useEffect(() => {
    if (section === 'company' && subsection.startsWith('payouts_')) {
      refreshPayoutStatus();
    }
  }, [section, subsection, refreshPayoutStatus]);

  React.useEffect(() => {
    if (!isLoading && !isLoggedIn && !appId) {
      // No redirect, just allow them to stay on the page and see the loggedOutView
    }
  }, [isLoading, isLoggedIn, appId]);

  React.useEffect(() => {
    if (section === 'user' && !bgSearch.trim()) {
      setBgSeed((s)=>s+1);
    }
  }, [section, bgSearch]);

  // Company forms placeholders
  const [companyBilling, setCompanyBilling] = React.useState<{ companyName: string; address: string; country: string; taxId: string; invoiceEmail: string; currency: string }>({ companyName: '', address: '', country: '', taxId: '', invoiceEmail: '', currency: defaultCurrency || 'JPY' });
  const [companyLegal, setCompanyLegal] = React.useState<{ legalName: string; regNumber: string; vatNumber: string; termsUrl: string; privacyUrl: string; representative: string }>({ legalName: '', regNumber: '', vatNumber: '', termsUrl: '', privacyUrl: '', representative: '' });
  const [companyLocations, setCompanyLocations] = React.useState<Array<{ name: string; address: string; city: string; country: string; timeZone: string }>>([{ name: '', address: '', city: '', country: '', timeZone: defaultTimeZone || 'UTC' }]);

  // Autosave for Billing and Legal (debounced)
  React.useEffect(() => {
    if (!appId) return;
    const t = setTimeout(async () => {
      try {
        setAutoSaving(true);
        const token = AuthService.getToken();
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await Promise.all([
          fetch(`${N8N_BASE}/supplier/company/billing/save`, { method: 'POST', headers, body: JSON.stringify({ applicationId: appId, billing: companyBilling }) }),
          fetch(`${N8N_BASE}/supplier/company/legal/save`, { method: 'POST', headers, body: JSON.stringify({ applicationId: appId, legal: companyLegal }) })
        ]);
      } catch {}
      finally { setAutoSaving(false); }
    }, 1200);
    return () => clearTimeout(t);
  }, [companyBilling, companyLegal, appId]);

  const sectionLabel = React.useMemo(() => {
    switch (section) {
      case 'welcome': return 'Welcome';
      case 'company': return 'Company';
      case 'user': return 'User';
      case 'experiences': return 'Experiences';
      case 'information': return 'Information';
      default: return '';
    }
  }, [section]);

  const subsectionLabel = React.useMemo(() => {
    const map: Record<string, string> = {
      profile: 'Profile', billing: 'Billing', legal: 'Legal', locations: 'Locations',
      user_profile: 'Profile', user_security: 'Security', user_tokens: 'API Tokens',
      overview: 'Overview', details: 'Details', media: 'Media', pricing: 'Pricing', availability: 'Availability', policies: 'Policies', distribution: 'Distribution', validation: 'Validation', sync: 'Sync',
      payouts_overview: 'Overview', payouts_connect: 'Stripe Connect',
      resources: 'Resources', reports: 'Reports', help: 'Help', status: 'Status'
    };
    return map[subsection] || '';
  }, [subsection]);
  const [showFieldErrors, setShowFieldErrors] = React.useState<boolean>(false);
  const [autoSaving, setAutoSaving] = React.useState<boolean>(false);
  const autoSaveTimerRef = React.useRef<any>(null);
  const [mediaOk, setMediaOk] = React.useState<boolean>(false);
  const [showForm, setShowForm] = React.useState<boolean>(false);
  
  // User forms placeholders
  const [userDisplayName, setUserDisplayName] = React.useState<string>('');
  const [userPhone, setUserPhone] = React.useState<string>('');
  type TokenRow = { uuid: string; name: string; created: number; last_used: number|null; last_ip: string|null };
  const [apiTokens, setApiTokens] = React.useState<TokenRow[]>([]);
  const [tokensUser, setTokensUser] = React.useState<string>('');
  const [tokensPassword, setTokensPassword] = React.useState<string>('');
  const [tokenName, setTokenName] = React.useState<string>('Supplier Portal');
  const [passwordCurrent, setPasswordCurrent] = React.useState<string>('');
  const [passwordNew, setPasswordNew] = React.useState<string>('');
  const [securitySubmitting, setSecuritySubmitting] = React.useState<boolean>(false);
  const securityAbortRef = React.useRef<AbortController | null>(null);
  const [tokensLoading, setTokensLoading] = React.useState<boolean>(false);
  const [tokenMutating, setTokenMutating] = React.useState<boolean>(false);
  const tokensAbortRef = React.useRef<AbortController | null>(null);
  const mediaOkCacheRef = React.useRef<Record<string, { ok: boolean; ts: number }>>({});
  const [tempAppId, setTempAppId] = React.useState<string>('');
  const [welcomeImgOk, setWelcomeImgOk] = React.useState<boolean>(true);
  const [supportOpen, setSupportOpen] = React.useState<boolean>(false);

  // Welcome dismissal (localStorage per appId)
  const welcomeKey = React.useMemo(() => (appId ? `supplier_welcome_dismissed:${appId}` : 'supplier_welcome_dismissed'), [appId]);
  const isWelcomeDismissed = React.useCallback(() => {
    try { return localStorage.getItem(welcomeKey) === '1'; } catch { return false; }
  }, [welcomeKey]);
  const dismissWelcome = React.useCallback(() => {
    try { localStorage.setItem(welcomeKey, '1'); } catch {}
    setSection('company');
    setSubsection('profile');
  }, [welcomeKey]);

  // Load per-user background (Unsplash selection persisted via n8n), fallback to cached local
  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!appId) return;
    if (!isWelcomeDismissed()) setSection('welcome');
  }, [appId, isWelcomeDismissed]);

  // Load All Supplier Identity & Company Data
  React.useEffect(() => {
    const doLoad = async () => {
      // 1. Immediate pre-fill from stored session if available
      const storedUser = AuthService.getUser();
      if (storedUser && storedUser.email) {
        console.log(`[SupplierPortal] Using session email: ${storedUser.email}`);
        setSuEmail(storedUser.email);
        if (storedUser.display_name && !userDisplayName) {
          setUserDisplayName(storedUser.display_name);
        }
      }

      if (!appId) {
        console.log("[SupplierPortal] No appId detected in URL or storage.");
        return;
      }

      const token = AuthService.getToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        console.log(`[SupplierPortal] Initiating handshake for appId: ${appId} at ${N8N_BASE}`);

        // A. Fetch Onboarding Status (Primary Source for New Suppliers / Supabase)
        // Updated to v2 to bypass ghost workflows
        const statusRes = await fetch(`${N8N_BASE}/supplier/onboarding/status-v2?applicationId=${encodeURIComponent(appId)}`, { 
          headers,
          cache: 'no-store'
        });
        
        if (statusRes.ok) {
          const fetchedStatus = await parseJsonSafe(statusRes);
          setStatusData(fetchedStatus);
          console.log(`[SupplierPortal] Handshake - Mapping Data:`, fetchedStatus);
          if (fetchedStatus && fetchedStatus.exists) {
            const statusData = fetchedStatus; // Local ref for logic below
            // Field mapping MUST match n8n version 3 output
            const primaryEmail = statusData.email || statusData.contactEmail || statusData.supplierEmail || '';
            const primaryName = statusData.fullName || statusData.businessName || '';
            
            if (primaryEmail) setSuEmail(String(primaryEmail));
            if (primaryName) setUserDisplayName(String(primaryName));
            if (statusData.phone) setUserPhone(String(statusData.phone));
            
            setCompanyBilling(prev => ({
              ...prev,
              companyName: statusData.businessName || primaryName || prev.companyName || '',
              invoiceEmail: primaryEmail || prev.invoiceEmail || '',
              country: statusData.country || prev.country
            }));
            
            setCompanyLegal(prev => ({
              ...prev,
              legalName: statusData.businessName || prev.legalName || ''
            }));

            if (statusData.city) {
              setCompanyLocations(prev => (prev.length === 1 && !prev[0].city) 
                ? [{ ...prev[0], city: statusData.city, country: statusData.country || prev[0].country }]
                : prev);
            }
            if (statusData.businessName) {
              const safeUser = statusData.businessName.replace(/[^a-zA-Z0-9]/g, '');
              setSuUsername(safeUser);
            }
          } else {
            console.warn(`[SupplierPortal] No Supabase record found for ID: ${appId}`);
            setSuEmail("ID Not Found"); // Visual feedback
          }
        } else {
          console.error(`[SupplierPortal] Status fetch failed: ${statusRes.status}`);
        }

        // B. Fetch WP Profile (Verified Account Data - may overwrite with more 'official' info)
        const profileRes = await fetch(`${N8N_BASE}/supplier/user/profile/get?applicationId=${encodeURIComponent(appId)}`, { headers });
        if (profileRes.ok) {
          const profileJson = await parseJsonSafe(profileRes);
          if (profileJson) {
            const p = profileJson.profile || profileJson.user || profileJson;
            if (p && (p.email || p.user_email)) {
              console.log("[SupplierPortal] WP Profile found, applying overrides:", p);
              const wpEmail = p.email || p.user_email || p.contactEmail;
              if (wpEmail) setSuEmail(String(wpEmail));
              if (p.display_name || p.displayName || p.full_name) {
                setUserDisplayName(String(p.display_name || p.displayName || p.full_name));
              }
              if (p.phone || p.phoneNumber) setUserPhone(String(p.phone || p.phoneNumber));
            }
          }
        }

        // C. Fetch specialized Company Data (Billing, Legal, Locations)
        // Only overwrite if these endpoints return actual data and we aren't already filled
        const [billRes, legRes, locRes] = await Promise.all([
          fetch(`${N8N_BASE}/supplier/company/billing/get?applicationId=${encodeURIComponent(appId)}`, { headers }),
          fetch(`${N8N_BASE}/supplier/company/legal/get?applicationId=${encodeURIComponent(appId)}`, { headers }),
          fetch(`${N8N_BASE}/supplier/company/locations/get?applicationId=${encodeURIComponent(appId)}`, { headers })
        ]);

        if (billRes.ok) {
          const bj = await billRes.json();
          if (bj?.success && bj.billing && (bj.billing.companyName || bj.billing.invoiceEmail)) {
            setCompanyBilling(bj.billing);
          }
        }
        if (legRes.ok) {
          const lj = await legRes.json();
          if (lj?.success && lj.legal && (lj.legal.legalName || lj.legal.regNumber)) {
            setCompanyLegal(lj.legal);
          }
        }
        if (locRes.ok) {
          const lcj = await locRes.json();
          if (lcj?.success && Array.isArray(lcj.locations) && lcj.locations.length > 0) {
            setCompanyLocations(lcj.locations);
          }
        }

      } catch (err) {
        console.error("[SupplierPortal] Handshake failed:", err);
      }
    };
    doLoad();
  }, [appId, N8N_BASE, isLoggedIn]);

  const appSignupUrl = React.useMemo(() => {
    const target = `/supplier?appId=${encodeURIComponent(appId)}`;
    const enc = encodeURIComponent(target);
    return `https://app.experiahub.com/login?tab=signup&next=${enc}`;
  }, [appId]);

  const appLoginUrl = React.useMemo(() => {
    const target = `/supplier?appId=${encodeURIComponent(appId)}`;
    const enc = encodeURIComponent(target);
    return `https://app.experiahub.com/login?next=${enc}`;
  }, [appId]);

  const heroImage = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80';

  // View definitions moved inline to main render

  React.useEffect(() => {
    const load = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await parseJsonSafe(res);
        if (json?.success && Array.isArray(json.activities)) {
          const mapped: Experience[] = json.activities.map((a: any, i: number) => ({
            id: a.id || `row_${i}`,
            title: a.title || '',
            summary: a.summary || a.description || '',
            city: a.city || '',
            durationMinutes: a.durationMinutes || a.duration || '',
            maxParticipants: a.maxParticipants || '',
            minParticipants: a.minParticipants || '',
            category: a.category || '',
            price: a.price || '',
            currency: a.currency || 'JPY',
            cancellationPolicy: a.cancellationPolicy || '',
            bookingLeadTime: a.bookingLeadTime || '',
            bookingLink: a.bookingLink || '',
            languages: Array.isArray(a.languages)? a.languages.join(', ') : (a.languages||''),
            schedulingMode: a.schedulingMode || '',
            startTimes: a.startTimes || '',
            cutoffHours: a.cutoffHours || (a.bookingLeadTime || ''),
            pricingCategories: a.pricingCategories || '',
            baseRate: a.baseRate || '',
            timeZone: a.timeZone || a.timezone || '',
            latitude: a.latitude || '',
            longitude: a.longitude || '',
            bokunProductId: a.bokunProductId || ''
          }));
          setExperiences(mapped);
          try {
             // Merge with local storage if newer (or at least preserve drafts)
             const localDetailed = JSON.parse(localStorage.getItem(`supplier_experiences_${appId}`) || '[]');
             if (Array.isArray(localDetailed) && localDetailed.length > 0) {
                const map = new Map(mapped.map(m=>[m.id, m]));
                localDetailed.forEach(l => {
                   if (!map.has(l.id)) map.set(l.id, l); // Add missing local
                   // Ideally we would merge fields but let's prioritize API unless it's a temp ID
                });
                setExperiences(Array.from(map.values()));
             }
          } catch {}
          const simple = mapped.map(m => ({ id: m.id, title: m.title || '(Untitled)' }));
          setActivitiesSimple(simple);
          if (!selectedExperienceId && simple.length > 0) setSelectedExperienceId(simple[0].id);
        }
      } catch {}
    };
    load();
  }, [appId]);

  React.useEffect(() => {
    try {
      const c = localStorage.getItem('supplier_default_currency') || '';
      const tz = localStorage.getItem('supplier_default_timezone') || '';
      // setDefaultCurrency(c); // Removed as defaultCurrency is now a constant
      // setDefaultTimeZone(tz); // Removed as defaultTimeZone is now a constant
    } catch {}
  }, []);

  // Restore last subsection and sort on first mount
  React.useEffect(() => {
    try {
      const last = localStorage.getItem('supplier_last_subsection');
      if (last) {
        setSubsection(last as any);
        if (last.startsWith('user_')) setSection('user');
        else if (['overview','details','media','pricing','availability','policies','distribution','validation','sync'].includes(last)) setSection('experiences');
        else if (['profile','billing','legal','locations'].includes(last)) setSection('company');
        else setSection('information');
      }
    } catch {}
  // run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist subsection
  React.useEffect(() => {
    try { localStorage.setItem('supplier_last_subsection', subsection); } catch {}
  }, [subsection]);

  // (Removed legacy sort persistence for an inner table to avoid referencing undefined setters)

  React.useEffect(() => {
    try {
      if (!appId) return;
      const raw = localStorage.getItem(`supplier_validation_${appId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setValidationMap(parsed);
      }
    } catch {}
  }, [appId]);

  // Load media OK cache from localStorage
  React.useEffect(() => {
    try {
      if (!appId) return;
      const raw = localStorage.getItem(`supplier_media_ok_${appId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') mediaOkCacheRef.current = parsed;
      }
    } catch {}
  }, [appId]);

  React.useEffect(() => {
    const current = experiences.find(e => e.id === selectedExperienceId);
    if (current) {
      const next: any = { ...current };
      if ((!next.currency || !String(next.currency).trim()) && defaultCurrency) next.currency = defaultCurrency;
      if ((!next.timeZone || !String(next.timeZone).trim()) && defaultTimeZone) next.timeZone = defaultTimeZone;
      setDetails(next);
      // Initialize pricing rows from details
      try {
        const cats = String(next.pricingCategories || '').split(',').map((s: string)=>s.trim()).filter(Boolean);
        const base = String(next.baseRate || next.price || '');
        const curr = String(next.currency || defaultCurrency || '');
        if (cats.length > 0) setPricingRows(cats.map((c: string) => ({ category: c, amount: base, currency: curr })));
        else if (base || curr) setPricingRows([{ category: '', amount: base, currency: curr }]);
        else setPricingRows([]);
      } catch { setPricingRows([]); }
    } else {
      setDetails({});
      setPricingRows([]);
    }
  }, [selectedExperienceId, experiences, defaultCurrency, defaultTimeZone]);
  // Update media OK badge when selection changes
  React.useEffect(() => {
    (async () => {
      try {
        if (!selectedExperienceId) { setMediaOk(false); return; }
        const ok = await fetchHasAnyPhotoFor(selectedExperienceId);
        setMediaOk(!!ok);
      } catch { setMediaOk(false); }
    })();
  }, [selectedExperienceId, experiences]);

  // Persist experiences to localStorage to prevent data loss on reload
  React.useEffect(() => {
    if (appId && experiences.length > 0) {
      try { localStorage.setItem(`supplier_experiences_${appId}`, JSON.stringify(experiences)); } catch {}
    }
  }, [experiences, appId]);

  // Sync experiences -> activitiesSimple
  React.useEffect(() => {
    setActivitiesSimple(experiences.map(e => ({ id: e.id, title: e.title || '(Untitled)' })));
  }, [experiences]);

  // Load activities from Remote (API) and merge with Local
  React.useEffect(() => {
    const loadRemote = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await parseJsonSafe(res);
        if (json?.success && Array.isArray(json.activities)) {
          const remoteRows = json.activities.map((a: any, i: number) => ({
            id: a.id || `row_${i}`,
            title: a.title || '',
            summary: a.summary || a.description || '',
            city: a.city || '',
            durationMinutes: a.durationMinutes || a.duration || '',
            maxParticipants: a.maxParticipants || '',
            minParticipants: a.minParticipants || '',
            category: a.category || '',
            price: a.price || '',
            currency: a.currency || 'JPY',
            cancellationPolicy: a.cancellationPolicy || '',
            bookingLeadTime: a.bookingLeadTime || '',
            bookingLink: a.bookingLink || '',
            languages: Array.isArray(a.languages)? a.languages.join(', ') : (a.languages||''),
            schedulingMode: a.schedulingMode || '',
            startTimes: a.startTimes || '',
            cutoffHours: a.cutoffHours || (a.bookingLeadTime || ''),
            pricingCategories: a.pricingCategories || '',
            baseRate: a.baseRate || '',
            bokunProductId: a.bokunProductId || '',
            // Populate restored fields if available from API
            authenticEchoes: a.authenticEchoes,
            unforgettableFeeling: a.unforgettableFeeling,
            magicMoment: a.magicMoment,
            hiddenGem: a.hiddenGem,
            communityConnection: a.communityConnection,
            perfectMatch: a.perfectMatch,
            threeWords: a.threeWords,
            safetyMeasures: a.safetyMeasures,
            requirements: a.requirements,
            included: a.included,
            notIncluded: a.notIncluded,
            insurance: a.insurance
          }));
          
          setExperiences((prev: Experience[]) => {
            const remoteMap = new Map(remoteRows.map((r: any) => [r.id, r]));
            const merged = [...remoteRows] as Experience[];
            
            // Add any local rows that don't exist in remote (Drafts)
            prev.forEach(p => {
               if (!remoteMap.has(p.id)) {
                 merged.push(p);
               }
            });
            return merged;
          });
        }
      } catch {}
    };
    loadRemote();
  }, [appId]);

  const saveAllExperiences = async (nextExperiences: Experience[]) => {
    if (!appId) return;
    const payload = { applicationId: appId, activities: nextExperiences };
    const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const json = await parseJsonSafe(res);
    if (!json) {
       // Tolerate empty body if status is 200
       if (res.ok) return; 
       throw new Error('Save failed (Empty response)');
    }
    if (!json?.success) throw new Error(json?.error || 'Save failed');

    if (json.idMappings) {
       setExperiences(prev => prev.map(r => {
            if (json.idMappings[r.id]) {
                 return { ...r, id: json.idMappings[r.id] };
            }
            return r;
       }));
       // If the currently selected experience just got a real ID, update selection
       // If the currently selected experience just got a real ID, update selection (using functional update to capture latest state)
       setSelectedExperienceId(currentId => {
          if (currentId && json.idMappings[currentId]) {
             const newId = json.idMappings[currentId];
             // Also update details object only if it matches the current ID being updated
             setDetails(prevDetails => {
                 // Check if the details object conceptually belongs to the activity whose ID is changing
                 // We assume if selectedExperienceId matches, details matches.
                 if (prevDetails.id === currentId || currentId) { 
                     return { ...prevDetails, id: newId };
                 }
                 return prevDetails;
             });
             return newId;
          }
          return currentId;
       });
    }
  };

  const onSaveDetails = async () => {
    if (!selectedExperienceId) { setToast('Select an Experience'); return; }
    try {
      const next = experiences.map(e => e.id === selectedExperienceId ? { ...e, ...details } as Experience : e);
      setExperiences(next);
      await saveAllExperiences(next);
      handleSaveSuccess('Experience');
    } catch (e: any) { setToast(e?.message || 'Save failed'); }
  };

  // Autosave on idle for Details / Availability / Policies / Pricing
  React.useEffect(() => {
    const eligible = section === 'experiences' && (subsection === 'details' || subsection === 'availability' || subsection === 'policies' || subsection === 'pricing');
    if (!eligible || !selectedExperienceId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const current = experiences.find(e => e.id === selectedExperienceId);
        if (!current) return;
        let merged: any = { ...current, ...details };
        if (subsection === 'pricing') {
          const catsCsv = pricingRows.map(r=>r.category).filter(Boolean).join(', ');
          const base = pricingRows[0]?.amount || merged.baseRate || '';
          const curr = pricingRows[0]?.currency || merged.currency || defaultCurrency || '';
          merged.pricingCategories = catsCsv;
          merged.baseRate = base;
          merged.currency = curr;
        }
        // Detect changes on key fields to avoid unnecessary saves
        const keys = ['title','summary','city','durationMinutes','category','maxParticipants','minParticipants','schedulingMode','startTimes','cutoffHours','bookingLeadTime','cancellationPolicy','timeZone','latitude','longitude','pricingCategories','baseRate','currency'];
        const hasChange = keys.some((k) => String((current as any)[k]||'') !== String(merged[k]||''));
        if (!hasChange) return;
        setAutoSaving(true);
        const next = experiences.map(e => e.id === selectedExperienceId ? merged as Experience : e);
        setExperiences(next);
        await saveAllExperiences(next);
      } catch {}
      finally { setAutoSaving(false); }
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, pricingRows, subsection, selectedExperienceId]);

  const fetchHasAnyPhotoFor = async (activityIdForCheck?: string): Promise<boolean> => {
    if (!appId) return false;
    const id = activityIdForCheck || '';
    const now = Date.now();
    const cached = id ? mediaOkCacheRef.current[id] : undefined;
    if (cached && (now - cached.ts) < 30000) return cached.ok;
    try {
      const params = new URLSearchParams({ applicationId: appId });
      if (id) params.set('activityId', id);
      const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`);
      const json = await parseJsonSafe(res);
      const urls = json?.photosDriveUrls || [];
      const ok = Array.isArray(urls) && urls.length > 0;
      if (id) {
        mediaOkCacheRef.current[id] = { ok, ts: now };
        try { localStorage.setItem(`supplier_media_ok_${appId}`, JSON.stringify(mediaOkCacheRef.current)); } catch {}
      }
      return ok;
    } catch {
      return cached ? cached.ok : false;
    }
  };

  // Load user security metadata on open (no secrets handled)
  React.useEffect(() => {
    if (subsection !== 'user_security' || !appId) return;
    if (securityAbortRef.current) securityAbortRef.current.abort();
    const controller = new AbortController();
    securityAbortRef.current = controller;
    (async () => {
      try {
        await fetch(`${N8N_BASE}/supplier/user/security/get?applicationId=${encodeURIComponent(appId)}`, { signal: controller.signal });
      } catch {}
    })();
    return () => controller.abort();
  }, [subsection, appId]);

  // Reset tokens view when opening tokens subsection (explicit Load triggers fetch)
  React.useEffect(() => {
    if (subsection !== 'user_tokens') return;
    setApiTokens([]);
  }, [subsection]);

  // tokensHeaders removed; API key is now server-side only

  const loadTokens = async () => {
    if (!tokensUser.trim() || !tokensPassword.trim()) { setToast('Enter login/email and current password'); return; }
    setTokensLoading(true);
    try {
      const res = await fetch('/api/supplier/tokens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', userLogin: tokensUser, userEmail: tokensUser, passwordCurrent: tokensPassword })
      });
      const json = await res.json();
      if (Array.isArray(json)) {
        setApiTokens(json);
      } else if (json?.uuid) {
        setApiTokens([json]);
      } else if (json?.success && Array.isArray(json.tokens)) {
        setApiTokens(json.tokens);
      } else {
        throw new Error(json?.error || json?.message || 'List failed');
      }
    } catch (e:any) { setToast(e?.message || 'List failed'); }
    finally { setTokensLoading(false); }
  };

  const createToken = async () => {
    if (!tokensUser.trim() || !tokensPassword.trim()) { setToast('Enter login/email and current password'); return; }
    setTokenMutating(true);
    try {
      const res = await fetch('/api/supplier/tokens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', userLogin: tokensUser, userEmail: tokensUser, passwordCurrent: tokensPassword, tokenName })
      });
      const json = await res.json();
      if (json?.password) {
        setToast(`Token created. Copy now: ${json.password}`);
        await loadTokens();
      } else if (json?.success && json?.token) {
        setToast(`Token created. Copy now: ${json.token.new_password || json.token.password}`);
        await loadTokens();
      } else {
        throw new Error(json?.error || json?.message || 'Create failed');
      }
    } catch (e:any) { setToast(e?.message || 'Create failed'); }
    finally { setTokenMutating(false); }
  };

  const deleteToken = async (uuid: string) => {
    if (!tokensUser.trim() || !tokensPassword.trim()) { setToast('Enter login/email and current password'); return; }
    setTokenMutating(true);
    try {
      const res = await fetch('/api/supplier/tokens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userLogin: tokensUser, userEmail: tokensUser, passwordCurrent: tokensPassword, uuid }) // Changed tokenUuid to uuid to match API
      });
      const json = await res.json();
      if (json?.deleted === true || json?.success) {
        setApiTokens(arr => arr.filter(t => t.uuid !== uuid));
        setToast('Token deleted');
      } else {
        throw new Error(json?.error || json?.message || 'Delete failed');
      }
      setToast('Token removed');
    } catch (e:any) { setToast(e?.message || 'Delete failed'); }
    finally { setTokenMutating(false); }
  };

  const validateSelected = async (): Promise<string[]> => {
    const a = experiences.find(e => e.id === selectedExperienceId);
    const issues: string[] = [];
    if (!a) { issues.push('No Experience selected'); return issues; }
    // Tier 1
    if (!a.title?.trim()) issues.push('Tier 1: Title is required');
    if (!(a.summary||'').trim()) issues.push('Tier 1: Description is required');
    if (!(a.durationMinutes||'').trim()) issues.push('Tier 1: Duration (minutes) is required');
    if (!(a.city||'').trim()) issues.push('Tier 1: City is required');
    if (!(a.category||'').trim()) issues.push('Tier 1: Category is required');
    const hasPhoto = await fetchHasAnyPhotoFor(a.id);
    if (!hasPhoto) issues.push('Tier 1: At least one photo is required');
    // Tier 2
    if (!(a.schedulingMode||'').trim()) issues.push('Tier 2: Scheduling mode is required');
    if (!(a.startTimes||'').trim()) issues.push('Tier 2: Start times/hours are required');
    if (!(a.maxParticipants||'').toString().trim()) issues.push('Tier 2: Capacity (max participants) is required');
    if (!((a.cutoffHours||'') || (a.bookingLeadTime||'')).toString().trim()) issues.push('Tier 2: Cutoff/lead time is required');
    if (!(a.currency||'').trim()) issues.push('Tier 2: Currency is required');
    if (!(a.pricingCategories||'').trim()) issues.push('Tier 2: At least one pricing category is required');
    if (!((a.baseRate||'') || (a.price||'')).toString().trim()) issues.push('Tier 2: At least one rate is required');
    return issues;
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      const issues = await validateSelected();
      setValidationIssues(issues);
      setToast(issues.length ? 'Validation failed' : 'All checks passed');
      setShowFieldErrors(true);
      if (selectedExperienceId) {
        setValidationMap((m) => {
          const next = { ...m, [selectedExperienceId]: issues.length };
          try { if (appId) localStorage.setItem(`supplier_validation_${appId}`, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } finally { setValidating(false); }
  };

  const syncSelected = async () => {
    const a = experiences.find(e => e.id === selectedExperienceId);
    if (!a) { setToast('Select an Experience'); return; }
    const issues = await validateSelected();
    if (issues.length) { setValidationIssues(issues); setShowFieldErrors(true); setToast('Please fix validation errors'); return; }
    try {
      const payload = {
        applicationId: appId,
        activity: {
          ...a,
          DESCRIPTION: a.summary,
          DURATION: a.durationMinutes,
          LOCATION: a.city,
          CATEGORIES: a.category,
          PRICING: { baseRate: a.baseRate || a.price, currency: a.currency },
          PRICING_CATEGORIES: a.pricingCategories,
          RATES: [{ name: 'Base', amount: a.baseRate || a.price, currency: a.currency }],
          AVAILABILITY_RULES: { schedulingMode: a.schedulingMode, startTimes: a.startTimes },
          CUTOFF: a.cutoffHours || a.bookingLeadTime,
          EXTERNAL_ID: a.id
        },
        alsoUpsertAirtable
      };
      const res = await fetch(`${N8N_BASE}/supplier/activities/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await parseJsonSafe(res);
      if (!json) {
         if (res.ok) { setToast('Synced (No content returned)'); return; }
         throw new Error('Server returned empty response');
      }
      if (!json?.success) throw new Error(json?.error || 'Sync failed');
      const bokunId = json.bokunProductId || '';
      const airtableId = json.airtableId || '';
      const next = experiences.map(e => e.id === a.id ? { ...e, bokunProductId: bokunId } : e);
      const nextWithMeta = next.map(e => e.id === a.id ? { ...e, airtableId: airtableId || e.airtableId, lastSyncedAt: new Date().toISOString() } : e);
      setExperiences(nextWithMeta);
      try { await saveAllExperiences(next); } catch {}
      setToast(`Synced to Bókun${bokunId ? ` (${bokunId})` : ''}${airtableId ? ` · Airtable ${airtableId}` : ''}`);
    } catch (e: any) { setToast(e?.message || 'Sync failed'); }
  };

  const getSectionChecks = () => {
    const a = experiences.find(e => e.id === selectedExperienceId);
    const checks: Record<string, { ok: boolean; count?: number }> = {
      details: { ok: !!(a?.title && a?.summary && a?.city && a?.durationMinutes && a?.category) },
      media: { ok: false },
      pricing: { ok: !!(a?.currency && ((a?.pricingCategories && a.pricingCategories.trim()) && ((a?.baseRate && String(a.baseRate).trim()) || (a?.price && String(a.price).trim())))) },
      availability: { ok: !!(a?.schedulingMode && a?.startTimes && (a?.cutoffHours || a?.bookingLeadTime) && a?.maxParticipants) },
      validation: { ok: (validationMap[selectedExperienceId] ?? 0) === 0, count: validationMap[selectedExperienceId] ?? 0 },
      sync: { ok: !!a?.bokunProductId }
    };
    // media check async substitute: assume true if we have anything saved in photos in details (not stored) → leave false; caller can ignore strictness
    return checks;
  };

  // Decide top-level view without affecting hooks order
  if (isLoading) {
    return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#010057' }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress sx={{ color: '#ffbf00' }} />
        <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#fff' }}>Entering Portal...</Typography>
      </Stack>
    </Box>
    );
  }

  if (!isLoggedIn) {

     return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url('${heroImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.6) saturate(1.2)',
          zIndex: -1
        }
      }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          transition: 'all 0.4s ease-in-out',
        }}>
          <Box sx={{ mb: 3 }}>
            <img src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png" alt="ExperiaHub" style={{ height: '32px', width: 'auto' }} />
          </Box>
          <Typography variant="overline" sx={{ color: '#ffbf00', fontWeight: 800, letterSpacing: 3, mb: 2, display: 'block' }}>
            {authTab === 'login' ? 'PARTNER PORTAL' : 'PARTNERSHIP APPROVED'}
          </Typography>
          
          <Typography variant="h3" sx={{ 
            color: '#010057', 
            fontFamily: 'Agrandir, serif', 
            fontWeight: 800, 
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            {authTab === 'login' ? 'Welcome Back' : (companyBilling.companyName || 'Welcome to the Portfolio')}
          </Typography>

          <Typography variant="body1" sx={{ color: '#64748B', fontFamily: 'Nunito, sans-serif', mb: 4, maxWidth: '90%', mx: 'auto' }}>
            {authTab === 'login' 
              ? 'Access your dashboard to manage experiences.' 
              : 'Finalize your credentials to activate your supplier access.'}
          </Typography>

          {/* Steps Grid - Equal Height */}
          <Grid container spacing={2} sx={{ mb: 4, textAlign: 'left', px: 2, alignItems: 'stretch' }}>
            {[
               { step: '01', title: 'Secure Access', desc: 'Create partner login.' },
               { step: '02', title: 'Direct Profile', desc: 'Verify business details.' },
               { step: '03', title: 'Portfolio Sync', desc: 'Connect inventory.' },
            ].map((item, i) => (
              <Grid item xs={12} sm={4} key={i} sx={{ display: 'flex' }}>
                <Box sx={{ p: 1.5, borderLeft: '2px solid #ffbf00', bgcolor: 'transparent', borderRadius: '0 4px 4px 0', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <Typography variant="caption" sx={{ color: '#ffbf00', fontWeight: 800, letterSpacing: 1, display: 'block' }}>STEP {item.step}</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#010057', fontWeight: 700, lineHeight: 1.2 }}>{item.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.1 }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {authError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Nunito, sans-serif' }}>
              {authError}
            </Alert>
          )}

          <Box component="form" onSubmit={authTab === 'login' ? handleLoginSubmit : handleSignupSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {authTab === 'signup' && (
              <TextField 
                fullWidth 
                label="Choose Username" 
                variant="outlined" 
                value={suUsername} 
                onChange={(e) => setSuUsername(e.target.value)}
                required disabled={authLoading}
                InputLabelProps={{ shrink: true }}
                placeholder="e.g. KyotoTours"
              />
            )}
            <TextField 
              fullWidth 
              label={authTab === 'login' ? "Username or Email" : "Confirmed Email"} 
              variant="outlined" 
              value={authTab === 'login' ? username : suEmail}
              onChange={(e) => authTab === 'login' ? setUsername(e.target.value) : setSuEmail(e.target.value)}
              required disabled={authLoading}
              InputLabelProps={{ shrink: true }}
              placeholder={authTab === 'signup' ? "checking..." : ""}
            />
            <TextField 
              fullWidth 
              label={authTab === 'login' ? "Password" : "Create Password"} 
              type="password" 
              variant="outlined" 
              value={authTab === 'login' ? password : suPassword}
              onChange={(e) => authTab === 'login' ? setPassword(e.target.value) : setSuPassword(e.target.value)}
              required disabled={authLoading}
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={authLoading}
              sx={{ 
                bgcolor: '#010057', 
                color: '#fff',
                py: 2, 
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '1.1rem',
                mt: 1,
                fontFamily: 'Agrandir, serif',
                textTransform: 'none',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 25px rgba(1, 0, 87, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: '#ffbf00', 
                  transform: 'translateY(-1px)',
                  boxShadow: '0 15px 35px rgba(197, 160, 89, 0.25)' 
                }
              }}
            >
              {authLoading ? <CircularProgress size={24} color="inherit" /> : (authTab === 'login' ? 'Enter Portal' : 'Activate Access')}
            </Button>

            <Box sx={{ mt: 2 }}>
              <Button 
                variant="text" 
                onClick={() => setAuthTab(authTab === 'login' ? 'signup' : 'login')}
                sx={{ 
                  color: '#475569', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  fontFamily: 'Nunito, sans-serif',
                  '&:hover': { color: '#010057', bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                {authTab === 'login' ? "Don't have an account? Set up access" : "Already have an account? Sign In"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Stack direction="row" justifyContent="center" spacing={3} sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', letterSpacing: 1 }}>
                ID: {appId || 'NONE'}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', color: isTransparent ? '#334155' : '#CBD5E1' }}>
              Build: 2026.01.15.2255_FIX_V21
            </Typography>
          </Box>
        </Paper>
      </Container>
      </Box>
    );
  }

  // Transparency State


  // Logged-in view with left sidebar
  return (
    // <BackgroundImage ...> replaced with fragment or direct Box to fix build error
    <>
      <Box sx={{
        minHeight: '100vh',
        py: 6,
        px: 2,
        bgcolor: 'rgba(255, 255, 255, 0.25)',
        backgroundImage: bg?.url ? `url("${bg.url}")` : 'radial-gradient(circle at 20% 10%, rgba(1, 0, 87, 0.05), transparent 45%), radial-gradient(circle at 80% 20%, rgba(255, 191, 0, 0.08), transparent 40%)',
        backgroundSize: bg?.url ? 'cover' : undefined,
        backgroundPosition: bg?.url ? 'center' : undefined,
        backgroundAttachment: bg?.url ? 'fixed' : undefined,
        backgroundRepeat: 'no-repeat'
      }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px 1fr' }, gap: 3, maxWidth: 1280, mx: 'auto' }}>
        {/* Sidebar */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2, 
          height: { xs: 'auto', md: 'calc(100vh - 48px)' },
          display: 'flex',
          flexDirection: 'column', 
          position: 'sticky', 
          top: 24, 
          width: { md: 250 }, 
          transition: 'all .3s ease',
          bgcolor: isTransparent ? 'rgba(255,255,255,0.6)' : '#fff',
          backdropFilter: isTransparent ? 'blur(12px)' : 'none',
          color: '#0F172A',
          border: '1px solid rgba(255,255,255,0.4)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
              alt="ExperiaHub Logo"
              style={{ height: 'auto', width: '100%', maxWidth: '200px' }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 700, color: '#010057', textAlign: 'center', mb: 2, lineHeight: 1.1 }}>
            Supplier Portal
          </Typography>


          
          <List>
            <ListItemButton selected={section==='welcome'} onClick={() => { setSection('welcome'); setTab(0); setSubsection('resources'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='welcome'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Welcome" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: section==='welcome'?700:500 }} />
            </ListItemButton>
            <ListItemButton selected={section==='company'} onClick={() => { setSection('company'); setTab(0); setSubsection('profile'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='company'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Company" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: section==='company'?700:500 }} />
            </ListItemButton>
            <ListItemButton selected={section==='user'} onClick={() => { setSection('user'); setTab(0); setSubsection('user_profile'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='user'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="User" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: section==='user'?700:500 }} />
            </ListItemButton>
            <ListItemButton selected={section==='experiences'} onClick={() => { setSection('experiences'); setTab(0); setSubsection('overview'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='experiences'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Experiences" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: section==='experiences'?700:500 }} />
            </ListItemButton>
            <ListItemButton selected={section==='information'} onClick={() => { setSection('information'); setTab(0); setSubsection('help'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='information'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Information" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: section==='information'?700:500 }} />
            </ListItemButton>
          </List>

          <Stack spacing={1} sx={{ mt: 2, mb: 2, px: 2, textAlign: 'center', bgcolor: 'rgba(1,0,87,0.03)', borderRadius: 2, py: 2, border: '1px solid rgba(1,0,87,0.05)' }}>
            <Box sx={{ py: 0 }}>
              <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 800, color: '#010057', lineHeight: 1.2, mb: 0.5 }}>
                {user?.display_name || userDisplayName || statusData?.businessName || companyBilling.companyName || 'ExperiaHub Partner'}
              </Typography>
              {appId && (
                <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>
                  ID: {appId}
                </Typography>
              )}
            </Box>
          </Stack>


          
            
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ mb: 2, borderColor: 'rgba(1,0,87,0.1)' }} />
            <FormControlLabel
               control={<Switch size="small" checked={isTransparent} onChange={(e)=>setIsTransparent(e.target.checked)} />}
               label={<Typography variant="caption" sx={{ fontFamily:'Nunito, sans-serif' }}>Translucent UI</Typography>}
               sx={{ mb: 1, ml: 0.5 }}
            />
            <Divider sx={{ mb: 2, borderColor: 'rgba(1,0,87,0.1)' }} />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" fullWidth onClick={() => window.location.reload()} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#64748B', fontWeight: 700, bgcolor: isTransparent?'rgba(255,255,255,0.5)':'#fff', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC', color: '#334155' } }}>Refresh</Button>
              {isLoggedIn ? (
                <Button variant="outlined" size="small" fullWidth onClick={() => { logout?.(); setHasBegun(false); }} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#64748B', fontWeight: 700, bgcolor: isTransparent?'rgba(255,255,255,0.5)':'#fff', '&:hover': { borderColor: '#FECACA', bgcolor: '#FEF2F2', color: '#DC2626' } }}>Log out</Button>
              ) : (
                <Button variant="contained" size="small" fullWidth sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }} onClick={() => { setHasBegun(false); }}>Sign in</Button>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* Main content */}
        <Paper sx={{
          p: 3,
          borderRadius: 1,
          bgcolor: isTransparent ? 'rgba(255,255,255,0.6)' : '#fff',
          color: '#3b4850',
          backdropFilter: isTransparent ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isTransparent ? 'blur(12px)' : 'none',
          color: '#0F172A',
          boxShadow: '0 8px 32px rgba(1, 0, 87, 0.05)',
          transition: 'transform .25s ease, opacity .25s ease',
          border: isTransparent ? '1px solid rgba(255,255,255,0.4)' : 'none'
        }}>
        {/* Header block: Row 1 title, Row 2 meta */}
        <Box sx={{ mb: 2 }}>

          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ color: '#4A7C8C', fontFamily: 'Nunito, sans-serif' }}>
              {sectionLabel}{subsectionLabel ? ` · ${subsectionLabel}` : ''}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">

              {!isLoggedIn && (
                <Chip
                  label="Guest Session"
                  size="small"
                  onClick={() => setHasBegun(false)}
                  sx={{ bgcolor: 'rgba(197, 160, 89, 0.1)', color: '#ffbf00', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(197, 160, 89, 0.3)' }}
                />
              )}
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ p: 0.5, borderRadius: 1, border: '1px solid rgba(74,124,140,0.18)', bgcolor: 'rgba(74,124,140,0.04)' }}>
                <Tooltip title="Copy ID">
                  <Button size="small" variant="outlined" startIcon={<ContentCopyIcon fontSize="small" />} sx={{ textTransform: 'none', borderRadius: 1, fontFamily: 'Nunito, sans-serif', color: '#010057', borderColor: 'transparent' }} onClick={async () => { try { await navigator.clipboard.writeText(appId || ''); setToast('App ID copied'); } catch { setToast('Copy failed'); } }}>Copy ID</Button>
                </Tooltip>
                <Button size="small" variant="outlined" startIcon={<ShareIcon fontSize="small" />} sx={{ textTransform: 'none', borderRadius: 1, fontFamily: 'Nunito, sans-serif', color: '#010057', borderColor: 'transparent' }} onClick={async () => {
                  const url = `https://app.experiahub.com/supplier?appId=${encodeURIComponent(appId || '')}`;
                  try { await navigator.clipboard.writeText(url); setToast('Share link copied'); } catch { setToast('Copy failed'); }
                }}>Share link</Button>
              </Stack>
              <Chip size="small" label={autoSaving ? 'Saving…' : 'Saved'} color={autoSaving ? 'warning' : 'success'} variant="outlined" />
            </Stack>
          </Box>
          <Divider sx={{ mt: 1.5, mb: 1.5 }} />
        </Box>

        
        {/* Navigation Tabs */}
        {section === 'company' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={subsection.startsWith('payouts_') ? 'payouts' : subsection} 
              onChange={(_, v) => setSubsection(v === 'payouts' ? 'payouts_overview' : v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
            >
              <Tab label="Profile" value="profile" />
              <Tab label="Billing" value="billing" />
              <Tab label="Legal" value="legal" />
              <Tab label="Locations" value="locations" />
              <Tab label="Payouts" value="payouts" />
            </Tabs>
          </Box>
        )}

        {section === 'user' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={subsection} 
              onChange={(_, v) => setSubsection(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
            >
              <Tab label="Profile" value="user_profile" />
              <Tab label="Security" value="user_security" />
              <Tab label="API Tokens" value="user_tokens" />
            </Tabs>
          </Box>
        )}

        {section === 'experiences' && (
          <Box sx={{ mb: 3 }}>

            {selectedExperienceId && (() => {
               const c = getSectionChecks();
               return (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={subsection} 
                    onChange={(_, v) => setSubsection(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
                  >
                    <Tab label="Overview" value="overview" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Details {c.details.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="details" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Media {mediaOk ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="media" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Pricing {c.pricing.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="pricing" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Availability {c.availability.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="availability" />
                    <Tab label="Policies" value="policies" />
                    {/* <Tab label="Distribution" value="distribution" /> */}
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Validate {c.validation.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : (c.validation.count ? <Typography variant="caption" sx={{color:'warning.main', fontWeight:800}}>{c.validation.count}</Typography> : null)}</Box>} value="validation" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Sync {c.sync.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="sync" />
                  </Tabs>
                </Box>
               );
            })()}
          </Box>
        )}

        {section === 'information' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={subsection} 
              onChange={(_, v) => setSubsection(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
            >
              <Tab label="Resources" value="resources" />
            </Tabs>
          </Box>
        )}

        {section === 'welcome' && (
          <Fade in timeout={250}>
          <Box>
            <Paper sx={{ p: 3, borderRadius: 1, mb: 2, position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', background: 'linear-gradient(180deg, rgba(1, 0, 87, 0.03), rgba(255, 191, 0, 0.03))' }}>
              <IconButton aria-label="Dismiss" onClick={dismissWelcome} size="small" sx={{ position: 'absolute', top: 8, right: 8 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
              <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto' }}>
                {welcomeImgOk ? (
                  <Image src="/images/supplier-welcome-1120.webp" alt="Welcome to ExperiaHub" width={1120} height={700} sizes="(max-width: 768px) 100vw, 560px" style={{ width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} priority onError={()=>setWelcomeImgOk(false)} />
                ) : (
                  <Box sx={{ width: '100%', height: 0, pb: '62.5%', borderRadius: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', background: 'radial-gradient(120% 120% at 0% 0%, rgba(74,124,140,0.2), transparent), radial-gradient(120% 120% at 100% 0%, rgba(255,183,107,0.2), transparent), #f7f9fb', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7c8c' }}>
                      <CollectionsIcon sx={{ fontSize: 72, opacity: 0.5 }} />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ width: '100%', maxWidth: 720 }}>
                <Typography variant="h4" sx={{ mb: 1, color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 600, textAlign: 'center' }}>Welcome to the Supplier Portal</Typography>
                <Typography sx={{ mb: 3, color: '#666', textAlign: 'center' }}>Let's set up your account. You can close this anytime and re-open from the left navigation.</Typography>
                <List sx={{ mb: 2 }}>
                  <ListItemButton onClick={() => { setSection('company'); setSubsection('profile'); }}>
                    <CheckCircleOutlineIcon sx={{ mr: 1, color: '#4a7c8c' }} />
                    <ListItemText primary="Add company details" secondary="Profile, billing, legal, locations" />
                  </ListItemButton>
                  <ListItemButton onClick={() => { setSection('user'); setSubsection('user_profile'); }}>
                    <CheckCircleOutlineIcon sx={{ mr: 1, color: '#4a7c8c' }} />
                    <ListItemText primary="Add user details" secondary="Display name and phone" />
                  </ListItemButton>
                  <ListItemButton onClick={() => { setSection('experiences'); setSubsection('overview'); }}>
                    <CheckCircleOutlineIcon sx={{ mr: 1, color: '#4a7c8c' }} />
                    <ListItemText primary="Add experiences" secondary="Overview, details, media, pricing" />
                  </ListItemButton>
                </List>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
                  <Button size="small" startIcon={<ApartmentIcon />} variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 700 }} onClick={() => { setSection('company'); setSubsection('profile'); }}>Start Company</Button>
                  <Button size="small" startIcon={<PersonOutlineIcon />} variant="outlined" sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 700 }} onClick={() => { setSection('user'); setSubsection('user_profile'); }}>Start User</Button>
                  <Button size="small" startIcon={<CollectionsIcon />} variant="outlined" sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 700 }} onClick={() => { setSection('experiences'); setSubsection('overview'); }}>Start Experiences</Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'profile' && (
          <Fade in timeout={250}>
          <Box>

            {!appId ? (
              <Alert severity="warning">Missing application ID. Please open the signup email link or add <code>?appId=... </code> to the URL.</Alert>
            ) : (
              <OnboardingForm applicationId={appId} initialData={statusData} />
            )}
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection.startsWith('payouts_') && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>{subsectionLabel}</Typography>
              {subsection === 'payouts_overview' && (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
                  <Stack spacing={2}>
                    <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#666', fontSize: '1rem' }}>
                      Connect your payout account to receive earnings. We use Stripe Connect for secure onboarding and payouts.
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`Status: ${payoutStatus || 'Unknown'}`} color={payoutStatus==='verified'?'success':(payoutStatus==='pending'?'warning':'default')} sx={{ fontFamily: 'Nunito, sans-serif', borderRadius: 1 }} />
                      {stripeAccountId && (<Chip size="small" label={`Acct: ${stripeAccountId}`} variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif' }} />)}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontWeight: 700 }} onClick={()=>setSubsection('payouts_connect')}>
                        {payoutStatus==='pending' ? 'Resume onboarding' : 'Start onboarding'}
                      </Button>
                      {stripeDashboardUrl && (
                        <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontWeight: 700 }} component="a" href={stripeDashboardUrl} target="_blank" rel="noreferrer">Open Stripe Dashboard</Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {subsection === 'payouts_connect' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Stack spacing={2}>
                    <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Payouts & Onboarding</Typography>
                    <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#666' }}>
                      Begin Stripe onboarding to add your bank details and business information.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      sx={PRIMARY_BUTTON_SX}
                      startIcon={<PlayArrowIcon />}
                      onClick={async ()=>{
                        try {
                          if (!appId) { setToast('Missing application ID'); return; }
                          const res = await fetch(`${N8N_BASE}/supplier/payouts/stripe/connect_link`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ applicationId: appId, refreshUrl: window.location.href, returnUrl: window.location.href })
                          });
                          const j = await res.json();
                          if (!res.ok || !j?.url) throw new Error(j?.error || 'Failed to create onboarding link');
                          window.location.href = j.url;
                        } catch (e: any) {
                          setToast(e?.message || 'Unable to start Stripe onboarding');
                        }
                      }}
                    >
                      Start Stripe Onboarding
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'billing' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>Billing</Typography>
                {saveSuccess?.section === 'Billing' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Manage your invoice details and tax information.</Typography>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Company name" value={companyBilling.companyName} onChange={(e)=>setCompanyBilling(s=>({ ...s, companyName: e.target.value }))} fullWidth />
                  <Tooltip title="Enter your local Tax Identification Number" arrow placement="top">
                    <TextField label="Tax ID" value={companyBilling.taxId} onChange={(e)=>setCompanyBilling(s=>({ ...s, taxId: e.target.value }))} fullWidth />
                  </Tooltip>
                </Stack>
                <TextField label="Billing address" value={companyBilling.address} onChange={(e)=>setCompanyBilling(s=>({ ...s, address: e.target.value }))} fullWidth />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Country" value={companyBilling.country} onChange={(e)=>setCompanyBilling(s=>({ ...s, country: e.target.value }))} fullWidth />
                  <TextField label="Invoice email" value={companyBilling.invoiceEmail} onChange={(e)=>setCompanyBilling(s=>({ ...s, invoiceEmail: e.target.value }))} fullWidth />
                  <TextField label="Billing currency" value={companyBilling.currency} onChange={(e)=>setCompanyBilling(s=>({ ...s, currency: e.target.value }))} onBlur={(e)=>setCompanyBilling(s=>({ ...s, currency: String(e.target.value||'').toUpperCase() }))} fullWidth />
                </Stack>
                <Stack direction="row" justifyContent="flex-end">
                <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/company/billing/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, billing: companyBilling })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    handleSaveSuccess('Billing');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Billing</Button>
                </Stack>
              </Stack>
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'legal' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>Legal Entity</Typography>
                {saveSuccess?.section === 'Legal' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Update your legal entity registration and terms.</Typography>
                <TextField label="Legal entity name" value={companyLegal.legalName} onChange={(e)=>setCompanyLegal(s=>({ ...s, legalName: e.target.value }))} fullWidth />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Registration number" value={companyLegal.regNumber} onChange={(e)=>setCompanyLegal(s=>({ ...s, regNumber: e.target.value }))} fullWidth />
                  <Tooltip title="Enter your Value Added Tax registration number if applicable" arrow placement="top">
                    <TextField label="VAT number" value={companyLegal.vatNumber} onChange={(e)=>setCompanyLegal(s=>({ ...s, vatNumber: e.target.value }))} fullWidth />
                  </Tooltip>
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Terms URL" value={companyLegal.termsUrl} onChange={(e)=>setCompanyLegal(s=>({ ...s, termsUrl: e.target.value }))} fullWidth />
                  <TextField label="Privacy URL" value={companyLegal.privacyUrl} onChange={(e)=>setCompanyLegal(s=>({ ...s, privacyUrl: e.target.value }))} fullWidth />
                </Stack>
                <TextField label="Representative" value={companyLegal.representative} onChange={(e)=>setCompanyLegal(s=>({ ...s, representative: e.target.value }))} fullWidth />
                <Stack direction="row" justifyContent="flex-end">
                <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/company/legal/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, legal: companyLegal })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    handleSaveSuccess('Legal');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Legal</Button>
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'locations' && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>Locations</Typography>
                {saveSuccess?.section === 'Locations' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Manage your physical office locations.</Typography>
                {companyLocations.map((loc, idx) => (
                  <Box key={idx} sx={{ p: 0, borderRadius: 0 }}>
                    <Stack spacing={1.5}>
                      <TextField label="Location name" value={loc.name} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, name: e.target.value }:x))} fullWidth />
                      <TextField label="Address" value={loc.address} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, address: e.target.value }:x))} fullWidth />
                      <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                        <TextField label="City" value={loc.city} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, city: e.target.value }:x))} fullWidth />
                        <TextField label="Country" value={loc.country} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, country: e.target.value }:x))} fullWidth />
                        <TextField label="Time zone" value={loc.timeZone} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, timeZone: e.target.value }:x))} fullWidth />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', textTransform: 'none', fontWeight: 700 }} startIcon={<AddIcon />} onClick={()=>setCompanyLocations(arr=>[...arr, { name:'', address:'', city:'', country:'', timeZone: defaultTimeZone || 'UTC' }])}>Add Location</Button>
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      const res = await fetch(`${N8N_BASE}/supplier/company/locations/save`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicationId: appId, locations: companyLocations })
                      });
                      const json = await res.json();
                      if (!json?.success) throw new Error(json?.error || 'Save failed');
                      handleSaveSuccess('Locations');
                    } catch (e: any) { setToast(e?.message || 'Save failed'); }
                  }}>Save Locations</Button>
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'user' && subsection === 'user_profile' && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
                <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>Profile</Typography>
                {saveSuccess?.section === 'Profile' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Update your personal contact information.</Typography>
                <TextField label="Display Name" value={userDisplayName} onChange={(e)=>setUserDisplayName(e.target.value)} fullWidth required error={!userDisplayName.trim()} helperText={!userDisplayName.trim() ? 'Required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <TextField label="Phone" value={userPhone} onChange={(e)=>setUserPhone(e.target.value)} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" size="small" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    if (!userDisplayName.trim()) { setToast('Please enter a display name'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/user/profile/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, profile: { displayName: userDisplayName, phone: userPhone } })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    handleSaveSuccess('Profile');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Profile</Button>
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'user' && subsection === 'user_security' && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
                <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>Security</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Manage your password and security settings.</Typography>
                <TextField type="password" label="Current Password" value={passwordCurrent} onChange={(e)=>setPasswordCurrent(e.target.value)} fullWidth required error={!passwordCurrent.trim()} helperText={!passwordCurrent.trim()?'Required':''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <TextField label="New password" type="password" value={passwordNew} onChange={(e)=>setPasswordNew(e.target.value)} fullWidth required error={passwordNew.length>0 && passwordNew.length<8} helperText={passwordNew.length>0 && passwordNew.length<8 ? 'Min 8 characters' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <Button
                  variant="contained"
                  size="small"
                  sx={PRIMARY_BUTTON_SX}
                  startIcon={<VpnKeyIcon />}
                  disabled={securitySubmitting}
                  onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      if (!passwordCurrent || !passwordNew) { setToast('Enter current and new password'); return; }
                      if (passwordNew.length < 8) { setToast('New password must be at least 8 characters'); return; }
                      setSecuritySubmitting(true);
                      const res = await fetch(`${N8N_BASE}/supplier/user/security/save`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicationId: appId, passwordCurrent, passwordNew })
                      });
                      const json = await res.json();
                      if (!json?.success) throw new Error(json?.error || 'Update failed');
                      setPasswordCurrent('');
                      setPasswordNew('');
                      setToast('Password updated');
                    } catch (e: any) { setToast(e?.message || 'Update failed'); }
                    finally { setSecuritySubmitting(false); }
                  }}
                >
                  {securitySubmitting ? 'Updating…' : 'Update Password'}
                </Button>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'user' && subsection === 'user_tokens' && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              <Stack spacing={4}>
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 1 }}>API Tokens</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Manage your API access tokens.</Typography>
                
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2}>
                    <TextField size="small" label="Login or Email" value={tokensUser} onChange={(e)=>setTokensUser(e.target.value)} fullWidth />
                    <TextField size="small" label="Current Password" type="password" value={tokensPassword} onChange={(e)=>setTokensPassword(e.target.value)} fullWidth />
                    <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SyncIcon />} disabled={tokensLoading} onClick={loadTokens}>Load</Button>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField size="small" label="Token Name" value={tokenName} onChange={(e)=>setTokenName(e.target.value)} fullWidth />
                    <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<AddIcon />} disabled={tokenMutating || tokensLoading} onClick={createToken}>Create Token</Button>
                  </Stack>

                  {tokensLoading && (<Alert severity="info">Loading tokens…</Alert>)}
                  {!tokensLoading && apiTokens.length === 0 && (<Alert severity="info">No API tokens yet.</Alert>)}

                  {apiTokens.map((t)=> (
                    <Stack key={t.uuid} direction="row" spacing={2} alignItems="center">
                      <TextField size="small" value={`${t.name} — ${t.uuid}`} fullWidth />
                      <Button size="small" color="error" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700 }} disabled={tokenMutating} onClick={()=>deleteToken(t.uuid)}>Remove</Button>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'overview' && (
          <Fade in timeout={250}>
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Experience Overview</Typography>

            <ActivitiesSkeleton 
              experiences={experiences} 
              onUpdate={setExperiences} 
              onSave={saveAllExperiences}
              onToast={(m)=>setToast(m)} 
              onEditDetails={(act: any) => {
                const e = act as Experience;
                setSelectedExperienceId(e.id);
                // Also update details state with this specific activity immediately to avoid lag
                setDetails(e);
                setSection('experiences');
                setSubsection('details');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />

          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'media' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Photos & Video</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>Add Google Drive links for photos/videos, or paste YouTube/Vimeo URLs.</Alert>
              <GridLikeMedia onToast={(m)=>setToast(m)} defaultActivityId={selectedExperienceId} />
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'pricing' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Pricing & Rates</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>Add pricing categories and rates. The first row will be used as the base rate for channels that support a single rate.</Alert>
            <Table size="small" sx={{ mb: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Pricing Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pricingRows.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell><TextField size="small" value={r.category} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, category:e.target.value}:x))} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} /></TableCell>
                    <TableCell><TextField size="small" type="number" inputProps={{ min: 0, step: '0.01', style: { fontFamily: 'Nunito, sans-serif' } }} value={r.amount} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, amount:e.target.value}:x))} /></TableCell>
                    <TableCell><TextField size="small" value={r.currency} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, currency:e.target.value}:x))} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} /></TableCell>
                    <TableCell align="right"><Button size="small" color="error" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={()=>setPricingRows(rows=>rows.filter((_,i)=>i!==idx))}>Remove</Button></TableCell>
                  </TableRow>
                ))}
                {pricingRows.length === 0 && (
                  <TableRow><TableCell colSpan={4} sx={{ color:'#777' }}>No pricing rows yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {pricingRows.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>Add at least one pricing row (category, amount, currency).</Alert>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', textTransform: 'none', fontWeight: 700 }} startIcon={<AddIcon />} onClick={()=>setPricingRows(rows=>[...rows, { category:'', amount:'', currency: details.currency || defaultCurrency || 'JPY' }])}>Add Row</Button>
              <Button variant="contained" size="small" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                const currencies = new Set(pricingRows.map(r=>r.currency).filter(Boolean));
                if (currencies.size > 1) { setToast('Use a single currency across pricing rows'); return; }
                const catsCsv = pricingRows.map(r=>r.category).filter(Boolean).join(', ');
                const base = pricingRows[0]?.amount || details.baseRate || '';
                const curr = pricingRows[0]?.currency || details.currency || defaultCurrency || '';
                setDetails(d=>({ ...d, pricingCategories: catsCsv, baseRate: base, currency: curr } as any));
                await onSaveDetails();
              }}>Save Pricing</Button>
            </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'details' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Product Details</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="details-experience-select">Switch Experience</InputLabel>
                <Select labelId="details-experience-select" label="Switch Experience" value={selectedExperienceId || ''} onChange={(e) => {
                  const id = e.target.value as string;
                  setSelectedExperienceId(id);
                }}>
                  {activitiesSimple.map(a => (<MenuItem key={a.id} value={a.id}>{a.title}</MenuItem>))}
                </Select>
              </FormControl>
            </Stack>
            {saveSuccess?.section === 'Experience' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit details.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Title" value={details.title || ''} onChange={(e)=>setDetails(d=>({ ...d, title: e.target.value }))} fullWidth error={showFieldErrors && !String(details.title||'').trim()} helperText={showFieldErrors && !String(details.title||'').trim() ? 'Title is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <TextField label="Description" value={details.summary || ''} onChange={(e)=>setDetails(d=>({ ...d, summary: e.target.value }))} fullWidth multiline minRows={3} error={showFieldErrors && !String(details.summary||'').trim()} helperText={showFieldErrors && !String(details.summary||'').trim() ? 'Description is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <TextField label="Itinerary (optional)" value={(details as any).itinerary || ''} onChange={(e)=>setDetails(d=>({ ...d, itinerary: e.target.value } as any))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <TextField label="Meeting point (optional)" value={(details as any).meetingPoint || ''} onChange={(e)=>setDetails(d=>({ ...d, meetingPoint: e.target.value } as any))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="City" value={details.city || ''} onChange={(e)=>setDetails(d=>({ ...d, city: e.target.value }))} fullWidth error={showFieldErrors && !String(details.city||'').trim()} helperText={showFieldErrors && !String(details.city||'').trim() ? 'City is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Duration (minutes)" type="number" inputProps={{ min: 0, step: 1, style: { fontFamily: 'Nunito, sans-serif' } }} value={details.durationMinutes || ''} onChange={(e)=>setDetails(d=>({ ...d, durationMinutes: e.target.value }))} fullWidth error={showFieldErrors && !String(details.durationMinutes||'').trim()} helperText={showFieldErrors && !String(details.durationMinutes||'').trim() ? 'Duration is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
                </Stack>
                {(() => {
                  const selectedCats = String(details.category || '').split(',').map(s=>s.trim()).filter(Boolean);
                  return (
                    <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                      <FormControl fullWidth error={showFieldErrors && !String(details.category||'').trim()}>
                        <InputLabel id="categories-label">Categories</InputLabel>
                        <Select multiple labelId="categories-label" label="Categories" value={selectedCats} onChange={(e)=>{
                          const vals = (e.target.value as string[]);
                          setDetails(d=>({ ...d, category: vals.join(', ') }));
                        }} renderValue={(selected)=> (
                          <Box sx={{ display:'flex', flexWrap:'wrap', gap: .5 }}>
                            {(selected as string[]).map((value) => (<Chip key={value} label={value} />))}
                          </Box>
                        )}>
                          {SUGGESTED_CATEGORIES.map((name)=> (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField label="Max participants" type="number" inputProps={{ min: 1, step: 1, style: { fontFamily: 'Nunito, sans-serif' } }} value={details.maxParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, maxParticipants: e.target.value }))} fullWidth error={showFieldErrors && !String(details.maxParticipants||'').trim()} helperText={showFieldErrors && !String(details.maxParticipants||'').trim() ? 'Capacity is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
                      <TextField label="Min participants" type="number" inputProps={{ min: 1, step: 1, style: { fontFamily: 'Nunito, sans-serif' } }} value={details.minParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, minParticipants: e.target.value }))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
                    </Stack>
                  );
                })()}
                
                {/* Story & Vibe Section */}
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mt: 3, mb: 1 }}>The Story & Vibe</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Unforgettable Feeling" value={details.unforgettableFeeling || ''} onChange={(e)=>setDetails(d=>({ ...d, unforgettableFeeling: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Authentic Echoes" value={details.authenticEchoes || ''} onChange={(e)=>setDetails(d=>({ ...d, authenticEchoes: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="A Moment of Magic" value={details.magicMoment || ''} onChange={(e)=>setDetails(d=>({ ...d, magicMoment: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Hidden Gem" value={details.hiddenGem || ''} onChange={(e)=>setDetails(d=>({ ...d, hiddenGem: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Community Connection" value={details.communityConnection || ''} onChange={(e)=>setDetails(d=>({ ...d, communityConnection: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Perfect Match" value={details.perfectMatch || ''} onChange={(e)=>setDetails(d=>({ ...d, perfectMatch: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Three Words" placeholder="e.g. Serene, Historical, Tasty" value={details.threeWords || ''} onChange={(e)=>setDetails(d=>({ ...d, threeWords: e.target.value }))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                </Grid>

                {/* Inclusions & Logistics */}
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mt: 3, mb: 1 }}>Inclusions & Requirements</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Included in Price" value={details.included || ''} onChange={(e)=>setDetails(d=>({ ...d, included: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="NOT Included" value={details.notIncluded || ''} onChange={(e)=>setDetails(d=>({ ...d, notIncluded: e.target.value }))} fullWidth multiline minRows={3} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Participant Requirements" value={details.requirements || ''} onChange={(e)=>setDetails(d=>({ ...d, requirements: e.target.value }))} fullWidth multiline minRows={2} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                </Grid>

                {/* Safety */}
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mt: 3, mb: 1 }}>Safety & Insurance</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Safety Measures" value={details.safetyMeasures || ''} onChange={(e)=>setDetails(d=>({ ...d, safetyMeasures: e.target.value }))} fullWidth multiline minRows={2} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                  <TextField label="Insurance Information" value={details.insurance || ''} onChange={(e)=>setDetails(d=>({ ...d, insurance: e.target.value }))} fullWidth multiline minRows={2} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={onSaveDetails}>Save Details</Button>
                </Stack>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'availability' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Availability & Schedule</Typography>
            {saveSuccess?.section === 'Experience' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit availability.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Scheduling mode" value={details.schedulingMode || ''} onChange={(e)=>setDetails(d=>({ ...d, schedulingMode: e.target.value }))} fullWidth error={showFieldErrors && !String(details.schedulingMode||'').trim()} helperText={showFieldErrors && !String(details.schedulingMode||'').trim() ? 'Scheduling mode is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Start times / hours" value={details.startTimes || ''} onChange={(e)=>setDetails(d=>({ ...d, startTimes: e.target.value }))} fullWidth error={showFieldErrors && !String(details.startTimes||'').trim()} helperText={showFieldErrors && !String(details.startTimes||'').trim() ? 'Start times are required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Cutoff / Lead time (hours)" value={details.cutoffHours || ''} onChange={(e)=>setDetails(d=>({ ...d, cutoffHours: e.target.value }))} fullWidth error={showFieldErrors && !String((details.cutoffHours||details.bookingLeadTime||'')).trim()} helperText={showFieldErrors && !String((details.cutoffHours||details.bookingLeadTime||'')).trim() ? 'Cutoff/Lead time is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Max participants" value={details.maxParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, maxParticipants: e.target.value }))} fullWidth error={showFieldErrors && !String(details.maxParticipants||'').trim()} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="tz-label">Time zone</InputLabel>
                    <Select labelId="tz-label" label="Time zone" value={(details as any).timeZone || defaultTimeZone || ''} onChange={(e)=>setDetails(d=>({ ...d, timeZone: String(e.target.value) } as any))}>
                      {TIME_ZONES.map((tz)=> (<MenuItem key={tz} value={tz}>{tz}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <TextField label="Latitude" placeholder="e.g., 35.0116" value={(details as any).latitude || ''} onChange={(e)=>setDetails(d=>({ ...d, latitude: e.target.value } as any))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Longitude" placeholder="e.g., 135.7681" value={(details as any).longitude || ''} onChange={(e)=>setDetails(d=>({ ...d, longitude: e.target.value } as any))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={onSaveDetails}>Save Availability</Button>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'policies' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Policies & Requirements</Typography>
            {saveSuccess?.section === 'Experience' && <Alert severity="success" sx={{ fontFamily: 'Nunito, sans-serif' }}>Saved successfully at {saveSuccess.timestamp}.</Alert>}
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit policies.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Cancellation policy" value={details.cancellationPolicy || ''} onChange={(e)=>setDetails(d=>({ ...d, cancellationPolicy: e.target.value }))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Minimum age (optional)" value={(details as any).minAge || ''} onChange={(e)=>setDetails(d=>({ ...d, minAge: e.target.value } as any))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={onSaveDetails}>Save Policies</Button>
                </Stack>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'distribution' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Channel Distribution</Typography>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to view distribution.</Alert>)}
            {selectedExperienceId && (
              <>
                {(() => { const sel = experiences.find(e => e.id === selectedExperienceId); return (
                  <>
                    <Typography variant="body2">Bókun Product ID: <strong>{sel?.bokunProductId || '—'}</strong></Typography>
                    <Typography variant="body2">Expedia Product ID: <strong>—</strong></Typography>
                    <Typography variant="body2">Amadeus Product ID: <strong>—</strong></Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Preview payload (Bókun)</Typography>
                    <Box data-preview-payload sx={{ fontFamily:'Menlo, Consolas, monospace', fontSize: 12, bgcolor:'#f7f7f7', p:1.5, borderRadius:1.5, overflow:'auto' }}>
                      {(() => {
                        const a = sel as any || {};
                        const rates = [] as any[];
                        if ((a as any).ratesJson) {
                          try { const parsed = JSON.parse((a as any).ratesJson); if (Array.isArray(parsed)) rates.push(...parsed.map((r:any)=>({ name:r.category||'Base', amount:r.amount, currency:r.currency }))); } catch {}
                        }
                        if (rates.length === 0) rates.push({ name:'Base', amount: a.baseRate || a.price, currency: a.currency });
                        const preview = {
                          name: a.title,
                          description: a.summary,
                          itinerary: a.itinerary,
                          duration: a.durationMinutes,
                          location: a.city,
                          categories: a.category,
                          pricingCategories: a.pricingCategories,
                          rates,
                          availabilityRules: { schedulingMode: a.schedulingMode, startTimes: a.startTimes },
                          cutoffHours: a.cutoffHours || a.bookingLeadTime,
                          externalId: a.id
                        };
                        return JSON.stringify(preview, null, 2);
                      })()}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontWeight: 700 }} onClick={() => {
                        try {
                          const pre = document.querySelector('[data-preview-payload]') as HTMLElement | null;
                          const text = pre ? pre.innerText : '';
                          navigator.clipboard.writeText(text || '');
                          setToast('Payload copied');
                        } catch { setToast('Copy failed'); }
                      }}>Copy JSON</Button>
                    </Stack>

                  </>
                ); })()}
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'validation' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Data Validation</Typography>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to validate.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center">
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<CheckIcon />} disabled={validating} onClick={runValidation}>{validating ? 'Validating…' : 'Run Validation'}</Button>
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<CheckIcon />} disabled={validating || experiences.length===0} onClick={async ()=>{
                    const results: Record<string, number> = {} as any;
                    for (const e of experiences) {
                      const issues = await (async ()=>{
                        const errs: string[] = [];
                        if (!e.title?.trim()) errs.push('T1: Title');
                        if (!e.summary?.trim()) errs.push('T1: Description');
                        if (!e.durationMinutes?.trim()) errs.push('T1: Duration');
                        if (!e.city?.trim()) errs.push('T1: City');
                        if (!e.category?.trim()) errs.push('T1: Category');
                        try { const ok = await fetchHasAnyPhotoFor(e.id); if (!ok) errs.push('T1: Photo'); } catch {}
                        if (!e.schedulingMode?.trim()) errs.push('T2: Mode');
                        if (!e.startTimes?.trim()) errs.push('T2: StartTimes');
                        if (!e.maxParticipants?.toString().trim()) errs.push('T2: Capacity');
                        if (!((e.cutoffHours||'') || (e.bookingLeadTime||'')).toString().trim()) errs.push('T2: Cutoff');
                        if (!e.currency?.trim()) errs.push('T2: Currency');
                        if (!e.pricingCategories?.trim()) errs.push('T2: PricingCat');
                        if (!((e.baseRate||'') || (e.price||'')).toString().trim()) errs.push('T2: Rate');
                        return errs;
                      })();
                      results[e.id] = issues.length;
                    }
                    setValidationMap(results);
                    try { if (appId) localStorage.setItem(`supplier_validation_${appId}`, JSON.stringify(results)); } catch {}
                    setToast('Validation complete for all');
                  }}>Validate all</Button>
                </Stack>
                {validationIssues.length === 0 && !validating && (<Alert severity="success">All validation checks passed.</Alert>)}
                {validationIssues.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="caption" sx={{ display:'block', mb: .5 }}>Fix the following to sync:</Typography>
                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                      {validationIssues.map((e, i) => (<li key={i}><Typography variant="caption">{e}</Typography></li>))}
                    </ul>
                  </Alert>
                )}
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'sync' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Channel Sync</Typography>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to sync.</Alert>)}
            {selectedExperienceId && (
              <>
                <Alert severity="info">Sync will validate first, then push to Bókun and optionally upsert to Airtable.</Alert>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small">
                    <InputLabel id="airtable-toggle">Airtable</InputLabel>
                    <Select labelId="airtable-toggle" label="Airtable" value={alsoUpsertAirtable ? 'yes' : 'no'} onChange={(e)=>setAlsoUpsertAirtable(String(e.target.value)==='yes')}>
                      <MenuItem value="no">Don't upsert</MenuItem>
                      <MenuItem value="yes">Upsert to Airtable</MenuItem>
                    </Select>
                  </FormControl>
                  {(() => { const a = experiences.find(e=>e.id===selectedExperienceId); return a?.lastSyncedAt ? (
                    <Typography variant="caption" sx={{ color: '#666' }}>Last synced: {new Date(a.lastSyncedAt).toLocaleString()}</Typography>
                  ) : null; })()}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)' }} onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      const a = experiences.find(e=>e.id===selectedExperienceId);
                      const res = await fetch(`${N8N_BASE}/supplier/activities/sync`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicationId: appId, activity: a, dryRun: true })
                      });
                      const j = await res.json();
                      setToast(j?.success ? 'Dry-run OK' : (j?.error || 'Dry-run failed'));
                    } catch (e:any) { setToast(e?.message||'Dry-run failed'); }
                  }}>Dry-run</Button>
                  <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)' }} onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      const a = experiences.find(e=>e.id===selectedExperienceId);
                      const res = await fetch(`${N8N_BASE}/supplier/bokun/availability`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ experienceId: a?.bokunProductId || a?.id, date: new Date().toISOString().slice(0,10) })
                      });
                      const j = await res.json();
                      const slots: string[] = Array.isArray(j?.slots) ? j.slots.map((s:any)=>s.time||s.startTime||s.start||'').filter(Boolean).slice(0,5) : [];
                      setToast(slots.length ? `Availability preview: ${slots.join(', ')}` : 'No slots today');
                    } catch (e:any) { setToast(e?.message||'Preview failed'); }
                  }}>Availability preview</Button>
                </Stack>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 700, transition: 'all 0.5s ease', '&:hover': { bgcolor: '#ffbf00' } }}
                  onClick={syncSelected}
                  disabled={(validationMap[selectedExperienceId] ?? Infinity) !== 0}
                >
                  Publish Experience
                </Button>
                {(validationMap[selectedExperienceId] ?? Infinity) !== 0 && (
                  <Typography variant="caption" sx={{ color: '#a15b00' }}>
                    Run Validation and fix issues before syncing.
                  </Typography>
                )}
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'user' && (
          <Stack spacing={2}>
            <Alert severity="info" icon={<WallpaperIcon />}>
              To customize your portal background, use the <strong>Wallpaper Button</strong> in the bottom-right corner of the screen.
            </Alert>
            {bg && (
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Nunito, sans-serif' }}>Current Background</Typography>
                <Box sx={{ position: 'relative', pb: '40%', borderRadius: 1, overflow: 'hidden', bgcolor: '#e0e0e0' }}>
                  <img src={bg.url} alt="Background" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                {bg.authorName && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>Photo by {bg.authorName} on Unsplash</Typography>}
              </Paper>
            )}
            <Button color="error" variant="outlined" disabled={!bg} onClick={async ()=>{
                const token = AuthService.getToken();
                setBg(null); saveCachedBackground(null, 'supplier');
                try { await setUserBackground(token, null as any); } catch {}
                try {trackBackgroundRemove('supplier');} catch {}
                setToast('Background removed');
            }}>Remove Background</Button>
          </Stack>
        )}

        {section === 'information' && (
          <Box>
            {subsection === 'resources' && (
              <>
                {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Information & Resources</Typography>
                <List>
                  <ListItemButton dense component="a" href="https://experiahub.com/supplier-agreement/" target="_blank"><ListItemText primary="Supplier Agreement" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', color: '#334155' }} /></ListItemButton>
                  <ListItemButton dense component="a" href="https://experiahub.com/suppliers/" target="_blank"><ListItemText primary="Supplier Signup Info" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', color: '#334155' }} /></ListItemButton>
                  <ListItemButton dense onClick={()=>setSupportOpen(true)}><ListItemText primary="Contact Support" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', color: '#334155' }} /></ListItemButton>
                </List>
              </>
            )}
            {subsection === 'reports' && (<Alert severity="info">Reports coming soon.</Alert>)}
            {subsection === 'help' && (<Alert severity="info">Help & FAQs coming soon.</Alert>)}
            {subsection === 'status' && (<Alert severity="info">System status coming soon.</Alert>)}
          </Box>
        )}
        </Paper>
        {/* Right rail */}

        <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast || ''} />
      </Box>
      <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'supplier'} appId={appId} />
      
      <Popover
          open={Boolean(bgAnchorEl)}
          anchorEl={bgAnchorEl}
          onClose={() => { setBgAnchorEl(null); setBgSeed(0); }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Paper
            sx={{ p: 2, width: 360, maxHeight: 420, overflowY: 'auto', borderRadius: 3 }}
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
                <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: 'rgba(1,0,87,0.5)', color: '#010057', fontWeight: 700, borderRadius: 3 }} onClick={async ()=>{
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
                    sx={{ cursor: 'pointer', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                    onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                    onClick={async () => {
                      const token = AuthService.getToken();
                      const next = { url: p.url, thumbUrl: p.thumbUrl } as PortalBackground;
                      setBg(next);
                      prefetchBackgroundImage(p.url);
                      saveCachedBackground(next, 'supplier');
                      try { await setUserBackground(token, next); } catch {}
                      try {trackBackgroundChange('supplier', next);} catch {}
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
                      sx={{ cursor: 'pointer', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                      onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                      onClick={async ()=>{
                        const token = AuthService.getToken();
                        const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as PortalBackground;
                        setBg(next);
                        prefetchBackgroundImage(url);
                        saveCachedBackground(next, 'supplier');
                        try { await trackDownload(id); } catch (e) { console.warn('unsplash track failed', e); }
                        try { await setUserBackground(token, next); } catch {}
                        try {trackBackgroundChange('supplier', next);} catch {}
                        setBgAnchorEl(null);
                      }}
                    >
                      <img src={thumb} alt={`Unsplash: ${p?.alt_description || authorName || 'photo'}`} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                    </Box>
                  );
                })}

              </Box>
              {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={60} />)}
              <Button size="small" color="error" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 700, borderRadius: 3 }} onClick={async ()=>{
                const token = AuthService.getToken();
                setBg(null); saveCachedBackground(null, 'supplier');
                try { await setUserBackground(token, null as any); } catch {}
                try {trackBackgroundRemove('supplier');} catch {}
                setBgAnchorEl(null);
              }}>Remove Background</Button>
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
     </Box>
    </>
  );
}

