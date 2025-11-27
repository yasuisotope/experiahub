'use client';

import { Box, Typography, Button } from '@mui/material';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
            bgcolor: '#f5f5f5',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              color: '#4A4A4A',
              fontFamily: 'Cormorant Garamond',
            }}
          >
            Something went wrong
          </Typography>
          <Button
            onClick={reset}
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: 'rgba(74, 124, 140, 0.9)',
              '&:hover': { bgcolor: 'rgba(74, 124, 140, 1)' },
            }}
          >
            Try again
          </Button>
        </Box>
      </body>
    </html>
  );
}