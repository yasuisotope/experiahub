'use client';

import React, { useEffect } from 'react';
import Box from '@/components/ui/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
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
        Something went wrong!
      </Typography>
      <Button
        onClick={reset}
        variant="contained"
        sx={{
          bgcolor: 'rgba(74, 124, 140, 0.9)',
          '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' },
          fontFamily: 'Nunito',
          mt: 2,
        }}
      >
        Try again
      </Button>
      {error?.message && (
        <Typography variant="body2" sx={{ mt: 2, color: '#6b7780' }}>
          {String(error.message)}
        </Typography>
      )}
    </Box>
  );
}