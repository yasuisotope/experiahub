import { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Chat - ExperiaHub',
  description: 'ExperiaHub AI Chat Interface'
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}