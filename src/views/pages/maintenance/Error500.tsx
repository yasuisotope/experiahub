'use client';
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

const Error500 = () => {
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
      <Typography variant="h1" sx={{ mb: 2, color: '#d32f2f' }}>
        500
      </Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Internal Server Error
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: '#666', textAlign: 'center' }}>
        Something went wrong on our end. Please try again later.
      </Typography>
      <Button variant="contained" component={Link} href="/">
        Back to Home
      </Button>
    </Box>
  );
};

export default Error500;