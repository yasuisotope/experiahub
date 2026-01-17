'use client';

import React from 'react';
import { 
  Box, Paper, Typography, Button, Stack, TextField, 
  MenuItem, Select, FormControl, InputLabel, Grid, 
  IconButton, Badge, Tooltip, Fade, CircularProgress,
  Card, CardMedia, CardActions, Divider, LinearProgress,
  Chip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearIcon from '@mui/icons-material/Clear';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import MovieIcon from '@mui/icons-material/Movie';
import CollectionsIcon from '@mui/icons-material/Collections';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const N8N_BASE = '/api/n8n';

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

export default function GridLikeMedia({ onToast, defaultActivityId, onUpdate }: { onToast: (m: string) => void; defaultActivityId?: string; onUpdate?: (id: string, media: { photosDriveUrls: string[]; videoDriveUrl: string; videoUrl: string }) => void }) {
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
          const list = json.photosDriveUrls || [];
          setPhotos(list.join(', '));
          if (list.length > 0) setCoverUrl(list[0]);
          setVideoDrive(json.videoDriveUrl || '');
          setVideoExternal(json.videoUrl || '');
          
          if (activityId && onUpdate) {
            onUpdate(activityId, { photosDriveUrls: list, videoDriveUrl: json.videoDriveUrl || '', videoUrl: json.videoUrl || '' });
          }
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

  const onSave = async (updatedPhotos?: string) => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const pStr = updatedPhotos !== undefined ? updatedPhotos : photos;
      const mediaData = {
        photosDriveUrls: pStr.split(',').map((s) => s.trim()).filter(Boolean),
        videoDriveUrl: videoDrive.trim(),
        videoUrl: videoExternal.trim()
      };
      const payload = {
        applicationId: appId,
        activityId: activityId,
        ...mediaData
      };
      const res = await fetch(`${N8N_BASE}/supplier/media/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await parseJsonSafe(res);
      if (!json?.success) throw new Error(json?.error || 'Save failed');
      onToast('Media updated');
      
      if (activityId && onUpdate) {
        onUpdate(activityId, mediaData);
      }
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
        const json = await parseJsonSafe(res);
        const url = json?.url || json?.driveUrl || '';
        setUploads(u => u.map(x => x.name === f.name ? { ...x, status: url ? 'ok' : 'error', url } : x));
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length) {
        const existing = photos.split(',').map(s => s.trim()).filter(Boolean);
        const next = [...existing, ...uploadedUrls].join(', ');
        setPhotos(next);
        if (!coverUrl && uploadedUrls.length > 0) setCoverUrl(uploadedUrls[0]);
        onToast('Upload complete');
        await onSave(next);
        setUploads([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (e: any) {
      onToast(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = (url: string) => {
    const list = photos.split(',').map(s => s.trim()).filter(Boolean);
    const filtered = list.filter(u => u !== url);
    const next = [url, ...filtered].join(', ');
    setPhotos(next);
    setCoverUrl(url);
    onSave(next);
  };

  const handleDelete = (url: string) => {
    const list = photos.split(',').map(s => s.trim()).filter(Boolean);
    const next = list.filter(u => u !== url).join(', ');
    setPhotos(next);
    if (url === coverUrl) {
       const remaining = next.split(',').map(s=>s.trim()).filter(Boolean);
       setCoverUrl(remaining[0] || '');
    }
    onSave(next);
  };

  const photoList = photos.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <Grid container spacing={4}>
      {/* Left: Management */}
      <Grid item xs={12} md={5}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CollectionsIcon fontSize="small" color="primary" /> Select Experience
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel id="activity-select-label">Experience to Manage</InputLabel>
              <Select
                labelId="activity-select-label"
                label="Experience to Manage"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
              >
                <MenuItem value="" disabled>Choose an experience...</MenuItem>
                {activities.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.title}</MenuItem>
                ))}
                {activities.length === 0 && <MenuItem disabled>No experiences found</MenuItem>}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon fontSize="small" color="primary" /> Media URLs
            </Typography>
            <Stack spacing={2}>
              <TextField 
                label="Photo URLs (Comma-separated)" 
                variant="outlined"
                size="small"
                value={photos} 
                onChange={(e) => setPhotos(e.target.value)} 
                fullWidth 
                multiline
                rows={2}
                placeholder="https://drive.google.com/..., https://..."
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
              <TextField 
                label="Google Drive Video URL" 
                variant="outlined"
                size="small"
                value={videoDrive} 
                onChange={(e) => setVideoDrive(e.target.value)} 
                fullWidth 
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
              <TextField 
                label="YouTube / Vimeo URL" 
                variant="outlined"
                size="small"
                value={videoExternal} 
                onChange={(e) => setVideoExternal(e.target.value)} 
                fullWidth 
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon fontSize="small" color="primary" /> Upload Files
            </Typography>

            <Paper 
              onDragOver={(e)=>{ e.preventDefault(); }} 
              onDrop={(e)=>{ e.preventDefault(); onFilesSelected(e.dataTransfer.files); }}
              sx={{
                p: 3,
                border: '2px dashed #E2E8F0',
                borderRadius: 3,
                bgcolor: '#F8FAFC',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} hidden type="file" accept="image/*,video/*" multiple onChange={(e)=>onFilesSelected(e.target.files)} />
              <CloudUploadIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Drop files or click to browse</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Supports JPG, PNG, MP4</Typography>
            </Paper>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>Uploading...</Typography>
                <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
              </Box>
            )}

            {uploads.length > 0 && (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {uploads.map((u, i) => (
                  <Fade in key={i}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                      {u.status === 'pending' ? <CircularProgress size={16} /> : (u.status === 'ok' ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} /> : <ClearIcon color="error" sx={{ fontSize: 18 }} />)}
                      <Typography variant="caption" sx={{ flex: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</Typography>
                    </Box>
                  </Fade>
                ))}
              </Stack>
            )}
          </Box>

          <Button 
            fullWidth
            variant="contained" 
            disabled={saving}
            onClick={() => onSave()}
            sx={{ 
                bgcolor: '#010057', 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(1, 0, 87, 0.15)',
                '&:hover': { bgcolor: '#020080' }
            }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save All Media Changes'}
          </Button>
        </Stack>
      </Grid>

      {/* Right: Gallery */}
      <Grid item xs={12} md={7}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CollectionsIcon fontSize="small" color="primary" /> Photo Gallery ({photoList.length})
            </Typography>
            {photoList.length > 0 && <Typography variant="caption" color="text.secondary">First image is the cover</Typography>}
        </Box>

        {photoList.length === 0 ? (
          <Paper 
            variant="outlined" 
            sx={{ 
                p: 8, borderRadius: 4, textAlign: 'center', bgcolor: 'transparent', borderStyle: 'dashed', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 480 
            }}
          >
             <CollectionsIcon sx={{ fontSize: 64, color: '#E2E8F0', mb: 2 }} />
             <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, mb: 1 }}>Your gallery is empty</Typography>
             <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 300 }}>Add URLs or upload photos to see them here.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {photoList.map((url, idx) => {
              const isCover = url === coverUrl || idx === 0;
              return (
                <Grid item xs={6} sm={4} key={url + idx}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    position: 'relative',
                    border: isCover ? '2px solid #C5A059' : '1px solid #E2E8F0',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' }
                  }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={url}
                      alt="Experience photo"
                      sx={{ bgcolor: '#F1F5F9' }}
                      onError={(e:any) => { e.target.src = 'https://placehold.co/400x300/F1F5F9/94A3B8?text=Invalid+URL'; }}
                    />
                    {isCover && (
                      <Chip 
                        label="Cover" 
                        size="small" 
                        icon={<StarIcon sx={{ color: '#fff !important' }} fontSize="small" />}
                        sx={{ 
                          position: 'absolute', top: 8, left: 8, 
                          bgcolor: '#C5A059', color: '#fff', fontWeight: 800,
                          fontSize: '0.65rem'
                        }} 
                      />
                    )}
                    <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'center', gap: 0.5, bgcolor: '#fff' }}>
                        <Tooltip title={isCover ? "Current Cover" : "Set as Cover"}>
                            <IconButton size="small" disabled={isCover} onClick={() => handleSetCover(url)}>
                                {isCover ? <StarIcon fontSize="small" sx={{ color: '#C5A059' }} /> : <StarBorderIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(url)}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Box sx={{ mt: 4 }}>
             <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MovieIcon fontSize="small" color="primary" /> Video Preview
            </Typography>
            {(videoDrive || videoExternal) ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#F8FAFC' }}>
                    <Stack spacing={1}>
                        {videoDrive && (
                           <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                             <CheckCircleOutlineIcon color="success" fontSize="small" />
                             <Typography variant="caption" sx={{ fontWeight: 600 }}>Google Drive Video linked</Typography>
                           </Box>
                        )}
                        {videoExternal && (
                           <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                             <CheckCircleOutlineIcon color="success" fontSize="small" />
                             <Typography variant="caption" sx={{ fontWeight: 600 }}>External Video: {videoExternal.substring(0, 40)}...</Typography>
                           </Box>
                        )}
                    </Stack>
                </Paper>
            ) : (
                <Typography variant="caption" sx={{ color: '#94A3B8 italic' }}>No videos linked yet.</Typography>
            )}
        </Box>
      </Grid>
    </Grid>
  );
}

