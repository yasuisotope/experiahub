'use client';
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

const Error404 = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: 3
      }}
    >
      <Typography variant="h1" sx={{ mb: 2, color: '#ffb76b' }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: '#666', textAlign: 'center' }}>
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" component={Link} href="/">
        Back to Home
      </Button>
    </Box>
  );
};

export default Error404;