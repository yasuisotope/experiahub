'use client';

import React from 'react';
import { Box, IconButton, Typography, Stack, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BokunBookingWidget from '@/components/BokunBookingWidget';

interface BookingOverlayProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  experienceTitle?: string;
}

export default function BookingOverlay({
  open,
  onClose,
  productId,
  experienceTitle
}: BookingOverlayProps) {
  // We use a custom Box with transition instead of MUI Drawer for more precise "2/3" control and premium styling
  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Sliding Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: { xs: '100%', md: '66.6%' },
          height: '100dvh',
          bgcolor: '#fff',
          zIndex: 3001,
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack spacing={0.5}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                color: '#010057',
              }}
            >
              Secure Booking
            </Typography>
            {experienceTitle && (
              <Typography
                sx={{
                  fontFamily: 'Nunito',
                  fontSize: '0.9rem',
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                {experienceTitle}
              </Typography>
            )}
          </Stack>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#010057',
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            p: { xs: 0, sm: 2 },
            bgcolor: '#fcfcfc',
            // Custom scrollbar
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#bbb' },
          }}
        >
          {productId ? (
            <BokunBookingWidget
              productId={productId}
              height="calc(100dvh - 120px)"
              source="overlay"
            />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={30} sx={{ color: '#010057' }} />
              <Typography sx={{ mt: 2, fontFamily: 'Nunito', color: '#666' }}>
                Preparing checkout...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer info/badges */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            textAlign: 'center',
            bgcolor: '#fff',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Nunito',
              fontSize: '0.75rem',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            Powered by Bokun & Stripe • 256-bit SSL Secure Checkout
          </Typography>
        </Box>
      </Box>
    </>
  );
}
