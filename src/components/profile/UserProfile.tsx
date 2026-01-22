'use client';

import React from 'react';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Divider,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';

export default function UserProfile() {
  const { user, logout } = useWordPressAuth();

  // WordPress profile edit URL
  const wpProfileUrl = 'https://experiahub.com/wp-admin/profile.php';

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: '#010057',
            mr: 2
          }}
        >
          {user?.display_name?.[0] || user?.email?.[0]}
        </Avatar>
        <Box>
          <Typography variant="h5" component="h1">
            {user?.display_name || 'User'}
          </Typography>
          <Typography color="textSecondary">
            {user?.email}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="outlined"
          component="a"
          href={wpProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#010057',
            borderColor: 'rgba(1,0,87,0.5)',
            textTransform: 'none',
            borderRadius: '12px',
            '&:hover': {
              borderColor: '#010057',
              bgcolor: 'rgba(1,0,87,0.05)'
            }
          }}
        >
          Edit Profile
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={logout}
          sx={{ mt: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Paper>
  );
}