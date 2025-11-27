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
        <Typography variant="h4" sx={{ color: '#4A4A4A', fontFamily: 'Cormorant Garamond' }}>
          Welcome to ExperiaHub
        </Typography>
        <Link href="/chat" style={{ textDecoration: 'none' }}>
          <Typography
            sx={{
              color: 'rgba(74, 124, 140, 0.9)',
              fontFamily: 'Urbanist',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Start Chatting
          </Typography>
        </Link>
      </Box>
    </MainLayout>
  );
}