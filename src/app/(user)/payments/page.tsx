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
  const [status, setStatus] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
        
        // 1. Load Background
        const cached = loadCachedBackground('user');
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) setBg(server);

        // 2. Load Payment Status
        const res = await fetch('/api/payments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to load payment info:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleManage = async () => {
    setProcessing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'manage',
          email: user?.email,
          name: user?.display_name 
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Management failed:', err);
    } finally {
      setProcessing(false);
    }
  };

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
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{status?.plan || 'ExperiaHub Premium'}</Typography>
                  <Typography variant="body2" color="text.secondary">Status: {status?.status || 'Active'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#010057' }}>{status?.price || '$29.00 / mo'}</Typography>
                  {status?.next_billing && (
                    <Typography variant="caption" color="text.secondary">
                      Next billing: {new Date(status.next_billing).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button 
                variant="contained" 
                onClick={handleManage}
                disabled={processing}
                sx={{ bgcolor: '#010057', textTransform: 'none', borderRadius: '8px' }}
              >
                {processing ? 'Connecting...' : 'Manage Subscription'}
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
                  <Typography variant="subtitle2">{status?.card_brand || 'Visa'} ending in {status?.card_last4 || '4242'}</Typography>
                  <Typography variant="caption" color="text.secondary">Securely managed via Stripe</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={handleManage} sx={{ textTransform: 'none', color: '#010057', borderColor: 'rgba(1,0,87,0.3)' }}>Edit</Button>
              </Stack>
            </Paper>

            {/* Billing History */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(1,0,87,0.1)', bgcolor: 'rgba(255,255,255,0.5)' }}>
              <Typography variant="h6" sx={{ color: '#010057', mb: 2, fontWeight: 600 }}>Billing History</Typography>
              <Stack spacing={1}>
                {status?.invoices?.length > 0 ? status.invoices.map((inv: any) => (
                  <Stack key={inv.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: '8px', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ReceiptIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Invoice #{inv.number}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(inv.date).toLocaleDateString()}</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{inv.total}</Typography>
                  </Stack>
                )) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No recent invoices.
                  </Typography>
                )}
              </Stack>
              <Button fullWidth variant="outlined" onClick={handleManage} sx={{ mt: 2, textTransform: 'none', color: '#010057', borderColor: 'rgba(1,0,87,0.3)' }}>
                View All Invoices
              </Button>
            </Paper>
          </Stack>
        </Box>
      </BackgroundImage>
    </ProtectedRoute>
  );
}
