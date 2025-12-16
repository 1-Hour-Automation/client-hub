import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Contact, 
  Calendar,
  UserCog,
  PhoneCall,
  Bell,
  UserCircle,
  Clock,
  Plug,
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
    <aside className="w-64 border-r border-border bg-card shrink-0 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
  { label: 'Scheduling', href: '/admin/scheduling', icon: Clock },
];

export const workspaceSidebarItems = (clientId: string): SidebarItem[] => [
  { label: 'Dashboard', href: `/workspace/${clientId}/dashboard`, icon: LayoutDashboard },
  { label: 'Campaigns', href: `/workspace/${clientId}/campaigns`, icon: Megaphone },
  { label: 'Call Log', href: `/workspace/${clientId}/call-log`, icon: PhoneCall },
  { label: 'Contacts', href: `/workspace/${clientId}/contacts`, icon: Contact },
  { label: 'Meetings', href: `/workspace/${clientId}/meetings`, icon: Calendar },
  { label: 'Integrations', href: `/workspace/${clientId}/integrations`, icon: Plug },
  { label: 'Account Profile', href: `/workspace/${clientId}/account-profile`, icon: UserCircle },
  { label: 'Notifications', href: `/workspace/${clientId}/notifications`, icon: Bell },
];
