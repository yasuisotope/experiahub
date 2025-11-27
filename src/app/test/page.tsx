'use client';

import { Box, Typography } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';

export default function TestPage() {
  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 32px)',
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Typography variant="h4" sx={{ color: '#4A4A4A', fontFamily: 'Cormorant Garamond' }}>
          Test Page Works!
        </Typography>
      </Box>
    </MainLayout>
  );
}