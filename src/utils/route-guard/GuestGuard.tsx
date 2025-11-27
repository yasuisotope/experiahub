'use client';

import { useRouter } from 'next/navigation';

import { useEffect } from 'react';

// project imports
import useAuth from 'hooks/useAuth';
import { DASHBOARD_PATH } from 'config';
import Loader from 'ui-component/Loader';

// types
import { GuardProps } from 'types';

// ==============================|| GUEST GUARD ||============================== //

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */

export default function GuestGuard({ children }: GuardProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(DASHBOARD_PATH);
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) return <Loader />;

  return children;
}
