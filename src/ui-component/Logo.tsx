'use client';

import React from 'react';
import Box from '@mui/material/Box';

export default function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src="https://res.cloudinary.com/dasahamyc/image/upload/v1726650965/ExperiaHub_Logo_Primary_v3_dark_z9x8qa.png"
        alt="ExperiaHub Logo"
        style={{ height: 'auto', width: '100%', maxWidth: '180px' }}
      />
    </Box>
  );
}
