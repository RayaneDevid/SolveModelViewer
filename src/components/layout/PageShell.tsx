import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex h-full" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
