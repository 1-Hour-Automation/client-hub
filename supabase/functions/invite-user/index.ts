import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  name?: string;
  role: string;
  workspaceIds: string[];
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !requestingUser) {
      console.log("Failed to get requesting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: hasAdminRole } = await userClient.rpc("has_role", {
      _user_id: requestingUser.id,
      _role: "admin",
    });

    if (!hasAdminRole) {
      console.log("User is not an admin:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: "Only admins can invite users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, name, role, workspaceIds }: InviteUserRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Inviting user: ${email} with role: ${role}`);

    // Create admin client for user management
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Invite the user via Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: name || email.split("@")[0],
        invited_role: role,
        invited_workspace_ids: workspaceIds,
      },
    });

    if (inviteError) {
      console.error("Failed to invite user:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User invited successfully:", inviteData.user?.id);

    // If user was created, set up their role and workspace
    if (inviteData.user) {
      const userId = inviteData.user.id;

      // Map 'am' role to 'bdr' since AM is effectively a BDR role
      const dbRole = role === "am" ? "bdr" : role;
      
      // Only add role if it's a valid app_role
      if (["admin", "bdr", "client"].includes(dbRole)) {
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role: dbRole });

        if (roleError) {
          console.error("Failed to assign role:", roleError);
        } else {
          console.log(`Assigned role ${dbRole} to user ${userId}`);
        }
      }

      // Assign first workspace if any selected and user has client role
      if (workspaceIds.length > 0 && (role === "client" || role === "am")) {
        const { error: profileError } = await adminClient
          .from("user_profiles")
          .update({ client_id: workspaceIds[0] })
          .eq("id", userId);

        if (profileError) {
          console.error("Failed to assign workspace:", profileError);
        } else {
          console.log(`Assigned workspace ${workspaceIds[0]} to user ${userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        userId: inviteData.user?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
