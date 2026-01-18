'use client';

// Route segment config removed as this is a Client Component
// useSearchParams usage automatically opts into dynamic rendering where needed


import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Paper, Typography, Alert, Button, Stack, TextField, List, ListItemButton, ListItemText, Divider, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, MenuItem, Select, FormControl, InputLabel, Chip, Fade, Skeleton, Container, Grid, Tooltip, CircularProgress, ToggleButtonGroup, ToggleButton, Fab, Popover, Tabs, Tab, Stepper, Step, StepLabel, Checkbox } from '@mui/material';
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
import BookingsView from './BookingsView';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
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

// Header component for experience management contexts
const ContextHeader = ({ title }: { title: string }) => (
  <Box sx={{ mb: 3, position: 'relative' }}>
    <Typography variant="overline" sx={{ 
      color: '#C5A059', 
      fontWeight: 400, // Explicitly normal
      letterSpacing: '0.3em', 
      display: 'block', 
      mb: 1,
      fontSize: '0.7rem',
      lineHeight: 1.2
    }}>
      CONFIGURING UNIT
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Typography variant="h4" sx={{ 
        fontFamily: 'Agrandir, serif', 
        fontWeight: 400, // Explicitly normal
        color: '#010057',
        letterSpacing: '-0.02em',
        textTransform: 'none',
        lineHeight: 1.1
      }}>
        {title}
      </Typography>
      <Box sx={{ flexGrow: 1, height: '1px', background: 'linear-gradient(90deg, rgba(197, 160, 89, 0.3) 0%, rgba(197, 160, 89, 0) 100%)', mt: 1 }} />
    </Box>
  </Box>
);

// GridLikeMedia definition moved to @/components/supplier/GridLikeMedia.tsx

