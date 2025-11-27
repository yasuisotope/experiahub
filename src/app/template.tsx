'use client';

import { Box } from '@mui/material';

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ margin: 0, minHeight: '100vh' }}>
      {children}
    </Box>
  );
}