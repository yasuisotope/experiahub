'use client';

import React from 'react';
import { Box, Grid, TextField, Button, Alert, CircularProgress, Paper, Divider, Chip, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { AuthService } from '@/services/authService';

const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_N8N_API_URL || process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
  if (envUrl.includes('/webhook')) return envUrl;
  return `${envUrl.replace(/\/$/, '')}/webhook`;
};
const N8N_BASE = getBaseUrl();

// Safely parse JSON; return null if body is empty or invalid JSON
async function parseJsonSafe(res: Response): Promise<any | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export type OnboardingFormState = {
  applicationId: string;
  originStory: string;
  fulfillment: string;
  authenticEchoes: string;
  unforgettableFeeling: string;
  magicMoment: string;
  hiddenGem: string;
  communityConnection: string;
  perfectMatch: string;
  availability: string;
  bookingAdvance: string;
  bookingSystem: string;
  bookingLink: string;
  cancellationPolicy: string;
  safetyMeasures: string;
  insurance: string;
  requirements: string;
  threeWords: string;
  moreAboutYou: string;
  legalBusinessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  primaryLocations: string;
  experienceNames: string;
  briefDescriptions: string;
  duration: string;
  maxParticipants: string;
  minParticipants: string;
  priceRange: string;
  included: string;
  notIncluded: string;
};

const defaultState: OnboardingFormState = {
  applicationId: '',
  originStory: '',
  fulfillment: '',
  authenticEchoes: '',
  unforgettableFeeling: '',
  magicMoment: '',
  hiddenGem: '',
  communityConnection: '',
  perfectMatch: '',
  availability: '',
  bookingAdvance: '',
  bookingSystem: '',
  bookingLink: '',
  cancellationPolicy: '',
  safetyMeasures: '',
  insurance: '',
  requirements: '',
  threeWords: '',
  moreAboutYou: '',
  legalBusinessName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  primaryLocations: '',
  experienceNames: '',
  briefDescriptions: '',
  duration: '',
  maxParticipants: '',
  minParticipants: '',
  priceRange: '',
  included: '',
  notIncluded: ''
};

