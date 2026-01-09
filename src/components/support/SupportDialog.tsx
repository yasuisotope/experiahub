import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Typography,
  LinearProgress
} from '@mui/material';

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
const SUPPORT_URL = `${N8N_BASE}/support/ticket`;

export type SupportDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultRole?: 'supplier' | 'user';
  appId?: string;
  bookingId?: string;
  userEmail?: string;
};

export default function SupportDialog(props: SupportDialogProps) {
  const { open, onClose, defaultRole = 'supplier', appId, bookingId, userEmail } = props;

  const [role, setRole] = React.useState<'supplier' | 'user'>(defaultRole);
  const [name, setName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>(userEmail || '');
  const [category, setCategory] = React.useState<string>('onboarding');
  const [subject, setSubject] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setRole(defaultRole);
      setError(null);
      setSuccess(null);
    }
  }, [open, defaultRole]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append('role', role);
      fd.append('name', name);
      fd.append('email', email);
      fd.append('category', category);
      fd.append('subject', subject);
      fd.append('message', message);
      if (appId) fd.append('applicationId', appId);
      if (bookingId) fd.append('bookingId', bookingId);
      try { fd.append('userAgent', navigator.userAgent); } catch {}
      if (files && files.length) {
        Array.from(files).forEach((f, i) => fd.append('attachment' + i, f, f.name));
      }
      const res = await fetch(SUPPORT_URL, { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || 'Submit failed');
      setSuccess(json?.ticketId ? `Ticket created: ${json.ticketId}` : 'Ticket submitted');
      // clear non-identifying fields
      setSubject('');
      setMessage('');
      setFiles(null);
    } catch (e: any) {
      setError(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper" PaperProps={{ sx: { overflow: 'visible' } }}>
      <DialogTitle sx={{ pb: 1.5 }}>Contact Support</DialogTitle>
      <DialogContent dividers sx={{ pt: 4.5 }}>
        {submitting && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Stack spacing={2}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-label">I am a</InputLabel>
            <Select labelId="role-label" label="I am a" value={role} onChange={(e)=>setRole(e.target.value as any)}>
              <MenuItem value="supplier">Supplier</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} fullWidth required />
            <TextField label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} fullWidth required />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="cat-label">Category</InputLabel>
              <Select labelId="cat-label" label="Category" value={category} onChange={(e)=>setCategory(e.target.value)}>
                <MenuItem value="onboarding">Onboarding</MenuItem>
                <MenuItem value="media">Media/Uploads</MenuItem>
                <MenuItem value="pricing">Pricing</MenuItem>
                <MenuItem value="sync">Sync/Bókun</MenuItem>
                <MenuItem value="booking">Booking Issue</MenuItem>
                <MenuItem value="payment">Payment/Billing</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField label={role === 'supplier' ? 'Application ID' : 'Booking ID'} value={role === 'supplier' ? (appId || '') : (bookingId || '')} fullWidth disabled />
          </Stack>
          <TextField label="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} fullWidth required />
          <TextField label="Message" value={message} onChange={(e)=>setMessage(e.target.value)} fullWidth required multiline minRows={4} />
          <div>
            <Button variant="outlined" component="label">
              Attach files
              <input type="file" multiple hidden onChange={onFileChange} />
            </Button>
            {files && files.length > 0 && (
              <Typography variant="caption" sx={{ ml: 1 }}>{Array.from(files).map(f=>f.name).join(', ')}</Typography>
            )}
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting || !name.trim() || !email.trim() || !subject.trim() || !message.trim()} sx={{ bgcolor: '#010057', '&:hover': { bgcolor: '#020080' } }}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}
