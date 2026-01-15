'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Box, Typography, Stack, Paper, Button, Divider, CircularProgress, Alert } from '@mui/material';

type BookingDetails = {
  id: string;
  title?: string;
  status?: string;
  date?: string;
  time?: string;
  location?: string;
  participants?: number;
  price?: string;
  provider?: string;
  startISO?: string;
  endISO?: string;
  timezone?: string;
  meetingPoint?: string;
  address?: string;
  participantsByCategory?: Record<string, number>;
  lineItems?: Array<{ label: string; amount: string | number; currency?: string }>;
  total?: string | number;
  currency?: string;
  customer?: { name?: string; email?: string; phone?: string };
  cancellation?: { status?: string; policy?: string; refundableUntilISO?: string };
  product?: { provider?: string; bokunProductId?: string | number; experienceId?: string | number; title?: string };
};

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<BookingDetails | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_N8N_SUPPLIER_URL || 'https://n8n.isotope-blue.com/webhook';
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('wp_token') : null;
        const res = await fetch(`${base}/bookings/details?id=${encodeURIComponent(bookingId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = await res.json();
        if (!alive) return;
        setDetails({ id: bookingId, ...data });
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load booking');
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [bookingId]);

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          maxWidth: 800,
          mx: 'auto',
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          overflowY: 'auto'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontSize: '2rem', color: '#4A4A4A', fontFamily: 'Cormorant Garamond', fontWeight: 500 }}
          >
            Booking Details
          </Typography>
          <Button variant="outlined" size="small" onClick={() => router.push('/bookings')}>Back to bookings</Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Loading booking...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)' }}>
            <Stack spacing={1.5}>
              <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Booking ID</Typography>
              <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details?.id}</Typography>
              {details?.title && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Title</Typography>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.title}</Typography>
                </>
              )}
              {details?.status && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Status</Typography>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.status}</Typography>
                </>
              )}
              {(details?.date || details?.time || details?.startISO) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>When</Typography>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>
                    {details?.date || (details?.startISO ? new Date(details.startISO).toLocaleDateString() : '')}
                    {` `}
                    {details?.time || (details?.startISO ? new Date(details.startISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                    {details?.endISO ? ` - ${new Date(details.endISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {details?.timezone ? ` (${details.timezone})` : ''}
                  </Typography>
                </>
              )}
              {(details?.location || details?.meetingPoint || details?.address) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Location</Typography>
                  {details?.location && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.location}</Typography>
                  )}
                  {details?.meetingPoint && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Meeting point</Typography>
                  )}
                  {details?.meetingPoint && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.meetingPoint}</Typography>
                  )}
                  {details?.address && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Address</Typography>
                  )}
                  {details?.address && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.address}</Typography>
                  )}
                </>
              )}
              {(details?.participants || details?.participantsByCategory || details?.price || details?.total) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Summary</Typography>
                  {details?.participants && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>
                      {details.participants} {details.participants === 1 ? 'person' : 'people'}
                    </Typography>
                  )}
                  {details?.participantsByCategory && (
                    <Stack>
                      {Object.entries(details.participantsByCategory).map(([k, v]) => (
                        <Typography key={k} sx={{ fontFamily: 'Urbanist', color: '#666' }}>{k}: {v}</Typography>
                      ))}
                    </Stack>
                  )}
                  {(details?.total || details?.price) && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>
                      {typeof details.total !== 'undefined' ? `${details.total}${details.currency ? ' ' + details.currency : ''}` : (details.price || '')}
                    </Typography>
                  )}
                  {details?.lineItems?.length ? (
                    <Stack>
                      {details.lineItems.map((li, idx) => (
                        <Typography key={idx} sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                          {li.label}: {li.amount}{li.currency ? ` ${li.currency}` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                </>
              )}
              {details?.customer && (details.customer.name || details.customer.email || details.customer.phone) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Customer</Typography>
                  {details.customer.name && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.customer.name}</Typography>
                  )}
                  {details.customer.email && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{details.customer.email}</Typography>
                  )}
                  {details.customer.phone && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{details.customer.phone}</Typography>
                  )}
                </>
              )}
              {details?.cancellation && (details.cancellation.status || details.cancellation.policy || details.cancellation.refundableUntilISO) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Cancellation</Typography>
                  {details.cancellation.status && (
                    <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>{details.cancellation.status}</Typography>
                  )}
                  {details.cancellation.refundableUntilISO && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                      Refundable until {new Date(details.cancellation.refundableUntilISO).toLocaleString()}
                    </Typography>
                  )}
                  {details.cancellation.policy && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>{details.cancellation.policy}</Typography>
                  )}
                </>
              )}
              {(details?.provider || details?.product) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>Provider</Typography>
                  <Typography sx={{ fontFamily: 'Urbanist', fontWeight: 600 }}>
                    {details?.product?.title || details?.title || ''}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                    Provider: {details?.product?.provider || details?.provider || 'Bókun'}
                  </Typography>
                  {(details?.product?.bokunProductId || details?.product?.experienceId) && (
                    <Typography sx={{ fontFamily: 'Urbanist', color: '#666' }}>
                      Product ID: {details?.product?.bokunProductId || details?.product?.experienceId}
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        )}
      </Box>
    </>
  );
}


