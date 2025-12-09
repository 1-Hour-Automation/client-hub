import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  clientName?: string;
}

export function AppLayout({ children, sidebarItems, clientName }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar clientName={clientName} />
      <div className="flex">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
