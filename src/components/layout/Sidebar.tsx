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
  Rows3,
  HelpCircle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: 'main' | 'support';
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const mainItems = items.filter(item => item.section !== 'support');
  const supportItems = items.filter(item => item.section === 'support');

  return (
    <aside className="w-64 border-r border-border bg-card shrink-0 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {mainItems.map((item) => (
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

        {supportItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Support
            </p>
            {supportItems.map((item) => (
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
          </>
        )}
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

// Client-facing workspace navigation
export const workspaceSidebarItems = (clientId: string): SidebarItem[] => [
  { label: 'Overview', href: `/workspace/${clientId}/overview`, icon: LayoutDashboard },
  { label: 'Lanes', href: `/workspace/${clientId}/lanes`, icon: Rows3 },
  { label: 'Meetings', href: `/workspace/${clientId}/meetings`, icon: Calendar },
  { label: 'Campaigns', href: `/workspace/${clientId}/campaigns`, icon: Megaphone },
  { label: 'Client Info', href: `/workspace/${clientId}/client-info`, icon: UserCircle, section: 'support' },
];

// Internal-only workspace navigation (for admin/BDR access to internal pages)
export const internalWorkspaceSidebarItems = (clientId: string): SidebarItem[] => [
  { label: 'Overview', href: `/workspace/${clientId}/overview`, icon: LayoutDashboard },
  { label: 'Lanes', href: `/workspace/${clientId}/lanes`, icon: Rows3 },
  { label: 'Meetings', href: `/workspace/${clientId}/meetings`, icon: Calendar },
  { label: 'Campaigns', href: `/workspace/${clientId}/campaigns`, icon: Megaphone },
  { label: 'Call Log', href: `/workspace/${clientId}/call-log`, icon: PhoneCall },
  { label: 'Contacts', href: `/workspace/${clientId}/contacts`, icon: Contact },
  { label: 'Integrations', href: `/workspace/${clientId}/integrations`, icon: Plug },
  { label: 'Notifications', href: `/workspace/${clientId}/notifications`, icon: Bell },
  { label: 'Client Info', href: `/workspace/${clientId}/client-info`, icon: UserCircle, section: 'support' },
  { label: 'Account Profile', href: `/workspace/${clientId}/account-profile`, icon: UserCircle, section: 'support' },
];
