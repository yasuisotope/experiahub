'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import ForgotPassword from '@/components/auth/ForgotPassword';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'login'|'signup'>(() => 'login');
  // Signup local state (combined page)
  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suLoading, setSuLoading] = useState(false);
  const [suError, setSuError] = useState<string | null>(null);
  
  const { login, isLoggedIn } = useWordPressAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine post-login target robustly; tolerate double-encoding and absolute URLs
  const { target, appIdFromNext } = React.useMemo(() => {
    const rawParam =
      searchParams?.get('next') ||
      searchParams?.get('redirect') ||
      searchParams?.get('returnTo') ||
      (typeof window !== 'undefined' ? localStorage.getItem('post_login_target') || '' : '');

    const decodeTwice = (s: string) => {
      try {
        const d1 = decodeURIComponent(s);
        try { return decodeURIComponent(d1); } catch { return d1; }
      } catch { return s; }
    };

    const raw = rawParam || '/';
    const decoded = decodeTwice(raw);

    let desiredPath = '/';
    let appId: string | null = null;

    const extractAppId = (text: string) => {
      try {
        const u = new URL(text, typeof window !== 'undefined' ? window.location.origin : 'https://app.experiahub.com');
        return u.searchParams.get('appId');
      } catch {
        const qs = (text.split('?')[1] || '');
        const usp = new URLSearchParams(qs);
        return usp.get('appId');
      }
    };

    // Accept same-origin absolute or relative paths
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.experiahub.com';
      const asUrl = new URL(decoded, base);
      if (asUrl.origin === base) {
        desiredPath = asUrl.pathname + asUrl.search + asUrl.hash;
        appId = extractAppId(decoded) || null;
      }
    } catch {
      // If not a URL, treat as path
      if (decoded.startsWith('/')) {
        desiredPath = decoded;
        appId = extractAppId(decoded) || null;
      }
    }

    // normalize: if target is /supplier/onboarding..., send to /supplier...
    const normalizeSupplierPath = (p: string) =>
      p.replace(/^\/supplier\/onboarding(?=\/|\?|$)/, '/supplier');
    desiredPath = normalizeSupplierPath(desiredPath);

    // Persist appId for onboarding page
    try { if (appId) localStorage.setItem('supplier_application_id', appId); } catch {}

    return { target: desiredPath || '/', appIdFromNext: appId };
  }, [searchParams]);

  const quickSignupUrl = React.useMemo(() => {
    const next = appIdFromNext
      ? `/supplier?appId=${encodeURIComponent(appIdFromNext)}`
      : target || '/supplier';
    return `https://experiahub.com/suppliers/?next=${encodeURIComponent(next)}`;
  }, [target, appIdFromNext]);

  // Reflect ?tab= in UI and keep in sync
  React.useEffect(() => {
    const t = (searchParams?.get('tab') || '').toLowerCase();
    setTab(t === 'signup' ? 'signup' : 'login');
  }, [searchParams]);

  React.useEffect(() => {
    if (isLoggedIn) {
      router.replace(target);
    }
  }, [isLoggedIn, router, target]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      try { localStorage.removeItem('post_login_target'); } catch {}
      // Extra guard: if target isn't set, derive from appId stored in next/localStorage
      let destination = target || '/';
      if (destination === '/' || destination === '') {
        let appId = appIdFromNext || null;
        try {
          if (!appId) appId = localStorage.getItem('supplier_application_id');
        } catch {}
        if (appId) destination = `/supplier?appId=${encodeURIComponent(appId)}`;
      }
      router.replace(destination);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuLoading(true);
    setSuError(null);
    try {
      const res = await (await import('@/services/authService')).AuthService.register(suUsername, suEmail, suPassword);
      if (!res.success) {
        setSuError(res.error || 'Registration failed');
        setSuLoading(false);
        return;
      }
      // After successful registration, attempt login for seamless flow
      try { await login(suUsername, suPassword); } catch {}
      // Redirect same as login
      let destination = target || '/';
      if (destination === '/' || destination === '') {
        let appId = appIdFromNext || null;
        try { if (!appId) appId = localStorage.getItem('supplier_application_id'); } catch {}
        if (appId) destination = `/supplier?appId=${encodeURIComponent(appId)}`;
      }
      router.replace(destination);
    } catch (e: any) {
      setSuError(e?.message || 'Registration failed');
    } finally {
      setSuLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ p: 0, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', bgcolor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', width: '100%', maxWidth: 520 }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} centered variant="fullWidth">
          <Tab label="Log In" value="login" />
          <Tab label="Create Account" value="signup" />
        </Tabs>
        {tab === 'login' && (
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center', color: '#4a7c8c' }}>Login to ExperiaHub</Typography>
            {error && (<Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>)}
            <TextField label="Username or Email" fullWidth value={username} onChange={(e)=>setUsername(e.target.value)} disabled={loading} required />
            <TextField label="Password" type="password" fullWidth value={password} onChange={(e)=>setPassword(e.target.value)} disabled={loading} required />
            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 1, bgcolor: 'rgba(74, 124, 140, 0.9)', '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' }, borderRadius: '20px', py: 1.5 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Button size="small" variant="text" onClick={() => router.push(target || '/')}>Back</Button>
              <Box sx={{ textAlign: 'right' }}><ForgotPassword /></Box>
            </Stack>
          </Box>
        )}
        {tab === 'signup' && (
          <Box component="form" onSubmit={handleSignup} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center', color: '#4a7c8c' }}>Create Account</Typography>
            {suError && (<Alert severity="error" sx={{ mb: 1 }}>{suError}</Alert>)}
            <TextField label="Username" fullWidth value={suUsername} onChange={(e)=>setSuUsername(e.target.value)} disabled={suLoading} required />
            <TextField label="Email" type="email" fullWidth value={suEmail} onChange={(e)=>setSuEmail(e.target.value)} disabled={suLoading} required />
            <TextField label="Password" type="password" fullWidth value={suPassword} onChange={(e)=>setSuPassword(e.target.value)} disabled={suLoading} required />
            <Button type="submit" variant="contained" fullWidth disabled={suLoading} sx={{ mt: 1, bgcolor: 'rgba(74, 124, 140, 0.9)', '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' }, borderRadius: '20px', py: 1.5 }}>
              {suLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button size="small" variant="text" onClick={() => setTab('login')}>Already have an account? Log in</Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}