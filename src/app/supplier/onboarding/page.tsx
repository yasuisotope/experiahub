'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Button, Paper, TextField, Typography, Alert, CircularProgress, Grid } from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthService } from '@/services/authService';

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';

type FormState = {
  applicationId: string;
  partnerCode?: string;
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

const defaultState: FormState = {
  applicationId: '',
  partnerCode: '',
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

export default function SupplierOnboardingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<FormState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<{ exists?: boolean; status?: string | null; approved?: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const storageKey = useMemo(() => `supplier_onboarding_${state.applicationId || 'draft'}`, [state.applicationId]);

  useEffect(() => {
    const appIdFromUrl = params.get('appId') || '';
    const pcFromUrl = params.get('partner') || params.get('partnerCode') || params.get('pc') || '';
    const initialId = appIdFromUrl || localStorage.getItem('supplier_application_id') || '';
    const initialPartnerCode = pcFromUrl || localStorage.getItem('partner_code') || '';
    // Load draft if exists
    const draftRaw = localStorage.getItem(`supplier_onboarding_${initialId || 'draft'}`);
    let draft: Partial<FormState> = {};
    if (draftRaw) {
      try { draft = JSON.parse(draftRaw); } catch {}
    }
    setState((prev) => ({ ...prev, ...draft, applicationId: initialId, partnerCode: initialPartnerCode }));
    if (initialId) localStorage.setItem('supplier_application_id', initialId);
    if (initialPartnerCode) localStorage.setItem('partner_code', initialPartnerCode);
  }, [params]);

  useEffect(() => {
    // Auto-save draft
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  // Client-side validation
  useEffect(() => {
    const next: Record<string, string> = {};
    const email = state.contactEmail?.trim();
    if (email && !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) {
      next.contactEmail = 'Invalid email format';
    }
    const url = state.bookingLink?.trim();
    if (url) {
      try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad');
      } catch {
        next.bookingLink = 'Invalid URL';
      }
    }
    if (!state.applicationId?.trim()) {
      next.applicationId = 'Application ID is required';
    }
    setErrors(next);
  }, [state.applicationId, state.contactEmail, state.bookingLink]);

  // Fetch status from backend when applicationId changes
  useEffect(() => {
    const appId = state.applicationId?.trim();
    if (!appId) {
      setStatusInfo(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      setStatusLoading(true);
      setStatusError(null);
      try {
        const url = `${N8N_BASE}/supplier/onboarding/status?applicationId=${encodeURIComponent(appId)}`;
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        const json = await res.json();
        if (json && json.success) {
          setStatusInfo({ exists: json.exists, status: json.status ?? null, approved: !!json.approved });
        } else {
          setStatusError(json?.error || 'Failed to fetch status');
          setStatusInfo(null);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setStatusError(e.message || 'Failed to fetch status');
      } finally {
        setStatusLoading(false);
      }
    })();
    return () => controller.abort();
  }, [state.applicationId]);

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setState((s) => ({ ...s, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
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
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save');
      setSaved(true);
      setLastSavedAt(new Date().toLocaleString());
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!state.applicationId) throw new Error('Missing application ID');
      const token = AuthService.getToken();
      const res = await fetch(`${N8N_BASE}/supplier/onboarding/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ applicationId: state.applicationId })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submit failed');
      setSaved(true);
    } catch (e: any) {
      setError(e.message || 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
        <Paper sx={{ maxWidth: 980, mx: 'auto', p: 3, borderRadius: 2 }}>
          <Typography variant="h4" sx={{ mb: 2, color: '#4A4A4A', fontFamily: 'Cormorant Garamond' }}>
            Supplier Onboarding
          </Typography>
          <Typography sx={{ mb: 3, color: '#666' }}>
            Please complete the following fields to help us present your experience authentically.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {saved && <Alert severity="success" sx={{ mb: 2 }}>Saved successfully{lastSavedAt ? ` at ${lastSavedAt}` : ''}.</Alert>}

          <Alert severity="info" sx={{ mb: 2 }}>
            Application ID: <strong>{state.applicationId || '—'}</strong>
            <Button size="small" sx={{ ml: 1 }} onClick={() => { navigator.clipboard.writeText(state.applicationId || ''); }}>Copy</Button>
          </Alert>

          <Grid container spacing={2}>
            {/* Section 1 */}
            <Grid item xs={12}>
              <TextField label="Application ID" value={state.applicationId} onChange={onChange('applicationId')} fullWidth disabled={!state.applicationId}
                error={!!errors.applicationId} helperText={errors.applicationId || ''} />
            </Grid>
            <Grid item xs={12}>
              {statusLoading ? (
                <Alert severity="info">Checking status…</Alert>
              ) : statusError ? (
                <Alert severity="warning">{statusError}</Alert>
              ) : statusInfo ? (
                <Alert severity="success">Status: <strong>{statusInfo.status || (statusInfo.exists ? 'Unknown' : 'No record')}</strong>{typeof statusInfo.approved === 'boolean' ? (<span> • Approved: <strong>{statusInfo.approved ? 'Yes' : 'No'}</strong></span>) : null}</Alert>
              ) : null}
            </Grid>
            <Grid item xs={12}>
              <TextField label="Your Origin Story" value={state.originStory} onChange={onChange('originStory')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Personal Fulfillment" value={state.fulfillment} onChange={onChange('fulfillment')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Authentic Echoes" value={state.authenticEchoes} onChange={onChange('authenticEchoes')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Unforgettable Feeling" value={state.unforgettableFeeling} onChange={onChange('unforgettableFeeling')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="A Moment of Magic" value={state.magicMoment} onChange={onChange('magicMoment')} fullWidth multiline minRows={3} />
            </Grid>
            {/* Section 3 */}
            <Grid item xs={12}>
              <TextField label="Hidden Gem" value={state.hiddenGem} onChange={onChange('hiddenGem')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Community & Connection" value={state.communityConnection} onChange={onChange('communityConnection')} fullWidth multiline minRows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Perfect Match (Ideal Participant)" value={state.perfectMatch} onChange={onChange('perfectMatch')} fullWidth multiline minRows={2} />
            </Grid>
            {/* Section 4: Company & Contact */}
            <Grid item xs={12} sm={6}>
              <TextField label="Legal Business Name" value={state.legalBusinessName} onChange={onChange('legalBusinessName')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Name" value={state.contactName} onChange={onChange('contactName')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Email" value={state.contactEmail} onChange={onChange('contactEmail')} fullWidth error={!!errors.contactEmail} helperText={errors.contactEmail || ''} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Phone" value={state.contactPhone} onChange={onChange('contactPhone')} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Primary Locations (City, Country)" value={state.primaryLocations} onChange={onChange('primaryLocations')} fullWidth />
            </Grid>
            {/* Experience details */}
            <Grid item xs={12}>
              <TextField label="Experience Name(s)" value={state.experienceNames} onChange={onChange('experienceNames')} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Brief Description(s)" value={state.briefDescriptions} onChange={onChange('briefDescriptions')} fullWidth multiline minRows={3} />
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
            <Grid item xs={12}>
              <TextField label="Participant Requirements" value={state.requirements} onChange={onChange('requirements')} fullWidth multiline minRows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Three Words" value={state.threeWords} onChange={onChange('threeWords')} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="More About You / Team" value={state.moreAboutYou} onChange={onChange('moreAboutYou')} fullWidth multiline minRows={3} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="outlined" onClick={() => router.back()}>Back</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: 'rgba(74, 124, 140, 0.9)' }}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
            <Button variant="contained" color="success" onClick={handleSubmitForReview} disabled={saving || !state.applicationId || Object.keys(errors).length > 0}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Submit for review'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </ProtectedRoute>
  );
}

