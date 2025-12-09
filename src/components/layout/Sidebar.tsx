import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Contact, 
  Calendar,
  UserCog,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-card h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export const adminSidebarItems: SidebarItem[] = [
  { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'User Management', href: '/admin/users', icon: UserCog },
];

export const workspaceSidebarItems = (clientId: string): SidebarItem[] => [
  { label: 'Dashboard', href: `/workspace/${clientId}/dashboard`, icon: LayoutDashboard },
  { label: 'Campaigns', href: `/workspace/${clientId}/campaigns`, icon: Megaphone },
  { label: 'Contacts', href: `/workspace/${clientId}/contacts`, icon: Contact },
  { label: 'Meetings', href: `/workspace/${clientId}/meetings`, icon: Calendar },
];
