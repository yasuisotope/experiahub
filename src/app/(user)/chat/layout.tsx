import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Chat - ExperiaHub',
  description: 'ExperiaHub AI Chat Interface'
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Layout is handled by (user)/layout.tsx
  return <>{children}</>;
}