'use client';

import React from 'react';
import { Box, Paper, Typography, Alert, Button, Stack, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

// Helper function from page.tsx (duplicated for now or exported?)
// Ideally should be shared. For now I'll inline a safe version.
const getBaseUrl = () => {
    return '/api/n8n';
};
const N8N_BASE = getBaseUrl();

async function parseJsonSafe(res: Response): Promise<any | null> {
    try {
        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch (e) {
        console.error("[GridLikeMedia] JSON Parse Error:", e);
        return null;
    }
}

export default function GridLikeMedia({ onToast, defaultActivityId }: { onToast: (m: string) => void; defaultActivityId?: string }) {
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
    try { return typeof window !== 'undefined' ? (localStorage.getItem('supplier_application_id') || '') : ''; } catch { return ''; }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!appId) return;
      try {
        const params = new URLSearchParams({ applicationId: appId });
        if (activityId) params.set('activityId', activityId);
        const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`, { signal: controller.signal });
        const json = await parseJsonSafe(res);
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
        const json = await parseJsonSafe(res);
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
      const json = await parseJsonSafe(res);
      if (!json) { if (res.ok) return; throw new Error('Save failed'); }
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
        // Note: '/supplier/media/upload' logic differs depending on server vs client. 
        // Assuming N8N_BASE is proxy.
        const res = await fetch(`${N8N_BASE}/supplier/media/upload`, { method: 'POST', body: fd });
        const json = await parseJsonSafe(res);
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
        borderRadius: 3,
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
