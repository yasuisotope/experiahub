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
  legalBusinessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const defaultState: OnboardingFormState = {
  applicationId: '',
  legalBusinessName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: ''
};

export default function OnboardingForm({ applicationId, initialData }: { applicationId: string; initialData?: any }) {
  const [state, setState] = React.useState<OnboardingFormState>({ ...defaultState, applicationId });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<string>('');
  const [dirty, setDirty] = React.useState(false);

  // Pre-fill from initialData if available
  React.useEffect(() => {
    if (initialData) {
      setState(prev => ({
        ...prev,
        legalBusinessName: initialData.businessName || prev.legalBusinessName,
        contactEmail: initialData.email || prev.contactEmail,
        contactName: initialData.fullName || prev.contactName,
        contactPhone: initialData.phone || prev.contactPhone,
      }));
    }
  }, [initialData]);

  const requiredKeys: (keyof OnboardingFormState)[] = [
    'applicationId',
    'legalBusinessName',
    'contactName',
    'contactEmail',
    'contactPhone'
  ];
  const completedCount = requiredKeys.reduce((acc, k) => acc + (String((state as any)[k] || '').trim() ? 1 : 0), 0);
  const completeness = Math.round((completedCount / requiredKeys.length) * 100);

  React.useEffect(() => {
    setState((s) => ({ ...s, applicationId }));
  }, [applicationId]);

  React.useEffect(() => {
    // Validate basic fields
    const next: Record<string, string> = {};
    if (!state.applicationId?.trim()) next.applicationId = 'Portal ID is required';
    const email = state.contactEmail?.trim();
    if (email && !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) next.contactEmail = 'Invalid email format';
    
    if (!state.legalBusinessName?.trim()) next.legalBusinessName = 'Legal business name is required';
    if (!state.contactName?.trim()) next.contactName = 'Contact name is required';
    if (!state.contactPhone?.trim()) next.contactPhone = 'Contact phone is required';
    
    setErrors(next);
  }, [state.applicationId, state.contactEmail, state.legalBusinessName, state.contactName, state.contactPhone]);

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
      // Note: This endpoint might expect more fields. If n8n fails, we might need to send dummy data for removed fields.
      // But usually JSON upsert handles partial updates if configured.
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
    await handleSave(); // Ensure latest is saved
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
      alert('Submitted for review. We will notify you by email.');
    } catch (e: any) {
      setError(e.message || 'Submit failed');
    }
  };
  
  // Prevent loss of changes
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
    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'transparent', position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
           <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 3 }}>Company Profile</Typography>
           <Typography variant="body2" sx={{ fontFamily: 'Nunito, sans-serif', color: '#475569' }}>
             Verify your main contact details. For location details, use the Locations tab.
           </Typography>
        </Box>

      </Stack>
      
      {error && <Alert severity="error" sx={{ mb: 2, fontFamily: 'Nunito, sans-serif' }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2, fontFamily: 'Nunito, sans-serif' }}>Saved successfully{lastSavedAt ? ` at ${lastSavedAt}` : ''}.</Alert>}

      {/* Section: Company & Contact */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
           <TextField 
             label="Supplier ID" 
             value={state.applicationId || ''} 
             disabled 
             fullWidth 
             helperText="Unique identifier for support and API usage"
             InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
             InputProps={{ style: { fontFamily: 'Nunito, sans-serif', color: '#334155' } }}
             FormHelperTextProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
           />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            label="Legal Business Name" 
            value={state.legalBusinessName} 
            onChange={onChange('legalBusinessName')} 
            fullWidth 
            error={!!errors.legalBusinessName} 
            helperText={errors.legalBusinessName || ''}
            InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            FormHelperTextProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            label="Account Email" 
            value={state.contactEmail} 
            onChange={onChange('contactEmail')} 
            fullWidth 
            helperText="Used for login and communication"
            InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            FormHelperTextProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField 
            label="Contact Person Name" 
            value={state.contactName} 
            onChange={onChange('contactName')} 
            fullWidth 
            error={!!errors.contactName} 
            helperText={errors.contactName || ''}
            InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            FormHelperTextProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            label="Contact Phone" 
            value={state.contactPhone} 
            onChange={onChange('contactPhone')} 
            fullWidth 
            InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            InputProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
            FormHelperTextProps={{ style: { fontFamily: 'Nunito, sans-serif' } }}
          />
        </Grid>
      </Grid>

      {/* Sticky Action Bar */}
      <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif' }}>
          {dirty ? 'Unsaved changes' : (lastSavedAt ? `Saved` : '')}
        </Typography>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          variant="contained"
          sx={{ 
            px: 4, py: 1.2, borderRadius: 2, 
            bgcolor: '#010057', color: '#fff', 
            fontWeight: 700, fontFamily: 'Nunito, sans-serif', 
            textTransform: 'none', fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(1, 0, 87, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': { 
              bgcolor: '#000040', 
              boxShadow: '0 6px 16px rgba(1, 0, 87, 0.3)',
              transform: 'translateY(-1px)'
            } 
          }} 
          startIcon={!saving ? <CheckCircleOutlineIcon /> : undefined}
        >
          {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Profile'}
        </Button>
      </Box>
    </Paper>
  );
}
