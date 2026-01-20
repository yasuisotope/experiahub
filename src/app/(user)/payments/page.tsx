'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack, Button, Divider, Skeleton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, CreditCard as CreditCardIcon, Receipt as ReceiptIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import BackgroundImage from '@/components/BackgroundImage';
import { loadCachedBackground, getUserBackground, type PortalBackground } from '@/services/backgroundService';

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useWordPressAuth();
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
        const cached = loadCachedBackground('user');
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) setBg(server);
      } catch {} finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <ProtectedRoute>
      <BackgroundImage imageUrl={bg?.url} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0.1}>
        <Box
          sx={{
            height: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            p: 4,
            maxWidth: 900,
            mx: 'auto',
            bgcolor: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            m: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button 
              onClick={() => router.back()}
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2, color: '#010057', fontSize: '0.9rem', textTransform: 'none' }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ color: '#010057', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
              Payment Details
            </Typography>
          </Box>

          <Stack spacing={3}>
            {/* Subscription Summary */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(1,0,87,0.1)', bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Typography variant="h6" sx={{ color: '#010057', mb: 2, fontWeight: 600 }}>Current Plan</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>ExperiaHub Premium</Typography>
                  <Typography variant="body2" color="text.secondary">Active since {new Date().toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#010057' }}>$29.00 / mo</Typography>
                  <Typography variant="caption" color="text.secondary">Next billing date: Feb 20, 2026</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button variant="contained" sx={{ bgcolor: '#010057', textTransform: 'none', borderRadius: '8px' }}>
                Manage Subscription
              </Button>
            </Paper>

            {/* Payment Methods */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(1,0,87,0.1)', bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Typography variant="h6" sx={{ color: '#010057', mb: 2, fontWeight: 600 }}>Default Payment Method</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: 'rgba(1,0,87,0.05)', borderRadius: '8px' }}>
                  <CreditCardIcon sx={{ color: '#010057' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">Visa ending in 4242</Typography>
                  <Typography variant="caption" color="text.secondary">Expires 12/28</Typography>
                </Box>
                <Button variant="outlined" size="small" sx={{ textTransform: 'none', color: '#010057', borderColor: 'rgba(1,0,87,0.3)' }}>Edit</Button>
              </Stack>
            </Paper>

            {/* Billing History */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(1,0,87,0.1)', bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Typography variant="h6" sx={{ color: '#010057', mb: 2, fontWeight: 600 }}>Billing History</Typography>
              <Stack spacing={1}>
                {[1, 2, 3].map((i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: '8px', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ReceiptIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Invoice #EXH-000{i}</Typography>
                        <Typography variant="caption" color="text.secondary">Jan {20 - i}, 2026</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>$29.00</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button fullWidth variant="outlined" sx={{ mt: 2, textTransform: 'none', color: '#010057', borderColor: 'rgba(1,0,87,0.3)' }}>
                View All Invoices
              </Button>
            </Paper>
          </Stack>
        </Box>
      </BackgroundImage>
    </ProtectedRoute>
  );
}
