'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack, Button, Divider, Skeleton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, CreditCard as CreditCardIcon, Receipt as ReceiptIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import BackgroundImage from '@/components/BackgroundImage';
import { loadCachedBackground, getUserBackground, type PortalBackground } from '@/services/backgroundService';
import SupportDialog from '@/components/support/SupportDialog';

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useWordPressAuth();
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isTranslucent, setIsTranslucent] = useState(true);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const val = typeof e.detail === 'object' ? e.detail.isTransparent : e.detail;
      setIsTranslucent(val);
    };
    window.addEventListener('ui:transparency', handler as any);
    return () => window.removeEventListener('ui:transparency', handler as any);
  }, []);

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
        if (user?.email) {
          const res = await fetch(`/api/payments?email=${encodeURIComponent(user.email)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStatus(data);
          }
        }
      } catch (err) {
        console.error('Failed to load payment info:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.email]);

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
          action: status?.status === 'active' ? 'portal' : 'checkout',
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
    } catch (err: any) {
      console.error('Management failed:', err);
      alert('Failed to manage payment methods. Please try again or contact support. ' + (err.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  const paperStyle = {
    p: 4, 
    borderRadius: '16px', 
    border: '1px solid rgba(1,0,87,0.1)', 
    bgcolor: isTranslucent ? 'rgba(255,255,255,0.6)' : '#fff', 
    backdropFilter: isTranslucent ? 'blur(12px)' : 'none'
  };

  return (
    <ProtectedRoute>
      <BackgroundImage imageUrl={bg?.url} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0.1}>

        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 4,
            maxWidth: 1000,
            mx: 'auto',
            bgcolor: isTranslucent ? 'rgba(255, 255, 255, 0.6)' : '#f8fafc',
            backdropFilter: isTranslucent ? 'blur(12px)' : 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            alignItems: 'center', // Center content
          }}
        >
          {/* Header */}
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 4, position: 'relative' }}>
            <Button 
              onClick={() => router.back()}
              startIcon={<ArrowBackIcon />}
              sx={{ position: 'absolute', left: 0, color: '#010057', fontSize: '0.9rem', textTransform: 'none', fontFamily: 'Nunito, sans-serif' }}
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ width: '100%', textAlign: 'center', color: '#010057', fontFamily: 'Agrandir, serif', fontWeight: 400 }}>
              Payment Details
            </Typography>
          </Box>

          <Stack spacing={4} sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}> {/* Constrain width for centering */}
            {/* Payment Methods - Primary Action */}
            <Paper elevation={0} sx={paperStyle}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                 <Typography variant="h6" sx={{ color: '#010057', fontFamily: 'Nunito, sans-serif', fontWeight: 400 }}>Payment Methods</Typography>
                 <Button variant="contained" onClick={handleManage} disabled={processing} sx={{ bgcolor: '#010057', textTransform: 'none', borderRadius: '12px', fontFamily: 'Nunito, sans-serif' }}>
                   Manage
                 </Button>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <CreditCardIcon sx={{ color: '#010057' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 400, color: '#010057' }}>{status?.card_brand || 'No card linked'}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', color: '#666' }}>
                    {status?.card_last4 ? `Ending in ${status.card_last4}` : 'add a method for faster checkout'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>



            {/* Billing History */}
            {status?.invoices?.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(1,0,87,0.08)', bgcolor: 'rgba(255,255,255,0.6)' }}>
                <Typography variant="h6" sx={{ color: '#010057', mb: 2, fontFamily: 'Nunito, sans-serif', fontWeight: 400 }}>Billing History</Typography>
                <Stack spacing={1}>
                  {status.invoices.map((inv: any) => (
                    <Stack key={inv.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: '12px', '&:hover': { bgcolor: 'rgba(255,255,255,0.8)' }, transition: 'background-color 0.2s' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <ReceiptIcon sx={{ color: '#64748B', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontFamily: 'Nunito, sans-serif', color: '#010057' }}>Invoice #{inv.number}</Typography>
                          <Typography variant="caption" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif' }}>{new Date(inv.date).toLocaleDateString()}</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 400, fontFamily: 'Nunito, sans-serif', color: '#010057' }}>{inv.total}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button size="small" sx={{ color: '#999', fontFamily: 'Nunito, sans-serif', textTransform: 'none' }} onClick={() => setSupportOpen(true)}>Need help with billing?</Button>
            </Box>
          </Stack>
        </Box>
        <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} defaultRole="user" />
      </BackgroundImage>
    </ProtectedRoute>
  );
}
