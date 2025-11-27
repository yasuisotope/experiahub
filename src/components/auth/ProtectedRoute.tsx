'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useWordPressAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const nextTarget = useMemo(() => {
    const qs = params?.toString();
    const path = pathname || '/';
    return path + (qs ? `?${qs}` : '');
  }, [pathname, params]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      const enc = encodeURIComponent(nextTarget);
      try { localStorage.setItem('post_login_target', nextTarget); } catch {}
      router.replace(`/login?next=${enc}`);
    }
  }, [isLoggedIn, isLoading, router, nextTarget]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isLoggedIn ? children : null;
}