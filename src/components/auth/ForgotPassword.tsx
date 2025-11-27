'use client';

import React from 'react';
import { Button, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

interface ForgotPasswordProps {
  className?: string;
}

export default function ForgotPassword({ className }: ForgotPasswordProps) {
  // WordPress lost password URL
  const wpLostPasswordUrl = 'https://experiahub.com/wp-login.php?action=lostpassword';

  return (
    <div className={className}>
      <MuiLink
        component={Link}
        href={wpLostPasswordUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          textDecoration: 'none',
          color: 'rgba(74, 124, 140, 0.9)',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        Forgot your password?
      </MuiLink>
    </div>
  );
}