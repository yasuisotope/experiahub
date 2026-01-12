'use client';

// Build Trace: 2026.01.12.0815 - Ensuring reactive patterns are live
export const buildId = "2026.01.12.0815";

// Disable static prerendering — this page depends on search params/localStorage.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Paper, Typography, Alert, Button, Stack, TextField, List, ListItemButton, ListItemText, Divider, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, MenuItem, Select, FormControl, InputLabel, Chip, Fade, Skeleton, Container, Grid, Tooltip, CircularProgress } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import Image from 'next/image';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CollectionsIcon from '@mui/icons-material/Collections';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import OnboardingForm from '@/components/supplier/OnboardingForm';
import SupportDialog from '@/components/support/SupportDialog';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, setUserBackground, searchUnsplash, trackDownload, loadCachedBackground, saveCachedBackground, getCuratedBackgrounds, prefetchBackgroundImage, type PortalBackground } from '@/services/backgroundService';
import { trackBackgroundChange, trackBackgroundRemove } from '@/services/analytics';

const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_N8N_API_URL || process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
  if (envUrl.includes('/webhook')) return envUrl;
  return `${envUrl.replace(/\/$/, '')}/webhook`;
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

function GridLikeMedia({ onToast, defaultActivityId }: { onToast: (m: string) => void; defaultActivityId?: string }) {
  const [photos, setPhotos] = React.useState<string>('');
  const [videoDrive, setVideoDrive] = React.useState<string>('');
  const [videoExternal, setVideoExternal] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploads, setUploads] = React.useState<{ name: string; status: 'pending'|'ok'|'error'; url?: string }[]>([]);
  const [activityId, setActivityId] = React.useState<string>('');
  const [activities, setActivities] = React.useState<{ id: string; title: string }[]>([]);
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const appId = React.useMemo(() => {
    try { return localStorage.getItem('supplier_application_id') || ''; } catch { return ''; }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!appId) return;
      try {
        const params = new URLSearchParams({ applicationId: appId });
        if (activityId) params.set('activityId', activityId);
        const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (json?.success) {
          setPhotos((json.photosDriveUrls || []).join(', '));
          setVideoDrive(json.videoDriveUrl || '');
          setVideoExternal(json.videoUrl || '');
        }
      } catch {}
    };
    load();
    return () => controller.abort();
  }, [appId, activityId]);

  React.useEffect(() => {
    if (defaultActivityId && defaultActivityId !== activityId) {
      setActivityId(defaultActivityId);
    }
  }, [defaultActivityId]);

  React.useEffect(() => {
    const loadActivities = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await res.json();
        if (json?.success && Array.isArray(json.activities)) {
          setActivities(json.activities.map((a: any, i: number) => ({ id: a.id || `row_${i}`, title: a.title || `Untitled ${i+1}` })));
        }
      } catch {}
    };
    loadActivities();
  }, [appId]);

  React.useEffect(() => {
    if (!activityId && activities.length === 1) {
      setActivityId(activities[0].id);
    }
  }, [activities, activityId]);

  const onSave = async () => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const payload = {
        applicationId: appId,
        photosDriveUrls: photos.split(',').map((s) => s.trim()).filter(Boolean),
        videoDriveUrl: videoDrive.trim(),
        videoUrl: videoExternal.trim()
      };
      const res = await fetch(`${N8N_BASE}/supplier/media/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      onToast('Media saved');
    } catch (e: any) {
      onToast(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!appId) { onToast('Missing application ID'); return; }
    if (!activityId.trim()) { onToast('Select an Activity to attach uploads'); return; }
    const list = Array.from(files);
    setUploads(list.map(f => ({ name: f.name, status: 'pending' })));
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of list) {
        const fd = new FormData();
        fd.append('applicationId', appId);
        if (activityId.trim()) fd.append('activityId', activityId.trim());
        fd.append('file', f, f.name);
        const res = await fetch(`${N8N_BASE}/supplier/media/upload`, { method: 'POST', body: fd });
        const json = await res.json();
        const url = json?.url || json?.driveUrl || '';
        setUploads(u => u.map(x => x.name === f.name ? { ...x, status: url ? 'ok' : 'error', url } : x));
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length) {
        setPhotos(curr => {
          const existing = curr.split(',').map(s => s.trim()).filter(Boolean);
          return [...existing, ...uploadedUrls].join(', ');
        });
        onToast('Upload complete');
        // Auto-save and reset media UI to prevent repeated saves
        try { await onSave(); } catch {}
        setUploads([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActivityId('');
      }
    } catch (e: any) {
      onToast(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TextField label="Photo URLs (Drive, comma-separated)" value={photos} onChange={(e) => setPhotos(e.target.value)} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
      <TextField label="Video URL (Drive)" value={videoDrive} onChange={(e) => setVideoDrive(e.target.value)} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
      <TextField label="Video URL (External)" value={videoExternal} onChange={(e) => setVideoExternal(e.target.value)} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
      <TextField select label="Attach to Activity" value={activityId} onChange={(e)=>setActivityId(e.target.value)} size="small" helperText="Required for uploads">
        {activities.map((a) => (
          <MenuItem key={a.id} value={a.id}>{a.title}</MenuItem>
        ))}
      </TextField>
      {(() => {
        const list = photos.split(',').map(s => s.trim()).filter(Boolean);
        return (
          <FormControl size="small" fullWidth>
            <InputLabel id="cover-photo-label">Cover photo (first in list)</InputLabel>
            <Select labelId="cover-photo-label" label="Cover photo (first in list)" value={coverUrl} onChange={(e)=>{
              const val = String(e.target.value);
              setCoverUrl(val);
              if (val) {
                const filtered = list.filter(u => u !== val);
                const reordered = [val, ...filtered];
                setPhotos(reordered.join(', '));
              }
            }}>
              {list.map((u) => (<MenuItem key={u} value={u}>{u}</MenuItem>))}
            </Select>
          </FormControl>
        );
      })()}
      {photos.trim().length === 0 && uploads.length === 0 && (
        <Alert severity="info">No photos yet. Upload images or paste Drive URLs to get started.</Alert>
      )}
      <Box onDragOver={(e)=>{ e.preventDefault(); }} onDrop={(e)=>{ e.preventDefault(); onFilesSelected(e.dataTransfer.files); }} sx={{
        p: 2,
        border: '1px dashed #BFC7CD',
        borderRadius: 2,
        bgcolor: '#fafafa',
        color: '#6b7780'
      }}>
        <Stack spacing={1}>
          <Typography variant="caption">Drag & drop images/videos here or select files</Typography>
          <Button component="label" variant="outlined" size="small">
            Choose Files
            <input ref={fileInputRef} hidden type="file" accept="image/*,video/*" multiple onChange={(e)=>onFilesSelected(e.target.files)} />
          </Button>
          {uploads.length > 0 && (
            <Stack spacing={0.5}>
              {uploads.map(u => (
                <Typography key={u.name} variant="caption" sx={{ color: u.status==='error'?'#c62828': (u.status==='ok'?'#2e7d32':'#6b7780') }}>
                  {u.name} — {u.status}{u.url?`: ${u.url}`:''}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
      {(() => {
        const list = photos.split(',').map(s => s.trim()).filter(Boolean);
        if (!list.length) return null;
        return (
          <Stack spacing={0.5}>
            {list.map((u, idx) => (
              <Stack key={u+idx} direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u}</Typography>
                <Button size="small" variant="outlined" onClick={() => {
                  const filtered = list.filter(x => x !== u);
                  setPhotos([u, ...filtered].join(', '));
                  setCoverUrl(u);
                }}>Set as cover</Button>
              </Stack>
            ))}
          </Stack>
        );
      })()}
      <Stack direction="row" spacing={1}>
        <Button onClick={onSave} disabled={saving} variant="contained" sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#020080' }, fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}>{saving ? 'Saving…' : 'Save Media'}</Button>
        <Button variant="outlined" disabled={uploading}>{uploading ? 'Uploading…' : 'Preview'}</Button>
      </Stack>
    </Stack>
  );
}

function ActivitiesSkeleton({ onToast }: { onToast: (m: string) => void }) {
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
  };
  const [rows, setRows] = React.useState<Activity[]>([]);
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
    setCutoffHours(a.cutoffHours || '');
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

  React.useEffect(() => {
    const load = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await res.json();
        if (json?.success && Array.isArray(json.activities)) {
          setRows(json.activities.map((a: any, i: number) => ({
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
            bokunProductId: a.bokunProductId || ''
          })));
        }
      } catch {}
    };
    load();
  }, [appId]);

  const saveAll = async () => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const payload = { applicationId: appId, activities: rows.map(({ id, ...rest }) => rest) };
      const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      onToast('Activities saved');
    } catch (e: any) {
      onToast(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const submitForm = () => {
    if (!title.trim()) { onToast('Title required'); return; }
    const next: Activity = {
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
    if (editing) setRows((rs) => rs.map((r) => (r.id === editing.id ? next : r)));
    else setRows((rs) => [next, ...rs]);
    setOpen(false); resetForm();
  };

  const fetchHasAnyPhoto = React.useCallback(async (activityIdForCheck?: string): Promise<boolean> => {
    if (!appId) return false;
    try {
      const params = new URLSearchParams({ applicationId: appId });
      if (activityIdForCheck) params.set('activityId', activityIdForCheck);
      const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`);
      const json = await res.json();
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
          EXTERNAL_ID: a.id
        }
      };
      const res = await fetch(`${N8N_BASE}/supplier/activities/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Sync failed');
      const bokunId = json.bokunProductId || '';
      setRows((rs) => rs.map((r) => r.id === a.id ? { ...r, bokunProductId: bokunId } : r));
      onToast(`Synced to Bókun${bokunId ? ` (${bokunId})` : ''}`);
    } catch (e: any) {
      onToast(e?.message || 'Sync failed');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" label="Search" value={filterText} onChange={(e)=>setFilterText(e.target.value)} sx={{ maxWidth: 260 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select labelId="sort-by-label" label="Sort by" value={sortKey} onChange={(e)=>setSortKey(e.target.value as any)}>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="city">City</MenuItem>
            <MenuItem value="durationMinutes">Duration</MenuItem>
            <MenuItem value="price">Price</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="sort-dir-label">Order</InputLabel>
          <Select labelId="sort-dir-label" label="Order" value={sortDir} onChange={(e)=>setSortDir(e.target.value as any)}>
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd} sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#020080' }, borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}>Add</Button>
          <Button variant="outlined" onClick={saveAll} disabled={saving} sx={{ borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#010057', borderColor: '#010057' }}>{saving ? 'Saving…' : 'Save drafts'}</Button>
          {undo && (
            <Button size="small" onClick={() => { setRows((rs)=>[undo.row, ...rs]); setUndo(null); setTimeout(()=>onToast('Restored'), 0); }}>Undo</Button>
          )}
        </Stack>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Duration (min)</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Bókun</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows
            .filter(r => [r.title,r.city,r.durationMinutes].join(' ').toLowerCase().includes(filterText.toLowerCase()))
            .sort((a,b)=>{ const va=(a as any)[sortKey]||''; const vb=(b as any)[sortKey]||''; const comp=String(va).localeCompare(String(vb),undefined,{numeric:true,sensitivity:'base'}); return sortDir==='asc'?comp:-comp; })
            .map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{inlineId===r.id ? <TextField size="small" value={r.title} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,title:e.target.value}:x))} /> : r.title}</TableCell>
              <TableCell>{inlineId===r.id ? <TextField size="small" value={r.city} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,city:e.target.value}:x))} /> : r.city}</TableCell>
              <TableCell>{inlineId===r.id ? <TextField size="small" value={r.durationMinutes} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,durationMinutes:e.target.value}:x))} /> : r.durationMinutes}</TableCell>
              <TableCell>{inlineId===r.id ? <TextField size="small" value={r.price||''} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,price:e.target.value}:x))} /> : (r.price||'')}</TableCell>
              <TableCell>{r.bokunProductId ? <Typography variant="caption" sx={{ color: '#2e7d32' }}>{r.bokunProductId}</Typography> : <Typography variant="caption" sx={{ color: '#999' }}>—</Typography>}</TableCell>
              <TableCell align="right">
                {inlineId===r.id ? (
                  <Button size="small" onClick={()=>setInlineId(null)}>Done</Button>
                ) : (
                  <>
                    <IconButton onClick={() => { setInlineId(r.id); }} size="small"><EditIcon /></IconButton>
                    <IconButton onClick={() => { if (window.confirm('Delete this experience?')) remove(r.id); }} size="small" color="error"><DeleteOutlineIcon /></IconButton>
                    <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => {
                      const copy = { ...r, id: `row_${Date.now()}` as string, title: r.title ? `${r.title} (Copy)` : 'Untitled (Copy)', bokunProductId: '' } as any;
                      setRows(rs => [copy, ...rs]);
                      onToast('Experience duplicated');
                    }}>Duplicate</Button>
                    <Button size="small" variant="contained" sx={{ ml: 1, bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={()=>onSync(r)}>Sync to Bókun</Button>
                  </>
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
        const json = await res.json();
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
      const json = await res.json();
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

function useSupplierAppId(): string {
  const params = useSearchParams();
  const [appId, setAppId] = React.useState<string>('');

  React.useEffect(() => {
    // Priority: URL > localStorage > (do NOT generate silently)
    const fromUrl = params?.get('appId') || params?.get('id') || '';
    const fromStorage = typeof window !== 'undefined' ? (localStorage.getItem('supplier_application_id') || '') : '';
    const ensure = fromUrl || fromStorage;
    if (ensure) {
      setAppId(ensure);
      try { localStorage.setItem('supplier_application_id', ensure); } catch {}
    } else {
      setAppId('');
    }
  }, [params]);

  return appId;
}

export default function SupplierPortalPage() {
  const { isLoggedIn, isLoading, logout, login } = useWordPressAuth() as any;
  const appId = useSupplierAppId();
  const [bg, setBg] = React.useState<PortalBackground | null>(null);
  const [bgSearch, setBgSearch] = React.useState<string>('');
  const [bgResults, setBgResults] = React.useState<any[]>([]);
  const [bgLoading, setBgLoading] = React.useState<boolean>(false);
  const [bgPage, setBgPage] = React.useState<number>(1);
  const [bgLoadingMore, setBgLoadingMore] = React.useState<boolean>(false);
  const [bgSeed, setBgSeed] = React.useState<number>(0);
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
  React.useEffect(() => {
    // Triggered by changing seed before opening the popover
    if (!bgSearch.trim() && bgSeed) {
      loadRandomBg();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgSeed]);
  const [tab, setTab] = React.useState<number>(0);
  const [section, setSection] = React.useState<'welcome'|'company'|'user'|'experiences'|'information'>('company');
  const [toast, setToast] = React.useState<string | null>(null);
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
  };
  const [experiences, setExperiences] = React.useState<Experience[]>([]);
  const [details, setDetails] = React.useState<Partial<Experience>>({});
  const [validating, setValidating] = React.useState(false);
  const [validationIssues, setValidationIssues] = React.useState<string[]>([]);
  const [validationMap, setValidationMap] = React.useState<Record<string, number>>({});
  const [defaultCurrency, setDefaultCurrency] = React.useState<string>('');
  const [defaultTimeZone, setDefaultTimeZone] = React.useState<string>('');
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
  const [username, setUsername] = React.useState('');
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
      const res = await fetch(`${N8N_BASE}/supplier/payouts/status?applicationId=${encodeURIComponent(appId)}`, { cache: 'no-store' });
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
        await Promise.all([
          fetch(`${N8N_BASE}/supplier/company/billing/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: appId, billing: companyBilling }) }),
          fetch(`${N8N_BASE}/supplier/company/legal/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: appId, legal: companyLegal }) })
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

      try {
        console.log(`[SupplierPortal] Initiating handshake for appId: ${appId} at ${N8N_BASE}`);

        // A. Fetch Onboarding Status (Primary Source for New Suppliers / Supabase)
        const statusRes = await fetch(`${N8N_BASE}/supplier/onboarding/status?applicationId=${encodeURIComponent(appId)}`);
        
        if (statusRes.ok) {
          const statusData = await parseJsonSafe(statusRes);
          console.log(`[SupplierPortal] Onboarding status result:`, statusData);
          
          if (statusData && statusData.exists) {
            // Priority 1: Populate from Supabase
            const primaryEmail = statusData.email || statusData.contactEmail || statusData.supplierEmail || '';
            const primaryName = statusData.fullName || statusData.businessName || statusData.contactName || '';
            const primaryPhone = statusData.phone || statusData.contact_phone || '';

            if (primaryEmail) setSuEmail(String(primaryEmail));
            if (primaryName) setUserDisplayName(String(primaryName));
            if (primaryPhone) setUserPhone(String(primaryPhone));
            
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
          } else {
            console.warn(`[SupplierPortal] No Supabase record found for ID: ${appId}`);
          }
        } else {
          console.error(`[SupplierPortal] Status fetch failed: ${statusRes.status}`);
        }

        // B. Fetch WP Profile (Verified Account Data - may overwrite with more 'official' info)
        const profileRes = await fetch(`${N8N_BASE}/supplier/user/profile/get?applicationId=${encodeURIComponent(appId)}`);
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
          fetch(`${N8N_BASE}/supplier/company/billing/get?applicationId=${encodeURIComponent(appId)}`),
          fetch(`${N8N_BASE}/supplier/company/legal/get?applicationId=${encodeURIComponent(appId)}`),
          fetch(`${N8N_BASE}/supplier/company/locations/get?applicationId=${encodeURIComponent(appId)}`)
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

  const loadingView = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Typography sx={{ fontFamily: 'Nunito, sans-serif' }}>Loading…</Typography>
    </Box>
  );

  const LoggedOutView = () => (
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
        backgroundImage: 'url(/images/supplier-hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.85)',
        zIndex: -1
      }
    }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          transition: 'all 0.4s ease-in-out',
          minHeight: showAuth ? '550px' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {!showAuth ? (
            <Fade in={!showAuth}>
              <Box>
                <Typography variant="overline" sx={{ color: '#4A7C8C', fontWeight: 700, letterSpacing: 3, mb: 1, display: 'block' }}>
                  PARTNERSHIP APPROVED
                </Typography>
                <Typography variant="h2" sx={{ 
                  color: '#010057', 
                  fontFamily: 'Agrandir, serif', 
                  fontWeight: 800, 
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.8rem' },
                  letterSpacing: '-0.02em'
                }}>
                  {companyBilling.companyName ? `Welcome, ${companyBilling.companyName}` : 'Welcome to the Portfolio'}
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#475569', 
                  fontFamily: 'Nunito, sans-serif', 
                  fontWeight: 400, 
                  maxWidth: '600px', 
                  mx: 'auto', 
                  mb: 6,
                  lineHeight: 1.6
                }}>
                  Your application to join ExperiaHub's exclusive supplier network has been approved. 
                  Finalize your access to showcase your signature experiences to our global audience.
                </Typography>

                <Grid container spacing={4} sx={{ mb: 6, textAlign: 'left' }}>
                  {[
                    { step: '01', title: 'Secure Access', desc: 'Create your partner login credentials.' },
                    { step: '02', title: 'Direct Profile', desc: 'Verify business details and compliance.' },
                    { step: '03', title: 'Portfolio Sync', desc: 'Connect your inventory or upload experiences.' },
                  ].map((item, i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Box sx={{ p: 2, borderLeft: '2px solid #C5A059' }}>
                        <Typography variant="caption" sx={{ color: '#C5A059', fontWeight: 800, letterSpacing: 1 }}>STEP {item.step}</Typography>
                        <Typography variant="h6" sx={{ color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 700, mb: 0.5 }}>{item.title}</Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'Nunito, sans-serif' }}>{item.desc}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Stack direction="column" spacing={3} justifyContent="center" alignItems="center">
                  <Button 
                    onClick={() => { setAuthTab('signup'); setShowAuth(true); }}
                    variant="contained" 
                    size="large"
                    sx={{ 
                      bgcolor: '#010057', 
                      color: '#fff', 
                      px: 8, 
                      py: 2.2, 
                      borderRadius: '4px',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      fontFamily: 'Agrandir, serif',
                      textTransform: 'none',
                      boxShadow: '0 10px 30px rgba(1, 0, 87, 0.2)',
                      transition: 'all 0.4s ease',
                      width: { xs: '100%', sm: 'auto' },
                      '&:hover': { 
                        bgcolor: '#0A0A8E',
                        transform: 'translateY(-2px)', 
                        boxShadow: '0 15px 35px rgba(1, 0, 87, 0.3)' 
                      },
                    }}
                  >
                    Begin Onboarding
                  </Button>
                  
                  <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'Nunito, sans-serif' }}>
                    Already set up your password? <Button 
                      onClick={() => { setAuthTab('login'); setShowAuth(true); }}
                      variant="text" 
                      size="small" 
                      sx={{ 
                        color: '#010057', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        p: 0,
                        minWidth: 'auto',
                        verticalAlign: 'baseline',
                        fontFamily: 'Nunito, sans-serif',
                        '&:hover': { background: 'none', textDecoration: 'underline' }
                      }}
                    >Sign In</Button>
                  </Typography>

                  <Button 
                    variant="text" 
                    size="small"
                    onClick={() => { setHasBegun(true); setSection('welcome'); }}
                    sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 400, opacity: 0.7, '&:hover': { opacity: 1, background: 'none' } }}
                  >
                    Continue as Guest (No login)
                  </Button>
                </Stack>
              </Box>
            </Fade>
          ) : (
            <Fade in={showAuth}>
              <Box sx={{ maxWidth: 400, mx: 'auto', width: '100%' }}>
                <Typography variant="h4" sx={{ color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 700, mb: 1 }}>
                  {authTab === 'login' ? 'Partner Login' : 'Finalize Your Access'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontFamily: 'Nunito, sans-serif' }}>
                  {authTab === 'login' 
                    ? 'Enter your credentials to access your dashboard.' 
                    : 'Set up your secure portal credentials to complete approval.'}
                </Typography>
                {appId && (
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2, fontStyle: 'italic' }}>
                    Application ID: {appId}
                  </Typography>
                )}

                {authError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{authError}</Alert>}

                <Box component="form" onSubmit={authTab === 'login' ? handleLoginSubmit : handleSignupSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {authTab === 'signup' && (
                    <TextField 
                      fullWidth label="Choose Username" variant="outlined" 
                      value={suUsername} onChange={(e) => setSuUsername(e.target.value)}
                      required disabled={authLoading}
                    />
                  )}
                  <TextField 
                    fullWidth label={authTab === 'login' ? "Username or Email" : "Email Address"} 
                    variant="outlined" 
                    value={authTab === 'login' ? username : suEmail}
                    onChange={(e) => authTab === 'login' ? setUsername(e.target.value) : setSuEmail(e.target.value)}
                    required disabled={authLoading}
                  />
                  <TextField 
                    fullWidth label="Pick a Password" type="password" variant="outlined" 
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
                      bgcolor: '#C5A059', // Secondary CTA also Gold
                      color: '#fff',
                      py: 2, 
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mt: 1,
                      fontFamily: 'Agrandir, serif',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        bgcolor: '#010057', 
                        boxShadow: '0 10px 30px rgba(1, 0, 87, 0.3)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {authLoading ? <CircularProgress size={26} color="inherit" /> : (authTab === 'login' ? 'Sign In' : 'Finalize Access')}
                  </Button>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button 
                      variant="text" 
                      onClick={() => setShowAuth(false)}
                      sx={{ color: '#64748B', textTransform: 'none', fontFamily: 'Nunito, sans-serif' }}
                    >
                      Back
                    </Button>
                    <Button 
                      variant="text" 
                      onClick={() => setAuthTab(authTab === 'login' ? 'signup' : 'login')}
                      sx={{ color: '#010057', fontWeight: 700, textTransform: 'none', fontFamily: 'Nunito, sans-serif' }}
                    >
                      {authTab === 'login' ? 'Setup New Access' : 'Sign In'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Fade>
          )}

          <Box sx={{ mt: 10, pt: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={4} sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'Nunito, sans-serif', letterSpacing: 1 }}>
                PORTAL ID: <Typography component="span" variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>{appId || 'NEW_APPLICATION'}</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'Nunito, sans-serif', letterSpacing: 1 }}>
                STATUS: <Typography component="span" variant="caption" sx={{ color: companyBilling.companyName ? '#4CAF50' : '#010057', fontWeight: 800 }}>
                  {companyBilling.companyName ? 'CONNECTED' : (appId ? 'READY TO START' : 'WAITING')}
                </Typography>
              </Typography>
            </Stack>
            
            <Typography variant="caption" sx={{ display: 'block', color: '#B0BEC5', mt: 1, opacity: 0.5 }}>
              Build: 2026.01.12.0815 | Trace: {appId || 'NONE'}
            </Typography>
            
            <Typography variant="caption" sx={{ display: 'block', color: '#B0BEC5', mt: 2 }}>
              Need help? Contact <a href="mailto:support@experiahub.com" style={{ color: 'inherit', fontWeight: 600 }}>Partner Relations</a>
            </Typography>
            
            {!appId && (
              <Box sx={{ mt: 2, maxWidth: 300, mx: 'auto' }}>
                <TextField 
                  fullWidth
                  size="small" 
                  placeholder="Enter Application ID manually" 
                  value={tempAppId} 
                  onChange={(e)=>setTempAppId(e.target.value)}
                  InputProps={{
                    sx: { fontFamily: 'Nunito, sans-serif', fontSize: '0.875rem' },
                    endAdornment: (
                      <Button size="small" sx={{ ml: 1, color: '#4A7C8C', fontWeight: 700 }} onClick={()=>{
                        const id = (tempAppId||'').trim();
                        if (!id) return;
                        try { localStorage.setItem('supplier_application_id', id); } catch {}
                        window.location.href = `/supplier?appId=${encodeURIComponent(id)}`;
                      }}>Set</Button>
                    )
                  }}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );

  React.useEffect(() => {
    const load = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await res.json();
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
      setDefaultCurrency(c);
      setDefaultTimeZone(tz);
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

  const saveAllExperiences = async (nextExperiences: Experience[]) => {
    if (!appId) return;
    const payload = { applicationId: appId, activities: nextExperiences.map(({ id, ...rest }) => rest) };
    const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'Save failed');
  };

  const onSaveDetails = async () => {
    if (!selectedExperienceId) { setToast('Select an Experience'); return; }
    try {
      const next = experiences.map(e => e.id === selectedExperienceId ? { ...e, ...details } as Experience : e);
      setExperiences(next);
      await saveAllExperiences(next);
      setToast('Experience saved');
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
      const json = await res.json();
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
      const json = await res.json();
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
  if (isLoading) return loadingView;
  if (!isLoggedIn && !hasBegun) return <LoggedOutView />;

  // Logged-in view with left sidebar
  return (
    <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
    <Box sx={{
      minHeight: '100vh',
      py: 6,
      px: 2,
      bgcolor: 'rgba(255, 255, 255, 0.25)',
      backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(1, 0, 87, 0.05), transparent 45%), radial-gradient(circle at 80% 20%, rgba(255, 191, 0, 0.08), transparent 40%)'
    }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: section !== 'welcome' ? '240px 1fr 220px' : '240px 1fr' }, gap: 2, maxWidth: 1280, mx: 'auto' }}>
        {/* Sidebar */}
        <Paper sx={{ p: 2, borderRadius: 1, height: 'fit-content', position: 'sticky', top: 24, width: { md: 230 }, transition: 'all .3s ease' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
              alt="ExperiaHub Logo"
              style={{ height: 'auto', width: '100%', maxWidth: '200px' }}
            />
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, letterSpacing: '.3px', color: '#777', textAlign: 'left' }}>Navigation</Typography>
          <List>
            <ListItemButton selected={section==='welcome'} onClick={() => { setSection('welcome'); setTab(0); setSubsection('resources'); }} sx={{ ...(section==='welcome'?{ bgcolor:'#F0F4F6' }:{} ) }}>
              <ListItemText primary="Welcome" />
            </ListItemButton>
            <ListItemButton selected={section==='company'} onClick={() => { setSection('company'); setTab(0); setSubsection('profile'); }} sx={{ ...(section==='company'?{ bgcolor:'#F0F4F6' }:{} ) }}>
              <ListItemText primary="Company" />
            </ListItemButton>
            <ListItemButton selected={section==='user'} onClick={() => { setSection('user'); setTab(0); setSubsection('user_profile'); }} sx={{ ...(section==='user'?{ bgcolor:'#F0F4F6' }:{} ) }}>
              <ListItemText primary="User" />
            </ListItemButton>
            <ListItemButton selected={section==='experiences'} onClick={() => { setSection('experiences'); setTab(0); setSubsection('overview'); }} sx={{ ...(section==='experiences'?{ bgcolor:'#F0F4F6' }:{} ) }}>
              <ListItemText primary="Experiences" />
            </ListItemButton>
            <ListItemButton selected={section==='information'} onClick={() => { setSection('information'); setTab(0); setSubsection('resources'); }} sx={{ ...(section==='information'?{ bgcolor:'#F0F4F6' }:{} ) }}>
              <ListItemText primary="Information" />
            </ListItemButton>
          </List>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" fullWidth onClick={() => window.location.reload()}>Refresh</Button>
            {isLoggedIn ? (
              <Button variant="outlined" size="small" fullWidth onClick={() => { logout?.(); setHasBegun(false); }}>Log out</Button>
            ) : (
              <Button variant="contained" size="small" fullWidth sx={{ bgcolor: '#010057' }} onClick={() => { setHasBegun(false); }}>Sign in</Button>
            )}
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" sx={{ color: '#888', mb: 0.5, pl: 1 }}>Resources</Typography>
          <List>
            <ListItemButton dense component="a" href="https://experiahub.com/supplier-agreement/" target="_blank"><ListItemText primary="Supplier Agreement" /></ListItemButton>
            <ListItemButton dense component="a" href="https://experiahub.com/suppliers/" target="_blank"><ListItemText primary="Supplier Signup Info" /></ListItemButton>
            <ListItemButton dense onClick={()=>setSupportOpen(true)}><ListItemText primary="Contact Support" /></ListItemButton>
          </List>
        </Paper>

        {/* Main content */}
        <Paper sx={{
          p: 3,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.8)',
          color: '#3b4850',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(1, 0, 87, 0.05)',
          transition: 'transform .25s ease, opacity .25s ease'
        }}>
        {/* Header block: Row 1 title, Row 2 meta */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" sx={{ color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 600, letterSpacing: '.2px' }}>
              Supplier Portal
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ color: '#4A7C8C', fontFamily: 'Nunito, sans-serif' }}>
              {sectionLabel}{subsectionLabel ? ` · ${subsectionLabel}` : ''}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ color: '#666' }}>App ID: <strong>{appId || '—'}</strong></Typography>
              {!isLoggedIn && (
                <Chip
                  label="Guest Session"
                  size="small"
                  onClick={() => setHasBegun(false)}
                  sx={{ bgcolor: 'rgba(197, 160, 89, 0.1)', color: '#C5A059', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(197, 160, 89, 0.3)' }}
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
        {/* Contextual sub-navigation moved to right rail (center segmented removed) */}

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
                  <Box sx={{ width: '100%', height: 0, pb: '62.5%', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', background: 'radial-gradient(120% 120% at 0% 0%, rgba(74,124,140,0.2), transparent), radial-gradient(120% 120% at 100% 0%, rgba(255,183,107,0.2), transparent), #f7f9fb', position: 'relative' }}>
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
                  <Button startIcon={<ApartmentIcon />} variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={() => { setSection('company'); setSubsection('profile'); }}>Start Company</Button>
                  <Button startIcon={<PersonOutlineIcon />} variant="outlined" onClick={() => { setSection('user'); setSubsection('user_profile'); }}>Start User</Button>
                  <Button startIcon={<CollectionsIcon />} variant="outlined" onClick={() => { setSection('experiences'); setSubsection('overview'); }}>Start Experiences</Button>
                </Stack>
              </Box>
            </Paper>
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'profile' && (
          <Fade in timeout={250}>
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>Application ID: <strong>{appId || '—'}</strong></Alert>
            {!appId ? (
              <Alert severity="warning">Missing application ID. Please open the signup email link or add <code>?appId=... </code> to the URL.</Alert>
            ) : (
              <OnboardingForm applicationId={appId} />
            )}
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection.startsWith('payouts_') && (
          <Fade in timeout={250}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>{subsectionLabel}</Typography>
              {subsection === 'payouts_overview' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#666' }}>
                      Connect your payout account to receive earnings. We use Stripe Connect for secure onboarding and payouts.
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`Status: ${payoutStatus || 'Unknown'}`} color={payoutStatus==='verified'?'success':(payoutStatus==='pending'?'warning':'default')} variant="outlined" />
                      {stripeAccountId && (<Chip size="small" label={`Acct: ${stripeAccountId}`} variant="outlined" />)}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={()=>setSubsection('payouts_connect')}>
                        {payoutStatus==='pending' ? 'Resume onboarding' : 'Start onboarding'}
                      </Button>
                      {stripeDashboardUrl && (
                        <Button size="small" variant="outlined" component="a" href={stripeDashboardUrl} target="_blank" rel="noreferrer">Open Stripe Dashboard</Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {subsection === 'payouts_connect' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#666' }}>
                      Begin Stripe onboarding to add your bank details and business information.
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ width: 'fit-content', bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}
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
          <Box>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={2}>
                <TextField label="Company name" value={companyBilling.companyName} onChange={(e)=>setCompanyBilling(s=>({ ...s, companyName: e.target.value }))} fullWidth />
                <TextField label="Billing address" value={companyBilling.address} onChange={(e)=>setCompanyBilling(s=>({ ...s, address: e.target.value }))} fullWidth />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Country" value={companyBilling.country} onChange={(e)=>setCompanyBilling(s=>({ ...s, country: e.target.value }))} fullWidth />
                  <TextField label="Tax ID" value={companyBilling.taxId} onChange={(e)=>setCompanyBilling(s=>({ ...s, taxId: e.target.value }))} fullWidth />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Invoice email" value={companyBilling.invoiceEmail} onChange={(e)=>setCompanyBilling(s=>({ ...s, invoiceEmail: e.target.value }))} fullWidth />
                  <TextField label="Billing currency" value={companyBilling.currency} onChange={(e)=>setCompanyBilling(s=>({ ...s, currency: e.target.value }))} onBlur={(e)=>setCompanyBilling(s=>({ ...s, currency: String(e.target.value||'').toUpperCase() }))} fullWidth />
                </Stack>
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/company/billing/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, billing: companyBilling })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    setToast('Billing saved');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Billing</Button>
              </Stack>
          </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'legal' && (
          <Fade in timeout={250}>
          <Box>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={2}>
                <TextField label="Legal entity name" value={companyLegal.legalName} onChange={(e)=>setCompanyLegal(s=>({ ...s, legalName: e.target.value }))} fullWidth />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Registration number" value={companyLegal.regNumber} onChange={(e)=>setCompanyLegal(s=>({ ...s, regNumber: e.target.value }))} fullWidth />
                  <TextField label="VAT number" value={companyLegal.vatNumber} onChange={(e)=>setCompanyLegal(s=>({ ...s, vatNumber: e.target.value }))} fullWidth />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Terms URL" value={companyLegal.termsUrl} onChange={(e)=>setCompanyLegal(s=>({ ...s, termsUrl: e.target.value }))} fullWidth />
                  <TextField label="Privacy URL" value={companyLegal.privacyUrl} onChange={(e)=>setCompanyLegal(s=>({ ...s, privacyUrl: e.target.value }))} fullWidth />
                </Stack>
                <TextField label="Representative" value={companyLegal.representative} onChange={(e)=>setCompanyLegal(s=>({ ...s, representative: e.target.value }))} fullWidth />
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/company/legal/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, legal: companyLegal })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    setToast('Legal saved');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Legal</Button>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'company' && subsection === 'locations' && (
          <Fade in timeout={250}>
            <Box>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={2}>
                {companyLocations.map((loc, idx) => (
                  <Paper key={idx} sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <TextField label="Location name" value={loc.name} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, name: e.target.value }:x))} fullWidth />
                      <TextField label="Address" value={loc.address} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, address: e.target.value }:x))} fullWidth />
                      <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                        <TextField label="City" value={loc.city} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, city: e.target.value }:x))} fullWidth />
                        <TextField label="Country" value={loc.country} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, country: e.target.value }:x))} fullWidth />
                        <TextField label="Time zone" value={loc.timeZone} onChange={(e)=>setCompanyLocations(arr=>arr.map((x,i)=>i===idx?{ ...x, timeZone: e.target.value }:x))} fullWidth />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={()=>setCompanyLocations(arr=>[...arr, { name:'', address:'', city:'', country:'', timeZone: defaultTimeZone || 'UTC' }])}>Add Location</Button>
                  <Button size="small" variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      const res = await fetch(`${N8N_BASE}/supplier/company/locations/save`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicationId: appId, locations: companyLocations })
                      });
                      const json = await res.json();
                      if (!json?.success) throw new Error(json?.error || 'Save failed');
                      setToast('Locations saved');
                    } catch (e: any) { setToast(e?.message || 'Save failed'); }
                  }}>Save Locations</Button>
                </Stack>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'user' && subsection === 'user_profile' && (
          <Fade in timeout={250}>
            <Box>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={2}>
                <TextField label="Display name" value={userDisplayName} onChange={(e)=>setUserDisplayName(e.target.value)} fullWidth required error={!userDisplayName.trim()} helperText={!userDisplayName.trim() ? 'Required' : ''} />
                <TextField label="Phone" value={userPhone} onChange={(e)=>setUserPhone(e.target.value)} fullWidth />
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    if (!userDisplayName.trim()) { setToast('Please enter a display name'); return; }
                    const res = await fetch(`${N8N_BASE}/supplier/user/profile/save`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ applicationId: appId, profile: { displayName: userDisplayName, phone: userPhone } })
                    });
                    const json = await res.json();
                    if (!json?.success) throw new Error(json?.error || 'Save failed');
                    setToast('Profile saved');
                  } catch (e: any) { setToast(e?.message || 'Save failed'); }
                }}>Save Profile</Button>
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'user' && subsection === 'user_security' && (
          <Fade in timeout={250}>
            <Box>
              {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
              <Stack spacing={2}>
                <TextField label="Current password" type="password" value={passwordCurrent} onChange={(e)=>setPasswordCurrent(e.target.value)} fullWidth required error={!passwordCurrent.trim()} helperText={!passwordCurrent.trim()?'Required':''} />
                <TextField label="New password" type="password" value={passwordNew} onChange={(e)=>setPasswordNew(e.target.value)} fullWidth required error={passwordNew.length>0 && passwordNew.length<8} helperText={passwordNew.length>0 && passwordNew.length<8 ? 'Min 8 characters' : ''} />
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}
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
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>API Tokens</Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="Login or Email" value={tokensUser} onChange={(e)=>setTokensUser(e.target.value)} fullWidth />
                  <TextField size="small" label="Current Password" type="password" value={tokensPassword} onChange={(e)=>setTokensPassword(e.target.value)} fullWidth />
                  <Button size="small" variant="contained" disabled={tokensLoading} onClick={loadTokens}>Load</Button>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Token Name" value={tokenName} onChange={(e)=>setTokenName(e.target.value)} />
                  <Button size="small" variant="outlined" disabled={tokenMutating || tokensLoading} onClick={createToken}>Create Token</Button>
                </Stack>

                {tokensLoading && (<Alert severity="info">Loading tokens…</Alert>)}
                {!tokensLoading && apiTokens.length === 0 && (<Alert severity="info">No API tokens yet.</Alert>)}

                {apiTokens.map((t)=> (
                  <Stack key={t.uuid} direction="row" spacing={1} alignItems="center">
                    <TextField size="small" value={`${t.name} — ${t.uuid}`} fullWidth />
                    <Button size="small" disabled={tokenMutating} onClick={()=>deleteToken(t.uuid)}>Remove</Button>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'overview' && (
          <Fade in timeout={250}>
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>Create draft experiences (title, city, duration). Saving will push to n8n later.</Alert>
            <ActivitiesSkeleton onToast={(m)=>setToast(m)} />
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'media' && (
          <Fade in timeout={250}>
          <Box>
              <Alert severity="info" sx={{ mb: 2 }}>Add Google Drive links for photos/videos, or paste YouTube/Vimeo URLs.</Alert>
              <GridLikeMedia onToast={(m)=>setToast(m)} defaultActivityId={selectedExperienceId} />
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'pricing' && (
          <Fade in timeout={250}>
          <Box>
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
                    <TableCell><TextField size="small" value={r.category} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, category:e.target.value}:x))} /></TableCell>
                    <TableCell><TextField size="small" type="number" inputProps={{ min: 0, step: '0.01' }} value={r.amount} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, amount:e.target.value}:x))} /></TableCell>
                    <TableCell><TextField size="small" value={r.currency} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, currency:e.target.value}:x))} /></TableCell>
                    <TableCell align="right"><Button size="small" color="error" onClick={()=>setPricingRows(rows=>rows.filter((_,i)=>i!==idx))}>Remove</Button></TableCell>
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
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button size="small" variant="outlined" onClick={()=>setPricingRows(rows=>[...rows, { category:'', amount:'', currency: details.currency || defaultCurrency || 'JPY' }])}>Add Row</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={async ()=>{
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
          <Stack spacing={2}>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit details.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Title" value={details.title || ''} onChange={(e)=>setDetails(d=>({ ...d, title: e.target.value }))} fullWidth error={showFieldErrors && !String(details.title||'').trim()} helperText={showFieldErrors && !String(details.title||'').trim() ? 'Title is required' : ''} />
                </Stack>
                <TextField label="Description" value={details.summary || ''} onChange={(e)=>setDetails(d=>({ ...d, summary: e.target.value }))} fullWidth multiline minRows={3} error={showFieldErrors && !String(details.summary||'').trim()} helperText={showFieldErrors && !String(details.summary||'').trim() ? 'Description is required' : ''} />
                <TextField label="Itinerary (optional)" value={(details as any).itinerary || ''} onChange={(e)=>setDetails(d=>({ ...d, itinerary: e.target.value } as any))} fullWidth multiline minRows={3} />
                <TextField label="Meeting point (optional)" value={(details as any).meetingPoint || ''} onChange={(e)=>setDetails(d=>({ ...d, meetingPoint: e.target.value } as any))} fullWidth />
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="City" value={details.city || ''} onChange={(e)=>setDetails(d=>({ ...d, city: e.target.value }))} fullWidth error={showFieldErrors && !String(details.city||'').trim()} helperText={showFieldErrors && !String(details.city||'').trim() ? 'City is required' : ''} />
                  <TextField label="Duration (minutes)" type="number" inputProps={{ min: 0, step: 1 }} value={details.durationMinutes || ''} onChange={(e)=>setDetails(d=>({ ...d, durationMinutes: e.target.value }))} fullWidth error={showFieldErrors && !String(details.durationMinutes||'').trim()} helperText={showFieldErrors && !String(details.durationMinutes||'').trim() ? 'Duration is required' : ''} />
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
                      <TextField label="Max participants" type="number" inputProps={{ min: 1, step: 1 }} value={details.maxParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, maxParticipants: e.target.value }))} fullWidth error={showFieldErrors && !String(details.maxParticipants||'').trim()} helperText={showFieldErrors && !String(details.maxParticipants||'').trim() ? 'Capacity is required' : ''} />
                      <TextField label="Min participants" type="number" inputProps={{ min: 1, step: 1 }} value={details.minParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, minParticipants: e.target.value }))} fullWidth />
                    </Stack>
                  );
                })()}
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={onSaveDetails}>Save Details</Button>
              </>
            )}
          </Stack>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'availability' && (
          <Fade in timeout={250}>
          <Stack spacing={2}>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit availability.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Scheduling mode" value={details.schedulingMode || ''} onChange={(e)=>setDetails(d=>({ ...d, schedulingMode: e.target.value }))} fullWidth error={showFieldErrors && !String(details.schedulingMode||'').trim()} helperText={showFieldErrors && !String(details.schedulingMode||'').trim() ? 'Scheduling mode is required' : ''} />
                  <TextField label="Start times / hours" value={details.startTimes || ''} onChange={(e)=>setDetails(d=>({ ...d, startTimes: e.target.value }))} fullWidth error={showFieldErrors && !String(details.startTimes||'').trim()} helperText={showFieldErrors && !String(details.startTimes||'').trim() ? 'Start times are required' : ''} />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Cutoff / Lead time (hours)" value={details.cutoffHours || ''} onChange={(e)=>setDetails(d=>({ ...d, cutoffHours: e.target.value }))} fullWidth error={showFieldErrors && !String((details.cutoffHours||details.bookingLeadTime||'')).trim()} helperText={showFieldErrors && !String((details.cutoffHours||details.bookingLeadTime||'')).trim() ? 'Cutoff/Lead time is required' : ''} />
                  <TextField label="Max participants" value={details.maxParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, maxParticipants: e.target.value }))} fullWidth error={showFieldErrors && !String(details.maxParticipants||'').trim()} />
                </Stack>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="tz-label">Time zone</InputLabel>
                    <Select labelId="tz-label" label="Time zone" value={(details as any).timeZone || defaultTimeZone || ''} onChange={(e)=>setDetails(d=>({ ...d, timeZone: String(e.target.value) } as any))}>
                      {TIME_ZONES.map((tz)=> (<MenuItem key={tz} value={tz}>{tz}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <TextField label="Latitude" placeholder="e.g., 35.0116" value={(details as any).latitude || ''} onChange={(e)=>setDetails(d=>({ ...d, latitude: e.target.value } as any))} fullWidth />
                  <TextField label="Longitude" placeholder="e.g., 135.7681" value={(details as any).longitude || ''} onChange={(e)=>setDetails(d=>({ ...d, longitude: e.target.value } as any))} fullWidth />
                </Stack>
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={onSaveDetails}>Save Availability</Button>
              </>
            )}
          </Stack>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'policies' && (
          <Fade in timeout={250}>
          <Stack spacing={2}>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit policies.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Cancellation policy" value={details.cancellationPolicy || ''} onChange={(e)=>setDetails(d=>({ ...d, cancellationPolicy: e.target.value }))} fullWidth />
                  <TextField label="Minimum age (optional)" value={(details as any).minAge || ''} onChange={(e)=>setDetails(d=>({ ...d, minAge: e.target.value } as any))} fullWidth />
                </Stack>
                <Button variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={onSaveDetails}>Save Policies</Button>
              </>
            )}
          </Stack>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'distribution' && (
          <Fade in timeout={250}>
          <Stack spacing={2}>
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
                      <Button size="small" variant="outlined" onClick={() => {
                        try {
                          const pre = document.querySelector('[data-preview-payload]') as HTMLElement | null;
                          const text = pre ? pre.innerText : '';
                          navigator.clipboard.writeText(text || '');
                          setToast('Payload copied');
                        } catch { setToast('Copy failed'); }
                      }}>Copy JSON</Button>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => {
                        try {
                          const pre = document.querySelector('[data-preview-payload]') as HTMLElement | null;
                          const text = pre ? pre.innerText : '';
                          navigator.clipboard.writeText(text || '');
                          alert('Payload copied to clipboard');
                        } catch {}
                      }}>Copy JSON</Button>
                    </Stack>
                  </>
                ); })()}
              </>
            )}
          </Stack>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'validation' && (
          <Fade in timeout={250}>
          <Stack spacing={2}>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to validate.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center">
                  <Button variant="outlined" disabled={validating} onClick={runValidation}>{validating ? 'Validating…' : 'Run Validation'}</Button>
                  <Button variant="outlined" disabled={validating || experiences.length===0} onClick={async ()=>{
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
          </Fade>
        )}

        {section === 'experiences' && subsection === 'sync' && (
          <Fade in timeout={250}>
          <Stack spacing={2}>
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
                  <Button size="small" variant="outlined" onClick={async ()=>{
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
                  <Button size="small" variant="outlined" onClick={async ()=>{
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
                  sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }}
                  onClick={syncSelected}
                  disabled={(validationMap[selectedExperienceId] ?? Infinity) !== 0}
                >
                  Sync to Bókun
                </Button>
                {(validationMap[selectedExperienceId] ?? Infinity) !== 0 && (
                  <Typography variant="caption" sx={{ color: '#a15b00' }}>
                    Run Validation and fix issues before syncing.
                  </Typography>
                )}
              </>
            )}
          </Stack>
          </Fade>
        )}

        {section === 'user' && (
          <Stack spacing={2}>
            <Alert severity="info">Choose a background image for your portal (per-user).</Alert>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems={{ xs:'stretch', sm:'center' }}>
              <TextField
                size="small"
                label="Search photos"
                value={bgSearch}
                onChange={(e)=>{
                  const v = e.target.value;
                  setBgSearch(v);
                  if (!v.trim()) { setBgResults([]); setBgPage(1); setBgSeed((s)=>s+1); }
                }}
                fullWidth
                InputProps={{
                  endAdornment: bgSearch ? (
                    <IconButton size="small" aria-label="Clear" onClick={()=>{ setBgSearch(''); setBgResults([]); setBgPage(1); setBgSeed((s)=>s+1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }}
              />
              <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} onClick={async ()=>{
                try {
                  setBgLoading(true);
                  const results = await searchUnsplash(bgSearch.trim(), 1, 30);
                  setBgResults(Array.isArray(results) ? results : []);
                  setBgPage(1);
                } catch {
                  setBgResults([]);
                } finally { setBgLoading(false); }
              }}>Search</Button>
              <Button size="small" onClick={()=>{ setBgSearch(''); setBgResults([]); setBgSeed((s)=>s+1); }}>Clear</Button>
            </Stack>
            <Box
              sx={{ display:'grid', gridTemplateColumns: { xs:'1fr 1fr', sm:'repeat(3, 1fr)' }, gap: 1, maxHeight: 460, overflowY: 'auto' }}
              onScroll={async (e:any)=>{
                try {
                  if (bgLoadingMore) return;
                  const el = e.currentTarget as HTMLElement;
                  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
                  if (!nearBottom) return;
                  setBgLoadingMore(true);
                  const next = bgPage + 1;
                  const more = bgSearch.trim() ? await searchUnsplash(bgSearch.trim(), next, 30) : [];
                  const existing = new Set((bgResults||[]).map((x:any)=>x?.id));
                  const merged = [...bgResults, ...more.filter((x:any)=> !existing.has(x?.id))];
                  setBgResults(merged);
                  setBgPage(next);
                } finally { setBgLoadingMore(false); }
              }}
            >
                {(!bgSearch.trim() && bgResults.length === 0 ? getCuratedBackgrounds().slice().sort(()=>Math.random()-0.5) : []).map((p, idx)=> (
                  <Paper key={`cur_${idx}`} sx={{ p: 1, borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label="Use curated background"
                      sx={{ position:'relative', pb: '66%', borderRadius: 1, overflow:'hidden', background:'#e9eef2', cursor: 'pointer' }}
                      onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                      onClick={async ()=>{
                      const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                      const next = { url: p.url, thumbUrl: p.thumbUrl } as PortalBackground;
                      setBg(next);
                      prefetchBackgroundImage(p.url);
                      saveCachedBackground(next, 'user');
                      try { await setUserBackground(token, next); } catch {}
                      try { trackBackgroundChange('supplier', next); } catch {}
                      setToast('Background updated');
                    }}
                    >
                    <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', background:'#e9eef2' }} />
                    </Box>
                  </Paper>
                ))}
                {bgResults.map((p:any)=>{
                  const id = p?.id;
                  const authorName = p?.user?.name || '';
                  const authorUrl = p?.user?.links?.html || p?.user?.portfolio_url || '';
                      const url = p?.urls?.full || p?.urls?.regular || '';
                  const thumb = p?.urls?.small || p?.urls?.thumb || '';
                  return (
                    <Paper key={id} sx={{ p: 1, borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ position:'relative', pb: '66%', borderRadius: 1, overflow:'hidden', background:'#e9eef2' }}>
                        <img src={thumb} alt={`Unsplash: ${p?.alt_description || authorName || 'photo'}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button size="small" variant="outlined" aria-label={`Use image by ${authorName || 'author'}`} onClick={async ()=>{
                          const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                          const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as PortalBackground;
                          setBg(next);
                          prefetchBackgroundImage(url);
                          saveCachedBackground(next, 'user');
                          try { await trackDownload(id); } catch (e) { console.warn('unsplash track failed', e); }
                          try { await setUserBackground(token, next); } catch {}
                          try { trackBackgroundChange('supplier', next); } catch {}
                          setToast('Background updated');
                        }}>Use</Button>
                      </Stack>
                    </Paper>
                  );
                })}
            </Box>
            {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={80} />)}
            <Stack direction="row" spacing={1}>
              <Button size="small" color="error" variant="outlined" onClick={async ()=>{
                const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                setBg(null);
                saveCachedBackground(null, 'user');
                try { await setUserBackground(token, null); } catch {}
                try { trackBackgroundRemove('supplier'); } catch {}
                setToast('Background removed');
              }}>Remove Background</Button>
            </Stack>
          </Stack>
        )}

        {section === 'information' && (
          <Box>
            {subsection === 'resources' && (
              <>
                {/* content heading removed to avoid duplicate with subtitle breadcrumb */}
                <List>
                  <ListItemButton dense component="a" href="https://experiahub.com/supplier-agreement/" target="_blank"><ListItemText primary="Supplier Agreement" /></ListItemButton>
                  <ListItemButton dense component="a" href="https://experiahub.com/suppliers/" target="_blank"><ListItemText primary="Supplier Signup Info" /></ListItemButton>
                  <ListItemButton dense onClick={()=>setSupportOpen(true)}><ListItemText primary="Contact Support" /></ListItemButton>
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
        {section !== 'welcome' && (
        <Paper sx={{ p: 2, borderRadius: 1, height: 'fit-content', position: 'sticky', top: 24, display: { xs: 'none', md: 'block' }, transition: 'all .3s ease' }}>
          {section === 'company' && (
            <List>
              <ListItemButton selected={subsection==='profile'} onClick={()=>setSubsection('profile')}><ListItemText primary="Profile" /></ListItemButton>
              <ListItemButton selected={subsection==='billing'} onClick={()=>setSubsection('billing')}><ListItemText primary="Billing" /></ListItemButton>
              <ListItemButton selected={subsection==='legal'} onClick={()=>setSubsection('legal')}><ListItemText primary="Legal" /></ListItemButton>
              <ListItemButton selected={subsection==='locations'} onClick={()=>setSubsection('locations')}><ListItemText primary="Locations" /></ListItemButton>
              <ListItemButton selected={subsection.startsWith('payouts_')} onClick={()=>setSubsection('payouts_overview')}><ListItemText primary="Payouts" /></ListItemButton>
            </List>
          )}
          {section === 'user' && (
            <List>
              <ListItemButton selected={subsection==='user_profile'} onClick={()=>setSubsection('user_profile')}><ListItemText primary="Profile" /></ListItemButton>
              <ListItemButton selected={subsection==='user_security'} onClick={()=>setSubsection('user_security')}><ListItemText primary="Security" /></ListItemButton>
            </List>
          )}
          {section === 'experiences' && (
            <>
              <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                <InputLabel id="exp-select-label">Selected Experience</InputLabel>
                <Select labelId="exp-select-label" label="Selected Experience" value={selectedExperienceId} onChange={(e)=>setSelectedExperienceId(String(e.target.value))}>
                  {activitiesSimple.map((a)=> (<MenuItem key={a.id} value={a.id}>{a.title}</MenuItem>))}
                </Select>
              </FormControl>
              <List>
                {(() => { const c = getSectionChecks(); return (
                  <>
                    <ListItemButton selected={subsection==='overview'} onClick={()=>setSubsection('overview')}><ListItemText primary="Overview" /></ListItemButton>
                    <ListItemButton selected={subsection==='details'} onClick={()=>setSubsection('details')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Details {c.details.ok ? <Chip size="small" label="OK" color="success"/> : <Chip size="small" label="Need" color="warning"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='media'} onClick={()=>setSubsection('media')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Media {mediaOk ? <Chip size="small" label="OK" color="success"/> : <Chip size="small" label="Need" color="warning"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='pricing'} onClick={()=>setSubsection('pricing')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Pricing {c.pricing.ok ? <Chip size="small" label="OK" color="success"/> : <Chip size="small" label="Need" color="warning"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='availability'} onClick={()=>setSubsection('availability')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Availability {c.availability.ok ? <Chip size="small" label="OK" color="success"/> : <Chip size="small" label="Need" color="warning"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='policies'} onClick={()=>setSubsection('policies')}><ListItemText primary="Policies" /></ListItemButton>
                    <ListItemButton selected={subsection==='distribution'} onClick={()=>setSubsection('distribution')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Distribution {experiences.find(e=>e.id===selectedExperienceId)?.bokunProductId ? <Chip size="small" label="Linked" color="success"/> : <Chip size="small" label="Unlinked" color="default"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='validation'} onClick={()=>setSubsection('validation')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Validation {c.validation.ok ? <Chip size="small" label="OK" color="success"/> : <Chip size="small" label={`${c.validation.count||0}`} color="warning"/>}</Box>} />
                    </ListItemButton>
                    <ListItemButton selected={subsection==='sync'} onClick={()=>setSubsection('sync')}>
                      <ListItemText primary={<Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>Sync {c.sync.ok ? <Chip size="small" label="Done" color="success"/> : <Chip size="small" label="Pending" color="default"/>}</Box>} />
                    </ListItemButton>
                  </>
                ); })()}
              </List>
            </>
          )}
          {section === 'information' && (
            <List>
              <ListItemButton selected={subsection==='resources'} onClick={()=>setSubsection('resources')}><ListItemText primary="Resources" /></ListItemButton>
            </List>
        )}
        </Paper>
        )}
        <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast || ''} />
      </Box>
      <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'supplier'} appId={appId} />
    </Box>
    </BackgroundImage>
  );
}