function ActivitiesSkeleton({ experiences, onUpdate, onSave, onToast, onEditDetails, appId }: { experiences: any[]; onUpdate: React.Dispatch<React.SetStateAction<any[]>>; onSave: (exps: any[]) => Promise<void>; onToast: (m: string) => void; onEditDetails?: (activity: any) => void; appId: string }) {
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
    photosDriveUrls?: string[];
    videoDriveUrl?: string;
    videoUrl?: string;
    status?: 'Published' | 'Unpublished';
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
  const [schedulingMode, setSchedulingMode] = React.useState('fixed_start_times');
  const [startTimes, setStartTimes] = React.useState('');
  const [cutoffHours, setCutoffHours] = React.useState('');
  const [pricingCategories, setPricingCategories] = React.useState('');
  const [baseRate, setBaseRate] = React.useState('');
  const [status, setStatus] = React.useState<'Published' | 'Unpublished'>('Unpublished');
  const [syncId, setSyncId] = React.useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetDeleteId, setTargetDeleteId] = React.useState<string | null>(null);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map(r => r.id)));
  };

  const confirmDelete = (id?: string) => {
    if (id) setTargetDeleteId(id);
    else setTargetDeleteId(null); // Bulk
    setDeleteDialogOpen(true);
  };
  
  const performDelete = async () => {
    const ids = targetDeleteId ? [targetDeleteId] : Array.from(selectedIds);
    if (!ids.length) return;
    
    // Optimistic remove
    const removed: Activity[] = [];
    setRows((rs) => {
      const remaining = rs.filter(r => !ids.includes(r.id));
      ids.forEach(id => { const r = rs.find(x => x.id === id); if (r) removed.push(r); });
      return remaining;
    });

    if (removed.length > 0) {
        // Just keep the last one for Undo for now
        setUndo({ id: removed[0].id, row: removed[0] }); 
    }
    
    // Sync to backend? Ideally yes, but 'saveAll' usually handles explicit saves.
    // If we want immediate backend delete, we need a 'delete' endpoint or save empty list?
    // Current saveAll saves the CURRENT rows. So we should trigger a save.
    // But let's verify if we want to auto-save deletes.
    // Yes, usually.
    const remaining = rows.filter(r => !ids.includes(r.id)); // Recalculate based on current closure 'rows' is stale? No, strictly use functional update or rely on 'saveAll' being called manually?
    // To be safe, let's trigger save with the filtered list IF we trust 'saveAll' logic.
    // Actually `saveAll` uses `rows` which is state. We just updated state.
    // We should call `onSave` with the NEW list.
    const nextRows = rows.filter(r => !ids.includes(r.id));
    try {
        await onSave(nextRows);
        onToast('Deleted');
    } catch(e) { console.error(e); }

    setDeleteDialogOpen(false);
    setSelectedIds(new Set());
    setTargetDeleteId(null);
  };  const [filterText, setFilterText] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'title'|'city'|'durationMinutes'|'price'>('title');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('asc');
  const [inlineId, setInlineId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [rowErrors, setRowErrors] = React.useState<Record<string, string[]>>({});
  const [undo, setUndo] = React.useState<{ id: string; row: Activity } | null>(null);
  // appId is now passed as prop


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
    setStatus('Unpublished');
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
    setStatus(a.status === 'Published' ? 'Published' : 'Unpublished');
    setOpen(true);
  };
  const remove = (id: string) => {
     confirmDelete(id);
  };

  // LocalStorage logic removed - handled by parent component



  const saveAll = async () => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const payload = { applicationId: appId, activities: rows.map(({ id, ...rest }) => ({ ...rest, id })) };
      const authToken = AuthService.getToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
        method: 'POST', headers, body: JSON.stringify(payload)
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

  const submitForm = async () => {
    if (!title.trim()) { onToast('Title required'); return; }
    const next: Activity = {
      ...editing, // Preserve existing fields
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
    
    // Optimistic update
    const updatedRows = editing ? rows.map((r) => (r.id === editing.id ? next : r)) : [next, ...rows];
    setRows(updatedRows);
    
    try {
      await onSave(updatedRows); // Determine if save succeeds
      
      setOpen(false); 
      resetForm();
      
      // If adding new, jump to details immediately
      if (!editing && onEditDetails) {
         onEditDetails(next);
      }
      onToast('Saved successfully');
    } catch (e: any) {
      console.error('Submit Form Error:', e);
      onToast(`Save failed: ${e.message || 'Unknown error'}`);
    }
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
    // Tier 2 (Bookable) - RELAXED for V41 to allow Publish click
    /*
    if (!a.schedulingMode?.trim()) errors.push('Tier 2: Scheduling mode is required');
    if (!a.startTimes?.trim()) errors.push('Tier 2: Start times/hours are required');
    if (!a.maxParticipants?.toString().trim()) errors.push('Tier 2: Capacity (max participants) is required');
    if (!(a.cutoffHours || a.bookingLeadTime)?.toString().trim()) errors.push('Tier 2: Cutoff/lead time is required');
    if (!a.currency?.trim()) errors.push('Tier 2: Currency is required');
    if (!a.pricingCategories?.trim()) errors.push('Tier 2: At least one pricing category is required');
    if (!a.baseRate?.toString().trim() && !a.price?.toString().trim()) errors.push('Tier 2: At least one rate is required');
    */
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
    setSyncId(a.id);
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
      setRows((rs) => rs.map((r) => r.id === a.id ? { ...r, bokunProductId: bokunId, status: 'Published' } : r));
      onToast(`Published! ID: ${bokunId || 'Pending'}`);
    } catch (e: any) {
      onToast(e?.message || 'Publish failed');
    } finally {
      setSyncId(null);
    }
  };



  const isPublishable = (r: Activity) => {
    // Basic check: must have title, city, duration, and at least one story element or logistic element
    return !!(r.title && r.city && r.durationMinutes);
  };

  return (
    <Box>


      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
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
        
        <Stack direction="row" spacing={1} alignItems="center">
           {selectedIds.size > 0 && (
               <Button 
                 variant="contained" 
                 color="error" 
                 startIcon={<DeleteOutlineIcon />}
                 onClick={() => confirmDelete()}
                 sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 400 }}
               >
                  Delete ({selectedIds.size})
               </Button>
           )}
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd} sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#C5A059' }, borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#fff', fontWeight: 400 }}>Add</Button>
          <Button variant="outlined" onClick={saveAll} disabled={saving} sx={{ borderRadius: 1, px: 2, fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#010057', borderColor: '#010057' }}>{saving ? 'Saving…' : 'Save all'}</Button>
        </Stack>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox 
                checked={rows.length > 0 && selectedIds.size === rows.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
                onChange={toggleAll}
              />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Title</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>City</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Duration (min)</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Price</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Bókun</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: 400 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows
            .filter(r => [r.title,r.city,r.durationMinutes].join(' ').toLowerCase().includes(filterText.toLowerCase()))
            .sort((a,b)=>{ const va=(a as any)[sortKey]||''; const vb=(b as any)[sortKey]||''; const comp=String(va).localeCompare(String(vb),undefined,{numeric:true,sensitivity:'base'}); return sortDir==='asc'?comp:-comp; })
            .map((r) => (
            <TableRow key={r.id} hover selected={selectedIds.has(r.id)}>
              <TableCell padding="checkbox">
                 <Checkbox checked={selectedIds.has(r.id)} onChange={() => toggleSelection(r.id)} />
              </TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.title} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,title:e.target.value}:x))} /> : r.title}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.city} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,city:e.target.value}:x))} /> : r.city}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.durationMinutes} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,durationMinutes:e.target.value}:x))} /> : r.durationMinutes}</TableCell>
              <TableCell align="center">{inlineId===r.id ? <TextField size="small" value={r.price||''} onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,price:e.target.value}:x))} /> : (r.price||'')}</TableCell>
              <TableCell align="center">{r.bokunProductId ? <Typography variant="caption" sx={{ color: '#2e7d32' }}>{r.bokunProductId}</Typography> : <Typography variant="caption" sx={{ color: '#999' }}>—</Typography>}</TableCell>
              <TableCell align="center">
                <Chip 
                  label={syncId === r.id ? 'Deploying...' : (r.status === 'Published' ? 'Deployed' : 'Undeployed')} 
                  size="small" 
                  sx={{ 
                    fontWeight: 400, 
                    fontSize: '0.65rem',
                    bgcolor: syncId === r.id ? 'rgba(74, 124, 140, 0.1)' : (r.status === 'Published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.05)'),
                    color: syncId === r.id ? '#4A7C8C' : (r.status === 'Published' ? '#059669' : '#64748B'),
                    border: syncId === r.id ? '1px solid #4A7C8C' : (r.status === 'Published' ? '1px solid #10b981' : '1px solid #E2E8F0'),
                    boxShadow: 'none'
                  }} 
                />
              </TableCell>
              <TableCell align="center">
                {inlineId===r.id ? (
                  <Button size="small" onClick={()=>setInlineId(null)}>Done</Button>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton onClick={() => { setInlineId(r.id); }} size="small" sx={{ color: '#4A7C8C' }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton onClick={() => confirmDelete(r.id)} size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => {
                      const copy = { ...r, id: `row_${Date.now()}` as string, title: r.title ? `${r.title} (Copy)` : 'Untitled (Copy)', bokunProductId: '' } as any;
                      setRows(rs => [copy, ...rs]);
                      onToast('Experience duplicated');
                    }} sx={{ color: '#4A7C8C', borderColor: 'rgba(74,124,140,0.5)' }}>Duplicate</Button>
                    <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', color: '#4A7C8C', borderColor: '#4A7C8C', whiteSpace: 'nowrap', fontWeight: 400 }} onClick={()=>onEditDetails && onEditDetails(r)}>Manage details</Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: 'Agrandir, serif', color: '#010057', fontWeight: 400 }}>
             {targetDeleteId ? 'Delete Experience?' : `Delete ${selectedIds.size} Experiences?`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Nunito, sans-serif', color: '#64748B' }}>
            This action cannot be undone (from the server). Are you sure you want to remove these items from your portfolio?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#64748B', fontFamily: 'Nunito, sans-serif' }}>Cancel</Button>
          <Button onClick={performDelete} variant="contained" color="error" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }}>
             Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

function PricingScheduleSkeleton({ onToast }: { onToast: (m: string) => void }) {
  const [pricingNotes, setPricingNotes] = React.useState('');
  const [scheduleNotes, setScheduleNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const appId = useSupplierAppIdInternal();

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
    setSaveSuccess({ section: sectionName, timestamp: new Date().toLocaleTimeString() });
    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const PremiumAlert = ({ children, icon, color = '#010057', sx }: { children: React.ReactNode, icon?: React.ReactNode, color?: string, sx?: any }) => (
    <Box sx={{ 
      p: 2.5, mb: 3, borderRadius: 3,
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(1, 0, 87, 0.08)',
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
      display: 'flex', gap: 2, alignItems: 'flex-start',
      ...sx
    }}>
      {icon && <Box sx={{ mt: 0.25, color }}>{icon}</Box>}
      <Typography variant="body2" sx={{ fontFamily: 'Nunito, sans-serif', color: '#334155', lineHeight: 1.6, fontWeight: 400 }}>
        {children}
      </Typography>
    </Box>
  );

  const SavedBadge = ({ active }: { active: boolean }) => (
    <Fade in={active}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#059669', opacity: active ? 1 : 0 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} />
        <Typography variant="caption" sx={{ fontWeight: 400, fontFamily: 'Nunito, sans-serif' }}>Saved</Typography>
      </Stack>
    </Fade>
  );

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
    photosDriveUrls?: string[];
    videoDriveUrl?: string;
    videoUrl?: string;
    status?: string;
  };
  const [experiences, setExperiences] = React.useState<Experience[]>([]);
  const handleMediaUpdate = React.useCallback((id: string, media: { photosDriveUrls: string[]; videoDriveUrl: string; videoUrl: string }) => {
    // We use functional updates to ensure stability
    setExperiences(prev => {
      const exp = prev.find(e => e.id === id);
      if (!exp) return prev;
      
      // Trust the incoming list from GridLikeMedia - it handles the merging/polling logic correctly.
      // Re-adding placeholders from 'prev' here was causing infinite sync loops.
      const finalPhotos = media.photosDriveUrls || [];
      
      const hasChanged = 
        exp.photosDriveUrls?.join(',') !== finalPhotos.join(',') ||
        exp.videoDriveUrl !== media.videoDriveUrl ||
        exp.videoUrl !== media.videoUrl;
        
      if (!hasChanged) return prev;
      return prev.map(e => e.id === id ? { ...e, ...media, photosDriveUrls: finalPhotos } : e);
    });
    
    setDetails(prev => {
      // Trust what GridLikeMedia says.
      const finalPhotos = media.photosDriveUrls || [];
      
      const hasChanged = 
        prev.photosDriveUrls?.join(',') !== finalPhotos.join(',') ||
        prev.videoDriveUrl !== media.videoDriveUrl ||
        prev.videoUrl !== media.videoUrl;

      if (!hasChanged) return prev;
      return { ...prev, ...media, photosDriveUrls: finalPhotos };
    });
  }, []);
  const [details, setDetails] = React.useState<Partial<Experience>>({});
  const [validating, setValidating] = React.useState(false);
  const [validationIssues, setValidationIssues] = React.useState<string[] | null>(null);
  const [isVerified, setIsVerified] = React.useState(false);
  const [validationMap, setValidationMap] = React.useState<Record<string, number>>({});
  const defaultTimeZone = 'Asia/Tokyo';
const defaultCurrency = 'USD';

// Standardized button style matching OnboardingForm "Save Profile"
const PRIMARY_BUTTON_SX = {
  px: 3, py: 0.8, borderRadius: 1,
  bgcolor: '#010057', color: '#fff',
  fontWeight: 400, fontFamily: 'Nunito, sans-serif',
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
  const [syncing, setSyncing] = React.useState(false);
  
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

  // Auto-scan for distribution readiness when Finalize tab is opened
  React.useEffect(() => {
    if (section === 'experiences' && subsection === 'validation' && selectedExperienceId && validationIssues === null && !validating) {
      runValidation();
    }
  }, [section, subsection, selectedExperienceId, validationIssues, validating]);

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
          fetch(`${N8N_BASE}/supplier/company/billing/get?applicationId=${encodeURIComponent(appId)}`, { headers, cache: 'no-store' }),
          fetch(`${N8N_BASE}/supplier/company/legal/get?applicationId=${encodeURIComponent(appId)}`, { headers, cache: 'no-store' }),
          fetch(`${N8N_BASE}/supplier/company/locations/get?applicationId=${encodeURIComponent(appId)}`, { headers, cache: 'no-store' })
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
        // Prevent overwriting form data if we are just dealing with an ID update/sync for the SAME experience
        // We assume 'details.id' is kept in sync via saveAllExperiences when IDs change.
        if (details?.id === current.id) return;

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
  // Persist experiences to localStorage to prevent data loss on reload -- DISABLED to rely on remote
  // React.useEffect(() => {
  //   if (appId && experiences.length > 0) {
  //     try { localStorage.setItem(`supplier_experiences_${appId}`, JSON.stringify(experiences)); } catch {}
  //   }
  // }, [experiences, appId]);

  // Sync experiences -> activitiesSimple
  React.useEffect(() => {
    setActivitiesSimple(experiences.map(e => ({ id: e.id, title: e.title || '(Untitled)' })));
  }, [experiences]);

  React.useEffect(() => {
    setValidationIssues(null);
    setIsVerified(false);
  }, [selectedExperienceId]);

  // Load activities from Remote (API) and merge with Local
  React.useEffect(() => {
    const loadRemote = async () => {
      if (!appId) return;
      try {
        const timestamp = new Date().getTime();
        // FORCE CACHE BUSTING: Add timestamp and headers to prevent stale reads
        const token = AuthService.getToken();
        const headers: any = { 
            'Cache-Control': 'no-cache, no-store, must-revalidate', 
            'Pragma': 'no-cache', 
            'Expires': '0'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}&_t=${timestamp}`, {
            method: 'GET',
            cache: 'no-store',
            headers
        });
        const json = await parseJsonSafe(res);
        console.log('[Supplier] LoadRemote Response:', json);
        if (json?.activities) {
          const count = json.activities.length;
          setToast(count > 0 ? `Loaded ${count} experiences` : 'No experiences found');
          
          const remoteRows = json.activities.map((a: any) => ({
            id: a.id || `row_${Math.random().toString(36).substr(2, 9)}`,
            // Extract Build ID if present for debugging
            _build: a.Build,
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
            insurance: a.insurance,
            itinerary: a.itinerary,
            meetingPoint: a.meetingPoint,
            photosDriveUrls: Array.isArray(a.photosDriveUrls) ? a.photosDriveUrls : (typeof a.photosDriveUrls === 'string' ? a.photosDriveUrls.split(',').map((s:string)=>s.trim()).filter(Boolean) : []),
            videoDriveUrl: a.videoDriveUrl || '',
            videoUrl: a.videoUrl || ''
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
      } catch (e: any) {
        console.error('[Supplier] LoadRemote Error:', e);
        setToast('Failed to load experiences: ' + (e?.message || 'Unknown'));
      }
    };
    loadRemote();
  }, [appId]);

  const saveAllExperiences = async (nextExperiences: Experience[]) => {
    if (!appId) return;
    const payload = { applicationId: appId, activities: nextExperiences };
    const headers: any = { 'Content-Type': 'application/json' };
    const authToken = AuthService.getToken();
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${N8N_BASE}/supplier/activities/save`, {
      method: 'POST', headers, body: JSON.stringify(payload)
    });
    const json = await parseJsonSafe(res);
    if (!json) {
       // Tolerate empty body if status is 200
       if (res.ok) return; 
       console.error('[Supplier] Save Error: Empty Response', res.status);
       setToast(`Save failed: Server Error ${res.status}`);
       throw new Error('Save failed (Empty response)');
    }
    if (!json?.success) {
        console.error('[Supplier] Save Logic Error:', json);
        setToast(`Save rejected: ${json?.error || 'Unknown Error'}`);
        throw new Error(json?.error || 'Save failed');
    }

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

  const onSaveDetails = async (overrides?: Partial<Experience>) => {
    if (!selectedExperienceId) { setToast('Select an Experience'); return; }
    const target = experiences.find(e => e.id === selectedExperienceId);
    if (!target) { setToast('Sync Error: Experience not found. Please refresh page.'); return; }

    try {
      // Merge: Target + Current Details + Explicit Overrides. Force valid ID.
      const merged = { ...target, ...details, ...overrides, id: selectedExperienceId, applicationId: appId };

      // Update local details state if overrides exist
      if (overrides) {
          setDetails(prev => ({ ...prev, ...overrides }));
      }

      const next = experiences.map(e => e.id === selectedExperienceId ? merged as Experience : e);
      setExperiences(next);
      await saveAllExperiences(next);
      
      // Removed forced navigation to allow continued editing
      handleSaveSuccess('Experience');
    } catch (e: any) { setToast(e?.message || 'Save failed'); }
  };

  // Autosave on idle for Details / Availability / Policies / Pricing / Media
  React.useEffect(() => {
    const eligible = section === 'experiences' && (
        subsection === 'details' || 
        subsection === 'availability' || 
        subsection === 'policies' || 
        subsection === 'pricing' || 
        subsection === 'media'
    );
    if (!eligible || !selectedExperienceId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const current = experiences.find(e => e.id === selectedExperienceId);
        if (!current) return;
        // CRITICAL FIX: Force ID to match current (authoritative) to prevent stale details.id (row_...) from reverting UUIDs
        let merged: any = { ...current, ...details, id: current.id };
        if (subsection === 'pricing') {
          const catsCsv = pricingRows.map(r=>r.category).filter(Boolean).join(', ');
          const base = pricingRows[0]?.amount || merged.baseRate || '';
          const curr = pricingRows[0]?.currency || merged.currency || defaultCurrency || '';
          merged.pricingCategories = catsCsv;
          merged.baseRate = base;
          merged.currency = curr;
        }
        // Detect changes on key fields to avoid unnecessary saves
        const keys = [
          'title','summary','city','durationMinutes','category','maxParticipants','minParticipants',
          'schedulingMode','startTimes','cutoffHours','bookingLeadTime','cancellationPolicy',
          'timeZone','latitude','longitude','pricingCategories','baseRate','currency',
          // Media fields
          'photosDriveUrls', 'videoDriveUrl', 'videoUrl',
          // Narrative and logistics
          'itinerary', 'meetingPoint', 'safetyMeasures', 'requirements', 'included', 'notIncluded', 'insurance',
          // Vibe fields
          'authenticEchoes', 'unforgettableFeeling', 'magicMoment', 'hiddenGem', 
          'communityConnection', 'perfectMatch', 'threeWords'
        ];
        // Special comparison for arrays (photosDriveUrls)
        const hasChange = keys.some((k) => {
            const v1 = (current as any)[k];
            const v2 = merged[k];
            if (Array.isArray(v1) || Array.isArray(v2)) {
                return JSON.stringify(v1 || []) !== JSON.stringify(v2 || []);
            }
            return String(v1||'') !== String(v2||'');
        });
        if (!hasChange) return;
        setAutoSaving(true);
        const next = experiences.map(e => e.id === selectedExperienceId ? merged as Experience : e);
        setExperiences(next);
        await saveAllExperiences(next);
      } catch (e: any) { 
        console.error('Autosave Error:', e);
        setToast('Autosave failed: ' + (e.message || 'Unknown'));
      }
      finally { setAutoSaving(false); }
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, pricingRows, subsection, selectedExperienceId, experiences]);

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
    const e = experiences.find(ex => ex.id === selectedExperienceId);
    const errs: string[] = [];
    if (!e) return ['Internal error: No experience selected'];
    if (!e.title?.trim()) errs.push('T1: Missing public title');
    if (!e.summary?.trim()) errs.push('T1: No experience summary provided');
    if (!e.durationMinutes) errs.push('T1: Estimated duration is required');
    if (!e.city?.trim()) errs.push('T1: Destination city missing');
    if (!e.category?.trim()) errs.push('T1: Experience category needed');
    if (!e.photosDriveUrls || e.photosDriveUrls.length === 0) errs.push('T1: Minimum 1 photo required for distribution');
    if (!e.price) errs.push('T2: Base pricing should be defined');
    if (!e.itinerary?.trim()) errs.push('T2: Detailed itinerary recommended');
    return errs;
  };

  const runValidation = async () => {
    if (!selectedExperienceId) return;
    setValidating(true);
      try {
      const issues = await validateSelected();
      setValidationIssues(issues);
      const ok = issues.length === 0;
      setIsVerified(ok);
      
      // Auto-trigger push if verified
      if (ok && !syncing) {
        setSyncing(true);
        try {
          await fetch(`${N8N_BASE}/supplier/sync/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: appId, experienceId: selectedExperienceId })
          });
          setExperiences(prev => prev.map(e => e.id === selectedExperienceId ? { ...e, status: 'Published' } : e));
          setToast('Experience Synchronized with Network');
        } catch (e: any) {
          console.error("Auto-sync failed", e);
        } finally {
          setSyncing(false);
        }
      }
      
      setToast(issues.length ? 'Validation issues found' : 'Ready for deployment!');
    } finally {
      setValidating(false);
    }  };

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
        }
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
      const next = experiences.map(e => e.id === a.id ? { ...e, bokunProductId: bokunId, status: 'Published' as const } : e);
      const nextWithMeta = next.map(e => e.id === a.id ? { ...e, lastSyncedAt: new Date().toISOString() } : e);
      setExperiences(nextWithMeta);
      try { await saveAllExperiences(nextWithMeta); } catch {}
      setToast(`Synced to Bókun${bokunId ? ` (${bokunId})` : ''}`);
    } catch (e: any) { setToast(e?.message || 'Sync failed'); }
  };

  const getSectionChecks = () => {
    const a = experiences.find(e => e.id === selectedExperienceId);
    const checks: Record<string, { ok: boolean; count?: number }> = {
      details: { ok: !!(a?.title && a?.summary && a?.city && a?.durationMinutes && a?.category) },
      media: { ok: (a?.photosDriveUrls?.length || 0) > 0 },
      pricing: { ok: !!(a?.currency && ((a?.pricingCategories && a.pricingCategories.trim()) && ((a?.baseRate && String(a.baseRate).trim()) || (a?.price && String(a.price).trim())))) },
      availability: { ok: !!(a?.schedulingMode && a?.startTimes && (a?.cutoffHours || a?.bookingLeadTime) && a?.maxParticipants) },
      validation: { ok: (validationMap[selectedExperienceId] ?? 0) === 0, count: validationMap[selectedExperienceId] ?? 0 },
      sync: { ok: !!a?.bokunProductId }
    };
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
          <Typography variant="overline" sx={{ color: '#ffbf00', fontWeight: 400, letterSpacing: 3, mb: 2, display: 'block' }}>
            {authTab === 'login' ? 'PARTNER PORTAL' : 'PARTNERSHIP APPROVED'}
          </Typography>
          
          <Typography variant="h3" sx={{ 
            color: '#010057', 
            fontFamily: 'Agrandir, serif', 
            fontWeight: 400, 
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
                  <Typography variant="caption" sx={{ color: '#ffbf00', fontWeight: 400, letterSpacing: 1, display: 'block' }}>STEP {item.step}</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#010057', fontWeight: 400, lineHeight: 1.2 }}>{item.title}</Typography>
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
                fontWeight: 400,
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
                  fontWeight: 400, 
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
              Build: 2026.01.16.2505_FIX_V34
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
        minHeight: '100vh', // Ensure full viewport background
        height: '100vh',
        py: 4, // Reduce padding to fit content better
        px: 2,
        overflow: 'hidden', // Prevent body scroll
        bgcolor: 'rgba(255, 255, 255, 0.25)',
        backgroundImage: bg?.url ? `url("${bg.url}")` : 'radial-gradient(circle at 20% 10%, rgba(1, 0, 87, 0.05), transparent 45%), radial-gradient(circle at 80% 20%, rgba(255, 191, 0, 0.08), transparent 40%)',
        backgroundSize: bg?.url ? 'cover' : undefined,
        backgroundPosition: bg?.url ? 'center' : undefined,
        backgroundAttachment: bg?.url ? 'fixed' : undefined,
        backgroundRepeat: 'no-repeat'
      }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '250px 1fr' }, gap: 3, maxWidth: 1400, mx: 'auto', height: '100%' }}>
        {/* Sidebar */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2, 
          height: '100%', // Fill grid height completely
          display: 'flex',
          flexDirection: 'column', 
          width: '100%', 
          transition: 'all .3s ease',
          bgcolor: isTransparent ? 'rgba(255,255,255,0.6)' : '#fff',
          backdropFilter: isTransparent ? 'blur(12px)' : 'none',
          color: '#0F172A',
          border: '1px solid rgba(255,255,255,0.4)',
          overflowY: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
              alt="ExperiaHub Logo"
              style={{ height: 'auto', width: '100%', maxWidth: '200px' }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', textAlign: 'center', mb: 2, lineHeight: 1.1 }}>
            Supplier Portal
          </Typography>


          
          <List>
            <ListItemButton selected={section==='welcome'} onClick={() => { setSection('welcome'); setTab(0); setSubsection('resources'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='welcome'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Welcome" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
            <ListItemButton selected={section==='company'} onClick={() => { setSection('company'); setTab(0); setSubsection('profile'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='company'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Company" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
            <ListItemButton selected={section==='user'} onClick={() => { setSection('user'); setTab(0); setSubsection('user_profile'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='user'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="User" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
            <ListItemButton selected={section==='experiences'} onClick={() => { setSection('experiences'); setTab(0); setSubsection('overview'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='experiences'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Experiences" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
            <ListItemButton selected={section==='bookings'} onClick={() => { setSection('bookings'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='bookings'?{ bgcolor: isTransparent ? 'rgba(1,0,87,0.1)' : '#F0F4F6' }:{}) }}>
              <ListItemText primary="Bookings" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
            <ListItemButton selected={section==='information'} onClick={() => { setSection('information'); setTab(0); setSubsection('resources'); }} sx={{ borderRadius: 1.5, mb: 0.5, ...(section==='information'?{ bgcolor: isTransparent ? 'rgba(74,124,140,0.15)' : '#EAF4F6' }:{}) }}>
              <ListItemText primary="Information & Resources" primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} />
            </ListItemButton>
          </List>




          
            
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Stack spacing={1} sx={{ mb: 2, px: 2, textAlign: 'center', bgcolor: 'rgba(1,0,87,0.03)', borderRadius: 2, py: 2, border: '1px solid rgba(1,0,87,0.05)' }}>
              <Box sx={{ py: 0 }}>
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', lineHeight: 1.2, mb: 0.5 }}>
                  {user?.display_name || userDisplayName || statusData?.businessName || companyBilling.companyName || 'ExperiaHub Partner'}
                </Typography>
                {appId && (
                  <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>
                    ID: {appId}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Divider sx={{ mb: 2, borderColor: 'rgba(1,0,87,0.1)' }} />
            <FormControlLabel
               control={<Switch size="small" checked={isTransparent} onChange={(e)=>setIsTransparent(e.target.checked)} />}
               label={<Typography variant="caption" sx={{ fontFamily:'Nunito, sans-serif' }}>Translucent UI</Typography>}
               sx={{ mb: 1, ml: 0.5 }}
            />
             <Typography variant="caption" sx={{ display:'block', textAlign:'center', mt:0, color:'#94a3b8', fontSize:'0.7rem', fontFamily:'monospace' }}>v155</Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(1,0,87,0.1)' }} />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" fullWidth onClick={() => window.location.reload()} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#64748B', fontWeight: 400, bgcolor: isTransparent?'rgba(255,255,255,0.5)':'#fff', '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC', color: '#334155' } }}>Refresh</Button>
              {isLoggedIn ? (
                <Button variant="outlined" size="small" fullWidth onClick={() => { logout?.(); setHasBegun(false); }} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#64748B', fontWeight: 400, bgcolor: isTransparent?'rgba(255,255,255,0.5)':'#fff', '&:hover': { borderColor: '#FECACA', bgcolor: '#FEF2F2', color: '#DC2626' } }}>Log out</Button>
              ) : (
                <Button variant="contained" size="small" fullWidth sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', fontWeight: 400 }} onClick={() => { setHasBegun(false); }}>Sign in</Button>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* Main content */}
        <Paper sx={{
          p: 3,
          borderRadius: 2,
          height: '100%', // Match sidebar height
          overflowY: 'auto', // Enable scroll within the card
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
                  sx={{ bgcolor: 'rgba(197, 160, 89, 0.1)', color: '#ffbf00', fontWeight: 400, cursor: 'pointer', border: '1px solid rgba(197, 160, 89, 0.3)' }}
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
              sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 400, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
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
              sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 400, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
            >
              <Tab label="Profile" value="user_profile" />
              <Tab label="Security" value="user_security" />
              <Tab label="API Tokens" value="user_tokens" />
            </Tabs>
          </Box>
        )}

        {section === 'experiences' && (
          <Box sx={{ mb: 3 }}>

            {selectedExperienceId && subsection !== 'overview' && (() => {
               const c = getSectionChecks();
               return (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  {/* Tabs - Only show if NOT in overview */}
                  <Tabs 
                    value={subsection} 
                    onChange={(_, v) => setSubsection(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ '& .MuiTab-root': { fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 400, fontSize: '0.95rem' }, '& .Mui-selected': { color: '#010057' }, '& .MuiTabs-indicator': { bgcolor: '#010057' } }}
                  >
                    <Tab label="Overview" value="overview" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Details {c.details.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="details" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Media {mediaOk ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="media" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Pricing {c.pricing.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="pricing" />
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Availability {c.availability.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : null}</Box>} value="availability" />
                    <Tab label="Policies" value="policies" />
                    {/* <Tab label="Distribution" value="distribution" /> */}
                    <Tab label={<Box sx={{display:'flex', gap:0.5, alignItems:'center'}}>Finalize {c.validation.ok ? <CheckCircleOutlineIcon fontSize="inherit" color="success" /> : (c.validation.count ? <Typography variant="caption" sx={{color:'warning.main', fontWeight:400}}>{c.validation.count}</Typography> : null)}</Box>} value="validation" />
                  </Tabs>
                </Box>
               );
            })()}
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
                <Typography variant="h4" sx={{ mb: 1, color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 400, textAlign: 'center' }}>Welcome to the Supplier Portal</Typography>
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
                  <Button size="small" startIcon={<ApartmentIcon />} variant="contained" sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 400 }} onClick={() => { setSection('company'); setSubsection('profile'); }}>Start Company</Button>
                  <Button size="small" startIcon={<PersonOutlineIcon />} variant="outlined" sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 400 }} onClick={() => { setSection('user'); setSubsection('user_profile'); }}>Start User</Button>
                  <Button size="small" startIcon={<CollectionsIcon />} variant="outlined" sx={{ color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, fontWeight: 400 }} onClick={() => { setSection('experiences'); setSubsection('overview'); }}>Start Experiences</Button>
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
              <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>{subsectionLabel}</Typography>
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
                      <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontWeight: 400 }} onClick={()=>setSubsection('payouts_connect')}>
                        {payoutStatus==='pending' ? 'Resume onboarding' : 'Start onboarding'}
                      </Button>
                      {stripeDashboardUrl && (
                        <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', fontWeight: 400 }} component="a" href={stripeDashboardUrl} target="_blank" rel="noreferrer">Open Stripe Dashboard</Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {subsection === 'payouts_connect' && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Stack spacing={2}>
                    <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 2, letterSpacing: '0.01em' }}>Payouts & Onboarding</Typography>
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
                          const token = AuthService.getToken();
                          const res = await fetch(`${N8N_BASE}/supplier/payouts/stripe/connect_link`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>Billing</Typography>
                {/* Alert removed per user request */}
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
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                  <SavedBadge active={saveSuccess?.section === 'Billing'} />
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const token = AuthService.getToken();
                    const res = await fetch(`${N8N_BASE}/supplier/company/billing/save`, {
                      method: 'POST', 
                      headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>Legal Entity</Typography>
                {/* Alert removed per user request */}
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
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                  <SavedBadge active={saveSuccess?.section === 'Legal'} />
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    const token = AuthService.getToken();
                    const res = await fetch(`${N8N_BASE}/supplier/company/legal/save`, {
                      method: 'POST', 
                      headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>Locations</Typography>
                {/* Alert removed per user request */}
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
                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                  <SavedBadge active={saveSuccess?.section === 'Locations'} />
                  <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)', textTransform: 'none', fontWeight: 400 }} startIcon={<AddIcon />} onClick={()=>setCompanyLocations(arr=>[...arr, { name:'', address:'', city:'', country:'', timeZone: defaultTimeZone || 'UTC' }])}>Add Location</Button>
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                    try {
                      if (!appId) { setToast('Missing application ID'); return; }
                      const token = AuthService.getToken();
                      const res = await fetch(`${N8N_BASE}/supplier/company/locations/save`, {
                        method: 'POST', 
                        headers: { 
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>Profile</Typography>
                {/* Alert removed per user request */}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Update your personal contact information.</Typography>
                <TextField label="Display Name" value={userDisplayName} onChange={(e)=>setUserDisplayName(e.target.value)} fullWidth required error={!userDisplayName.trim()} helperText={!userDisplayName.trim() ? 'Required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <TextField label="Phone" value={userPhone} onChange={(e)=>setUserPhone(e.target.value)} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                  <SavedBadge active={saveSuccess?.section === 'Profile'} />
                  <Button variant="contained" size="small" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                  try {
                    if (!appId) { setToast('Missing application ID'); return; }
                    if (!userDisplayName.trim()) { setToast('Please enter a display name'); return; }
                    const token = AuthService.getToken();
                    const res = await fetch(`${N8N_BASE}/supplier/user/profile/save`, {
                      method: 'POST', 
                      headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>Security</Typography>
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
                      const token = AuthService.getToken();
                      const res = await fetch(`${N8N_BASE}/supplier/user/security/save`, {
                        method: 'POST', 
                        headers: { 
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
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
                <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 1, letterSpacing: '0.01em' }}>API Tokens</Typography>
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
                      <Button size="small" color="error" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 400 }} disabled={tokenMutating} onClick={()=>deleteToken(t.uuid)}>Remove</Button>
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
              <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Experience Overview</Typography>

              {/* Graphic Steps */}
              <Box sx={{ mb: 4, p: 2, bgcolor: isTransparent ? 'rgba(255,255,255,0.4)' : '#F8FAFC', borderRadius: 2 }}>
                <Stepper activeStep={-1} alternativeLabel connector={null}>
                  {['Add Experience', 'Add Details', 'Add Photos', 'Set Pricing', 'Publish'].map((label, index) => (
                      <Step key={label}>
                        <StepLabel 
                          StepIconComponent={() => (
                            <Box sx={{ 
                              width: 24, height: 24, borderRadius: '50%', 
                              bgcolor: '#C5A059', color: '#fff', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              fontWeight: 400, fontSize: '0.75rem' 
                            }}>
                              {index + 1}
                            </Box>
                          )}
                        >
                          <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#010057', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5, lineHeight: 1.2, minHeight: '3em', textAlign: 'center' }}>{label}</Typography>
                        </StepLabel>
                      </Step>
                  ))}
                </Stepper>
              </Box>

            <ActivitiesSkeleton 
              experiences={experiences} 
              onUpdate={setExperiences} 
              onSave={saveAllExperiences}
              onToast={(m)=>setToast(m)}
              appId={appId} 
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
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />
            <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Photos & Video</Typography>
            {(() => {
              const exp = experiences.find(e => e.id === selectedExperienceId);
              return (
                <GridLikeMedia 
                  onToast={(m)=>setToast(m)} 
                  defaultActivityId={selectedExperienceId} 
                  appId={appId} 
                  defaultPhotos={exp?.photosDriveUrls?.join(', ') || ''}
                  defaultVideoDrive={exp?.videoDriveUrl || ''}
                  defaultVideoExternal={exp?.videoUrl || ''}
                  onUpdate={handleMediaUpdate} 
                />
              );
            })()}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'pricing' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />
            <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Pricing & Rates</Typography>
            
            <Box sx={{ p: 0 }}>
            <TableContainer sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', bgcolor: isTransparent ? 'rgba(255,255,255,0.7)' : '#fff', backdropFilter: isTransparent ? 'blur(20px)' : 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#64748B', fontWeight: 400, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pricing Category</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 400, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 400, fontSize: '0.75rem', textTransform: 'uppercase' }}>Currency</TableCell>
                    <TableCell align="right" sx={{ color: '#64748B', fontWeight: 400, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricingRows.map((r, idx) => (
                    <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F1F5F9' } }}>
                      <TableCell><TextField placeholder="e.g. Adult" fullWidth size="small" variant="standard" InputProps={{ disableUnderline: true, style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', color: '#1E293B' } }} value={r.category} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, category:e.target.value}:x))} /></TableCell>
                      <TableCell><TextField type="number" fullWidth size="small" variant="standard" inputProps={{ min: 0, step: '0.01' }} InputProps={{ disableUnderline: true, style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', fontWeight: 400, color: '#1E293B' } }} value={r.amount} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, amount:e.target.value}:x))} /></TableCell>
                      <TableCell><TextField fullWidth size="small" variant="standard" InputProps={{ disableUnderline: true, style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem', color: '#64748B' } }} value={r.currency} onChange={(e)=>setPricingRows(rows=>rows.map((x,i)=>i===idx?{...x, currency:e.target.value}:x))} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={()=>setPricingRows(rows=>rows.filter((_,i)=>i!==idx))}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pricingRows.length === 0 && (
                    <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>No pricing rows yet. Add your first rate below.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }} alignItems="center">
              <SavedBadge active={saveSuccess?.section === 'Experience'} />
              <Button size="small" variant="outlined" sx={{ border: '1px solid #E2E8F0', borderRadius: 2, color: '#64748B', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' } }} startIcon={<AddIcon />} onClick={()=>setPricingRows(rows=>[...rows, { category:'', amount:'', currency: details.currency || defaultCurrency || 'JPY' }])}>Add Row</Button>
              <Button variant="contained" size="small" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={async ()=>{
                const currencies = new Set(pricingRows.map(r=>r.currency).filter(Boolean));
                if (currencies.size > 1) { setToast('Use a single currency across pricing rows'); return; }
                const catsCsv = pricingRows.map(r=>r.category).filter(Boolean).join(', ');
                const base = pricingRows[0]?.amount || details.baseRate || '';
                const curr = pricingRows[0]?.currency || details.currency || defaultCurrency || '';
                await onSaveDetails({ pricingCategories: catsCsv, baseRate: base, currency: curr });
              }}>Save Pricing</Button>
            </Stack>
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'bookings' && (
          <Fade in timeout={250}>
             <Box>
                <BookingsView />
             </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'details' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />
            <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Product Details</Typography>
            {/* Alert removed per user request */}
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
                          {SUGGESTED_CATEGORIES.map((name)=> (<MenuItem key={name} value={name}>{name}</MenuItem>))}
                        </Select>
                      </FormControl>
                      <TextField label="Max participants" type="number" inputProps={{ min: 1, step: 1, style: { fontFamily: 'Nunito, sans-serif' } }} value={details.maxParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, maxParticipants: e.target.value }))} fullWidth error={showFieldErrors && !String(details.maxParticipants||'').trim()} helperText={showFieldErrors && !String(details.maxParticipants||'').trim() ? 'Capacity is required' : ''} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
                      <TextField label="Min participants" type="number" inputProps={{ min: 1, step: 1, style: { fontFamily: 'Nunito, sans-serif' } }} value={details.minParticipants || ''} onChange={(e)=>setDetails(d=>({ ...d, minParticipants: e.target.value }))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} />
                    </Stack>
                  );
                })()}
                
                {/* Story & Vibe Section */}
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', mt: 2, mb: 1 }}>The Story & Vibe</Typography>
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
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', mt: 2, mb: 1 }}>Inclusions & Requirements</Typography>
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
                <Typography variant="subtitle1" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', mt: 2, mb: 1 }}>Safety & Insurance</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Safety Measures" value={details.safetyMeasures || ''} onChange={(e)=>setDetails(d=>({ ...d, safetyMeasures: e.target.value }))} fullWidth multiline minRows={2} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                  <TextField label="Insurance Information" value={details.insurance || ''} onChange={(e)=>setDetails(d=>({ ...d, insurance: e.target.value }))} fullWidth multiline minRows={2} InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  </Grid>
                </Grid>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }} alignItems="center" spacing={2}>
                  <SavedBadge active={saveSuccess?.section === 'Experience'} />
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={()=>onSaveDetails()}>Save Details</Button>
                </Stack>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'availability' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />
            <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Availability & Schedule</Typography>
            {/* Alert removed per user request */}
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
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                  <SavedBadge active={saveSuccess?.section === 'Experience'} />
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={()=>onSaveDetails()}>Save Availability</Button>
                </Stack>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'policies' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />
            <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Policies & Requirements</Typography>
            {/* Alert removed per user request */}
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to edit policies.</Alert>)}
            {selectedExperienceId && (
              <>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
                  <TextField label="Cancellation policy" value={details.cancellationPolicy || ''} onChange={(e)=>setDetails(d=>({ ...d, cancellationPolicy: e.target.value }))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                  <TextField label="Minimum age (optional)" value={(details as any).minAge || ''} onChange={(e)=>setDetails(d=>({ ...d, minAge: e.target.value } as any))} fullWidth InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }} />
                </Stack>
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                  <SavedBadge active={saveSuccess?.section === 'Experience'} />
                  <Button size="small" variant="contained" sx={PRIMARY_BUTTON_SX} startIcon={<SaveIcon />} onClick={()=>onSaveDetails()}>Save Policies</Button>
                </Stack>
              </>
            )}
          </Stack>
          </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'distribution' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4, lineHeight: 1.6 }}>
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', mb: 0, letterSpacing: '0.01em' }}>Distribution & Publishing</Typography>
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
                        const rawObj = a; // The original activity object
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
                      <Button size="small" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 1, color: '#010057', borderColor: 'rgba(1,0,87,0.5)' }} onClick={() => {
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
            <Box sx={{ p: 4, lineHeight: 1.6 }}>
              <Stack spacing={4}>
                {selectedExperienceId && <ContextHeader title={experiences.find(e => e.id === selectedExperienceId)?.title || 'Selected Experience'} />}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h5" sx={{ mb: 0, fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#4A7C8C', letterSpacing: '0.01em' }}>Network Finalization</Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'Nunito, sans-serif', opacity: 0.8 }}>Structural integrity audit and network deployment status.</Typography>
                  </Box>
                  {isVerified && (
                     <Chip 
                        icon={<VerifiedIcon sx={{ fontSize: '1.2rem !important', color: '#059669 !important' }} />}
                        label="NETWORK READY" 
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#065F46', fontWeight: 400, border: '1px solid #10b981' }} 
                     />
                  )}
                </Box>

                {!selectedExperienceId ? (
                  <Box sx={{ p: 10, textAlign: 'center' }}>
                    <VerifiedUserIcon sx={{ fontSize: 64, color: 'rgba(1,0,87,0.1)', mb: 2 }} />
                    <Typography sx={{ color: '#010057', fontWeight: 400 }}>Choose an Experience to Begin</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Grid container spacing={6} sx={{ mt: 2 }}>

                      <Grid item xs={12} md={5}>
                        <Stack spacing={4}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 400, color: '#010057', mb: 2 }}>NETWORK STATUS</Typography>
                             <Box sx={{ p: 3, borderRadius: 2, bgcolor: isVerified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${isVerified ? '#10b981' : '#EF4444'}`, textAlign: 'center' }}>
                               {isVerified ? (
                                 <>
                                   <VerifiedIcon sx={{ color: '#059669', fontSize: 48, mb: 1.5 }} />
                                   <Typography variant="h6" sx={{ color: '#065F46', fontWeight: 400, mb: 0.5 }}>SYNCHRONIZED</Typography>
                                   <Typography variant="caption" sx={{ color: '#065F46', opacity: 0.7, display: 'block' }}>This unit is live and distributing to the global network.</Typography>
                                 </>
                               ) : (
                                 <>
                                   <SyncIcon sx={{ color: '#EF4444', fontSize: 48, mb: 1.5 }} />
                                   <Typography variant="h6" sx={{ color: '#991B1B', fontWeight: 400, mb: 0.5 }}>WAITING FOR FIXES</Typography>
                                   <Typography variant="caption" sx={{ color: '#991B1B', opacity: 0.7, display: 'block' }}>See audit findings to the right to enable network distribution.</Typography>
                                 </>
                               )}
                             </Box>
                             <Typography variant="caption" sx={{ mt: 3, display: 'block', color: '#64748B', lineHeight: 1.6, fontStyle: 'italic' }}>
                               The Network Finalization is an automated gateway. Once all structural blocks are cleared, your experience is immediately flagged for the global distribution queue.
                             </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={7}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 400, color: '#010057', mb: 3 }}>AUDIT FINDINGS</Typography>
                          {validating ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                              <CircularProgress sx={{ color: '#010057', mb: 2, opacity: 0.3 }} />
                              <Typography sx={{ color: '#64748B', fontWeight: 400 }}>Scanning metadata...</Typography>
                            </Box>
                          ) : validationIssues?.length === 0 ? (
                            <Box sx={{ py: 4, px: 2, borderLeft: '4px solid #10b981', bgcolor: 'transparent' }}>
                               <Typography variant="h6" sx={{ color: '#065F46', fontWeight: 400, mb: 1 }}>Structural Integrity Verified</Typography>
                               <Typography variant="body2" sx={{ color: '#065F46', opacity: 0.8 }}>No blocks detected. This unit is optimized for travel distribution.</Typography>
                            </Box>
                          ) : (
                            <Stack spacing={1}>
                              {(validationIssues || []).map((iss, i) => (
                                <Box key={i} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(1,0,87,0.05)' }}>
                                  <Box sx={{ color: iss.startsWith('T1:') ? '#EF4444' : '#C5A059', display:'flex' }}>
                                    {iss.startsWith('T1:') ? <ClearIcon fontSize="small" /> : <SyncIcon fontSize="small" />}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 400, color: '#1E293B' }}>{iss.split(': ')[1]}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{iss.startsWith('T1:') ? 'Required for network connection' : 'Recommended for better conversion'}</Typography>
                                  </Box>
                                  <Chip label={iss.startsWith('T1:') ? 'BLOCK' : 'NOTE'} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 400, bgcolor: iss.startsWith('T1:') ? '#EF4444' : '#F1F5F9', color: iss.startsWith('T1:') ? '#fff' : '#64748B' }} />
                                </Box>
                              ))}
                              {!validationIssues && <Typography variant="caption" color="text.secondary">Waiting for audit to complete...</Typography>}
                            </Stack>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Stack>
            </Box>
          </Fade>
        )}

        {section === 'experiences' && subsection === 'sync' && (
          <Fade in timeout={250}>
          <Box sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', mb: 1 }}>Distribution & Publishing</Typography>
            {!selectedExperienceId && (<Alert severity="warning">Select an Experience to sync.</Alert>)}
            {selectedExperienceId && (
              <>
                <PremiumAlert icon={<PlayArrowIcon />} color="#C5A059">
                  <strong>Publishing:</strong> This action commits your data to the global registry and prepares it for distribution to channels like Bókun, Expedia, and TripAdvisor. Verify all details before going live.
                </PremiumAlert>
                <Stack direction="row" spacing={1} alignItems="center">
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
                {(() => {
                  const valCount = validationMap[selectedExperienceId] ?? 1;
                  const canPublish = valCount === 0;
                  return (
                    <>
                      <Button
                        variant="contained"
                        disabled={!canPublish}
                        sx={{ 
                          bgcolor: '#C5A059', 
                          fontFamily: 'Nunito, sans-serif', 
                          textTransform: 'none', 
                          borderRadius: 2, 
                          fontWeight: 400, 
                          color: '#fff', 
                          py: 1.5,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                          boxShadow: '0 4px 14px rgba(197, 160, 89, 0.39)',
                          '&:hover': { bgcolor: '#B08D45', boxShadow: '0 6px 20px rgba(197, 160, 89, 0.23)' },
                          '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' }
                        }}
                        onClick={syncSelected}
                      >
                        Publish Experience
                      </Button>
                      {!canPublish && (
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 400, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClearIcon sx={{ fontSize: '1rem' }} /> Verification Required: Run Validation and fix issues before publishing.
                        </Typography>
                      )}
                    </>
                  );
                })()}
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
                <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 400, color: '#010057', mb: 2 }}>Information & Resources</Typography>
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
                <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} sx={{ fontFamily: 'Nunito, sans-serif', borderColor: 'rgba(1,0,87,0.5)', color: '#010057', fontWeight: 400, borderRadius: 3 }} onClick={async ()=>{
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
              <Button size="small" color="error" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', fontWeight: 400, borderRadius: 3 }} onClick={async ()=>{
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
