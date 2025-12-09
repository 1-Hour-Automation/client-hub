import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isInternalUser, isLoading, clientId } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not internal user (admin/bdr), redirect to their workspace
  if (!isInternalUser) {
    if (clientId) {
      return <Navigate to={`/workspace/${clientId}/dashboard`} replace />;
    }
    // No client assigned, show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have access to this area.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface WorkspaceGuardProps {
  children: ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { isInternalUser, isLoading, clientId } = useAuth();
  const { clientId: routeClientId } = useParams<{ clientId: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Internal users can access any workspace
  if (isInternalUser) {
    return <>{children}</>;
  }

  // Client users can only access their own workspace
  if (clientId && routeClientId === clientId) {
    return <>{children}</>;
  }

  // Redirect client to their own workspace
  if (clientId) {
    return <Navigate to={`/workspace/${clientId}/dashboard`} replace />;
  }

  // No client assigned
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">No Workspace Assigned</h1>
        <p className="text-muted-foreground">Please contact your administrator.</p>
      </div>
    </div>
  );
}
