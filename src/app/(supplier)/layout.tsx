'use client';
import SupplierLayout from '@/components/layout/SupplierLayout';

import { SupplierAuthProvider } from '@/contexts/SupplierAuthContext';

export default function SupplierGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupplierAuthProvider>
      <SupplierLayout>{children}</SupplierLayout>
    </SupplierAuthProvider>
  );
}
