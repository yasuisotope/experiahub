'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { AuthService } from '@/services/authService';
import { useWordPressAuth } from '@/contexts/WordPressContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const { isLoggedIn, login } = useWordPressAuth();

  useEffect(() => {
    if (isLoggedIn) router.push('/chat');
  }, [isLoggedIn, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await AuthService.register(username, email, password);
    if (!res.success) {
      setError(res.error || 'Registration failed');
      setLoading(false);
      return;
    }

    try {
      // Ensure app auth state is updated immediately
      await login(username, password);
    } catch (_) {
      // even if login fails here, fall back to redirect where token may be picked up
    }
    setLoading(false);
    router.push('/chat');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '420px' }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2, textAlign: 'center', color: '#4a7c8c' }}>
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        <TextField label="Username" variant="outlined" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} required />
        <TextField label="Email" type="email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
        <TextField label="Password" type="password" variant="outlined" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 2, bgcolor: 'rgba(74, 124, 140, 0.9)', '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' }, borderRadius: '20px', py: 1.5 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </Button>
        <Box sx={{ mt: 1.5, textAlign: 'center' }}>
          <Button size="small" variant="text" onClick={() => router.push('/login')}>Back to Login</Button>
        </Box>
      </Paper>
    </Box>
  );
}

