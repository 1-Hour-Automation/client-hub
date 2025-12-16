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
  clientId?: string;
}

export function AppLayout({ children, sidebarItems, clientName, clientId }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar clientName={clientName} clientId={clientId} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
