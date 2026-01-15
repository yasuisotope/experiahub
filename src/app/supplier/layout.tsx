import { SupplierAuthProvider } from '@/contexts/SupplierAuthContext';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupplierAuthProvider>
      {children}
    </SupplierAuthProvider>
  );
}