export default function OnboardingForm({ applicationId }: { applicationId: string }) {
  const [state, setState] = React.useState<OnboardingFormState>({ ...defaultState, applicationId });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<string>('');
  const [statusInfo, setStatusInfo] = React.useState<{ exists?: boolean; status?: string | null; approved?: boolean } | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const requiredKeys: (keyof OnboardingFormState)[] = [
    'applicationId',
    'legalBusinessName',
    'contactName',
    'contactEmail',
    'contactPhone',
    'primaryLocations',
    'experienceNames',
    'briefDescriptions',
    'bookingSystem',
    'bookingLink',
    'cancellationPolicy'
  ];
  const completedCount = requiredKeys.reduce((acc, k) => acc + (String((state as any)[k] || '').trim() ? 1 : 0), 0);
  const completeness = Math.round((completedCount / requiredKeys.length) * 100);

  React.useEffect(() => {
    setState((s) => ({ ...s, applicationId }));
  }, [applicationId]);

  React.useEffect(() => {
    // Auto-save draft locally
    if (!state.applicationId) return;
    const key = `supplier_onboarding_${state.applicationId}`;
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [state]);

  React.useEffect(() => {
    // Validate basic fields
    const next: Record<string, string> = {};
    if (!state.applicationId?.trim()) next.applicationId = 'Portal ID is required';
    const email = state.contactEmail?.trim();
    if (email && !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) next.contactEmail = 'Invalid email format';
    const url = state.bookingLink?.trim();
    if (url) {
      try { const u = new URL(url); if (!['http:', 'https:'].includes(u.protocol)) throw new Error(); }
      catch { next.bookingLink = 'Invalid URL'; }
    }
    // Additional requireds
    if (!state.legalBusinessName?.trim()) next.legalBusinessName = 'Legal business name is required';
    if (!state.contactName?.trim()) next.contactName = 'Contact name is required';
    if (!state.contactPhone?.trim()) next.contactPhone = 'Contact phone is required';
    if (!state.primaryLocations?.trim()) next.primaryLocations = 'Please enter at least one primary location';
    if (!state.experienceNames?.trim()) next.experienceNames = 'Please enter at least one experience name';
    if (!state.briefDescriptions?.trim()) next.briefDescriptions = 'Please provide a brief description';
    if (!state.bookingSystem?.trim()) next.bookingSystem = 'Please specify your booking system';
    if (!state.bookingLink?.trim()) next.bookingLink = 'Portal booking link is required';
    if (!state.cancellationPolicy?.trim()) next.cancellationPolicy = 'Cancellation policy is required';
    setErrors(next);
  }, [state.applicationId, state.contactEmail, state.bookingLink, state.legalBusinessName, state.contactName, state.contactPhone, state.primaryLocations, state.experienceNames, state.briefDescriptions, state.bookingSystem, state.cancellationPolicy]);

  // Fetch status for header chip
  React.useEffect(() => {
    let abort = false;
    const fetchStatus = async () => {
      if (!state.applicationId) { setStatusInfo(null); return; }
      try {
        const res = await fetch(`${N8N_BASE}/supplier/onboarding/status?applicationId=${encodeURIComponent(state.applicationId)}`);
        const json = await parseJsonSafe(res);
        if (!abort) {
          if (json?.success) {
            setStatusInfo({ exists: json.exists, status: json.status ?? null, approved: !!json.approved });
            // Pre-fill fields from Supabase (matching n8n v3 fields)
            setState(prev => ({
              ...prev,
              contactEmail: prev.contactEmail || json.email || '',
              legalBusinessName: prev.legalBusinessName || json.businessName || '',
              contactName: prev.contactName || json.fullName || '',
              contactPhone: prev.contactPhone || json.phone || '',
              primaryLocations: prev.primaryLocations || (json.city && json.country ? `${json.city}, ${json.country}` : json.city || json.country || '')
            }));
          } else {
            setStatusInfo(null);
          }
        }
      } catch {
        if (!abort) setStatusInfo(null);
      }
    };
    fetchStatus();
    return () => { abort = true; };
  }, [state.applicationId]);

  const onChange = (key: keyof OnboardingFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setDirty(true);
    setState((s) => ({ ...s, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      if (!state.applicationId) throw new Error('Missing application ID');
      const token = AuthService.getToken();
      const res = await fetch(`${N8N_BASE}/supplier/onboarding/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ applicationId: state.applicationId, data: state })
      });
      const json = await parseJsonSafe(res);
      if (!res.ok || !json?.success) {
        throw new Error((json && (json.error || json.message)) || `Failed to save (HTTP ${res.status})`);
      }
      setSaved(true); setLastSavedAt(new Date().toLocaleString()); setDirty(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    try {
      const token = AuthService.getToken();
      const res = await fetch(`${N8N_BASE}/supplier/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ applicationId: state.applicationId })
      });
      const json = await parseJsonSafe(res);
      if (!res.ok || !json?.success) {
        throw new Error((json && (json.error || json.message)) || `Submit failed (HTTP ${res.status})`);
      }
      setStatusInfo((s) => ({ ...(s||{}), status: 'Submitted', approved: false }));
      alert('Submitted for review. We will notify you by email.');
    } catch (e: any) {
      setError(e.message || 'Submit failed');
    }
  };

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'transparent', position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#010057', fontFamily: 'Inter' }}>
          Status: <strong>{statusInfo?.approved ? 'Approved' : (statusInfo?.status || 'Pending')}</strong>{lastSavedAt ? ` · Last saved: ${lastSavedAt}` : ''}
        </Typography>
        <Chip size="small" label={`Completeness: ${completeness}% (${completedCount}/${requiredKeys.length})`} color={completeness===100?'success':'default'} variant={completeness===100?'filled':'outlined'} />
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Saved successfully{lastSavedAt ? ` at ${lastSavedAt}` : ''}.</Alert>}

      {/* Section: Company & Contact */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display', fontSize: '1.1rem' }}>Company & Contact</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Portal ID" value={state.applicationId} onChange={onChange('applicationId')} fullWidth disabled={!state.applicationId}
            error={!!errors.applicationId} helperText={errors.applicationId || ''} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Account Email" value={state.contactEmail} onChange={onChange('contactEmail')} fullWidth helperText="Used for login and communication" />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Legal Business Name" value={state.legalBusinessName} onChange={onChange('legalBusinessName')} fullWidth error={!!errors.legalBusinessName} helperText={errors.legalBusinessName || ''} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Contact Person Name" value={state.contactName} onChange={onChange('contactName')} fullWidth error={!!errors.contactName} helperText={errors.contactName || ''} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Support Email" value={state.contactEmail} onChange={onChange('contactEmail')} fullWidth error={!!errors.contactEmail} helperText={errors.contactEmail || ''} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Contact Phone" value={state.contactPhone} onChange={onChange('contactPhone')} fullWidth />
        </Grid>

        {/* Section: Locations & Experiences */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display', fontSize: '1.1rem' }}>Locations & Experiences</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Primary Locations (City, Country)" value={state.primaryLocations} onChange={onChange('primaryLocations')} fullWidth error={!!errors.primaryLocations} helperText={errors.primaryLocations || ''} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Experience Name(s)" value={state.experienceNames} onChange={onChange('experienceNames')} fullWidth error={!!errors.experienceNames} helperText={errors.experienceNames || ''} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Brief Description(s)" value={state.briefDescriptions} onChange={onChange('briefDescriptions')} fullWidth multiline minRows={3} error={!!errors.briefDescriptions} helperText={errors.briefDescriptions || ''} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Typical Duration" value={state.duration} onChange={onChange('duration')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField label="Max Participants" value={state.maxParticipants} onChange={onChange('maxParticipants')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField label="Min Participants" value={state.minParticipants} onChange={onChange('minParticipants')} fullWidth />
        </Grid>

        {/* Section: Product Details */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display', fontSize: '1.1rem' }}>Product Details</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Typical Price / Range" value={state.priceRange} onChange={onChange('priceRange')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Included in Price" value={state.included} onChange={onChange('included')} fullWidth multiline minRows={2} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="NOT Included" value={state.notIncluded} onChange={onChange('notIncluded')} fullWidth multiline minRows={2} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Availability" value={state.availability} onChange={onChange('availability')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Booking Lead Time" value={state.bookingAdvance} onChange={onChange('bookingAdvance')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Booking System" value={state.bookingSystem} onChange={onChange('bookingSystem')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Booking Link" value={state.bookingLink} onChange={onChange('bookingLink')} fullWidth error={!!errors.bookingLink} helperText={errors.bookingLink || ''} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Cancellation Policy" value={state.cancellationPolicy} onChange={onChange('cancellationPolicy')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Safety Measures" value={state.safetyMeasures} onChange={onChange('safetyMeasures')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Insurance" value={state.insurance} onChange={onChange('insurance')} fullWidth />
        </Grid>
        {/* Section: Requirements */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display', fontSize: '1.1rem', pl: 0.5 }}>Requirements</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Participant Requirements" value={state.requirements} onChange={onChange('requirements')} fullWidth multiline minRows={2} />
        </Grid>

        {/* Section: Narrative */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display', fontSize: '1.1rem', pl: 0.5 }}>Narrative</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}><TextField label="Three Words" value={state.threeWords} onChange={onChange('threeWords')} fullWidth /></Grid>
        <Grid item xs={12}><TextField label="More About You / Team" value={state.moreAboutYou} onChange={onChange('moreAboutYou')} fullWidth multiline minRows={3} /></Grid>
      </Grid>

      {/* Review & Sticky Action Bar */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#010057', fontFamily: 'Playfair Display' }}>Review</Typography>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Legal</strong>: {state.legalBusinessName || '—'}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Contact</strong>: {state.contactName || '—'} · {state.contactEmail || '—'} · {state.contactPhone || '—'}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Locations</strong>: {state.primaryLocations || '—'}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Experiences</strong>: {state.experienceNames || '—'}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Descriptions</strong>: {state.briefDescriptions || '—'}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}><strong>Booking</strong>: {state.bookingSystem || '—'} · {state.bookingLink || '—'}</Typography>
          </Stack>
        </Paper>
      </Box>

      {/* Sticky Action Bar */}
      <Box sx={{ position: 'sticky', bottom: 12, mt: 3, ml: 'auto', width: 'fit-content', zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, textAlign: 'right', display: 'block', fontFamily: 'Inter', pr: 1 }}>
          {dirty ? 'Unsaved changes' : (lastSavedAt ? `Last saved: ${lastSavedAt}` : '')}
        </Typography>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            sx={{ 
              px: 4, py: 1.5, borderRadius: 2, 
              bgcolor: '#010057', color: '#fff', 
              fontWeight: 800, fontFamily: 'Agrandir, serif', 
              textTransform: 'uppercase', letterSpacing: '1px',
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: '#C5A059', 
                boxShadow: '0 8px 25px rgba(197, 160, 89, 0.4)',
                transform: 'translateY(-2px)'
              } 
            }} 
            startIcon={!saving ? <CheckCircleOutlineIcon /> : undefined}
          >
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Draft'}
          </Button>
          <Button
            variant="outlined"
            onClick={async ()=>{
              if (Object.keys(errors).length > 0 || completeness < 100) { setError('Please complete all required fields before submitting.'); return; }
              await handleSubmit();
            }}
            sx={{ 
              borderRadius: 2, px: 3, py: 1.5, 
              fontFamily: 'Agrandir, serif', fontWeight: 800,
              color: '#010057', borderColor: '#010057',
              textTransform: 'uppercase', letterSpacing: '1px',
              '&:hover': {
                bgcolor: 'rgba(1, 0, 87, 0.05)',
                borderColor: '#C5A059',
                color: '#C5A059'
              }
            }}
          >
            Submit Portal
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}


