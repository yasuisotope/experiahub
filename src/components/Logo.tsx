'use client';
import Image from 'next/image';
import { Box } from '@mui/material';

export default function Logo() {
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Image
        src="/images/logo.png"
        alt="ExperiaHub Logo"
        width={240}
        height={120}
        style={{
          objectFit: 'contain',
          width: '100%',
          height: '100%'
        }}
        priority
      />
    </Box>
  );
}