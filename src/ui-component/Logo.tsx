'use client';

import React from 'react';
import Box from '@mui/material/Box';

export default function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
      <img
        src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
        alt="ExperiaHub Logo"
        style={{ height: '32px', width: 'auto' }}
      />
    </Box>
  );
}
