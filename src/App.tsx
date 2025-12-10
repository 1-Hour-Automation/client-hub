import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AdminGuard, WorkspaceGuard } from "@/components/guards/RoleGuard";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminUsers from "./pages/admin/AdminUsers";
import WorkspaceDashboard from "./pages/workspace/WorkspaceDashboard";
import WorkspaceCampaigns from "./pages/workspace/WorkspaceCampaigns";
import WorkspaceCallLog from "./pages/workspace/WorkspaceCallLog";
import WorkspaceContacts from "./pages/workspace/WorkspaceContacts";
import WorkspaceMeetings from "./pages/workspace/WorkspaceMeetings";
import WorkspaceCampaignView from "./pages/workspace/WorkspaceCampaignView";
import WorkspaceNotifications from "./pages/workspace/WorkspaceNotifications";
import WorkspaceAccountProfile from "./pages/workspace/WorkspaceAccountProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected index - handles role-based redirect */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/clients" element={
              <ProtectedRoute>
                <AdminGuard>
                  <AdminClients />
                </AdminGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminGuard>
                  <AdminUsers />
                </AdminGuard>
              </ProtectedRoute>
            } />

            {/* Workspace routes */}
            <Route path="/workspace/:clientId/dashboard" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceDashboard />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/campaigns" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceCampaigns />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/campaigns/:campaignId" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceCampaignView />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/call-log" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceCallLog />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/contacts" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceContacts />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/meetings" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceMeetings />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/account-profile" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceAccountProfile />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:clientId/notifications" element={
              <ProtectedRoute>
                <WorkspaceGuard>
                  <WorkspaceNotifications />
                </WorkspaceGuard>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
