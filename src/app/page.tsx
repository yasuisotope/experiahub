'use client';

import { Box, Typography, Button } from '@mui/material';
import UserLayout from '@/components/layout/UserLayout';
import Link from 'next/link';
import BackgroundImage from '@/components/BackgroundImage';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isLoggedIn, isLoading } = useWordPressAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/chat');
    }
  }, [isLoggedIn, isLoading, router]);

  // Premium Fallback Image (Luxury Travel)
  const bgUrl = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

  return (
    <UserLayout>
      <BackgroundImage imageUrl={bgUrl} overlayOpacity={0.3}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            textAlign: 'center',
            p: 2
          }}
        >
          <Box
            sx={{
              p: 6,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              maxWidth: '600px',
              width: '100%'
            }}
          >
            <Typography variant="h2" component="h1" sx={{ color: '#FFFFFF', fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Experia
            </Typography>
            <Typography variant="h5" sx={{ color: '#F0F0F0', fontFamily: 'Nunito, sans-serif', fontWeight: 300, letterSpacing: '0.05em' }}>
              Your Personal Travel Assistant
            </Typography>
            
            <Link href="/chat" style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                fullWidth
                size="large"
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#010057',
                  px: 4,
                  py: 1.8,
                  borderRadius: '12px',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#F0F0F0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  },
                }}
              >
                Start Chatting
              </Button>
            </Link>
          </Box>
        </Box>
      </BackgroundImage>
    </UserLayout>
  );
}