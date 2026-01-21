'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/layout/UserLayout';

export default function NotFound() {
  const router = useRouter();

  return (
    <UserLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 32px)',
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            color: '#4A4A4A',
            fontFamily: 'Cormorant Garamond',
          }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            color: '#4A4A4A',
            fontFamily: 'Cormorant Garamond',
          }}
        >
          Page Not Found
        </Typography>
        <Typography
          sx={{
            mb: 4,
            color: '#666666',
            fontFamily: 'Nunito',
          }}
        >
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button
          onClick={() => router.push('/')}
          variant="contained"
          sx={{
            bgcolor: 'rgba(74, 124, 140, 0.9)',
            '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' },
            fontFamily: 'Nunito',
          }}
        >
          Return Home
        </Button>
      </Box>
    </UserLayout>
  );
}