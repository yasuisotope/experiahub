'use client';

import React from 'react';
import Box from '@mui/material/Box';

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
      <img
        src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
        alt="ExperiaHub Logo"
        style={{ height: 'auto', width: '100%', maxWidth: '180px' }}
      />
    </div>
  );
}
