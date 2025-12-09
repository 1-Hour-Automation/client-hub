import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user, isInternalUser, clientId, isLoading, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // Wait for roles to load
    if (roles.length === 0) {
      // User exists but no roles yet - they may need to be assigned
      // For now, show a message
      return;
    }

    // Redirect based on role
    if (isInternalUser) {
      navigate('/admin/dashboard');
    } else if (clientId) {
      navigate(`/workspace/${clientId}/dashboard`);
    }
  }, [user, isInternalUser, clientId, isLoading, roles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If user is logged in but has no roles assigned
  if (user && roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-xl font-semibold text-foreground mb-2">Welcome to CallFlow Portal</h1>
          <p className="text-muted-foreground">
            Your account has been created. Please wait for an administrator to assign you a role 
            and workspace access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}
