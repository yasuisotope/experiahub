'use client';

import { Box, Typography } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function HomePage() {
  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 32px)',
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          gap: 2,
        }}
      >
        <Typography variant="h3" component="h1" sx={{ color: '#010057', fontFamily: 'Playfair Display', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Experia
        </Typography>
        <Typography variant="h6" sx={{ color: '#555', fontFamily: 'Inter', fontWeight: 400, mb: 2 }}>
          Your personal travel assistant
        </Typography>
        <Link href="/chat" style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              bgcolor: '#4A7C8C',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '24px',
              fontFamily: 'Inter',
              fontWeight: 500,
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: '#3A6370',
              },
            }}
          >
            Start Chatting
          </Box>
        </Link>
      </Box>
    </MainLayout>
  );
}