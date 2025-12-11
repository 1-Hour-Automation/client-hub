export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      call_logs: {
        Row: {
          call_time: string
          campaign_id: string
          client_id: string
          company: string | null
          contact_id: string | null
          contact_name: string
          created_at: string
          disposition: string
          id: string
          notes: string | null
          phone_number: string
        }
        Insert: {
          call_time?: string
          campaign_id: string
          client_id: string
          company?: string | null
          contact_id?: string | null
          contact_name: string
          created_at?: string
          disposition: string
          id?: string
          notes?: string | null
          phone_number: string
        }
        Update: {
          call_time?: string
          campaign_id?: string
          client_id?: string
          company?: string | null
          contact_id?: string | null
          contact_name?: string
          created_at?: string
          disposition?: string
          id?: string
          notes?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          bdr_assigned: string | null
          campaign_type: string | null
          candidate_onboarding_data: Json | null
          client_id: string
          created_at: string
          deleted_at: string | null
          id: string
          internal_notes: string | null
          name: string
          onboarding_bdr_notes: string | null
          onboarding_booking_instructions: string | null
          onboarding_common_objections: string | null
          onboarding_company_size_range: string | null
          onboarding_completed_at: string | null
          onboarding_compliance_notes: string | null
          onboarding_disqualifying_factors: string | null
          onboarding_example_ideal_companies: string | null
          onboarding_example_messaging: string | null
          onboarding_excluded_industries: string | null
          onboarding_industries_to_target: string | null
          onboarding_key_pain_points: string | null
          onboarding_locations_to_target: string | null
          onboarding_qualified_prospect_definition: string | null
          onboarding_recommended_responses: string | null
          onboarding_required_skills: string | null
          onboarding_scheduling_link: string | null
          onboarding_target_job_titles: string | null
          onboarding_target_timezone: string | null
          onboarding_unique_differentiator: string | null
          onboarding_value_proposition: string | null
          performance_fee_per_meeting: number | null
          performance_start_date: string | null
          phase: string
          quarterly_attended_meeting_guarantee: number | null
          sprint_campaign_id: string | null
          status: string
          target: string | null
          tier: string | null
        }
        Insert: {
          bdr_assigned?: string | null
          campaign_type?: string | null
          candidate_onboarding_data?: Json | null
          client_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          onboarding_bdr_notes?: string | null
          onboarding_booking_instructions?: string | null
          onboarding_common_objections?: string | null
          onboarding_company_size_range?: string | null
          onboarding_completed_at?: string | null
          onboarding_compliance_notes?: string | null
          onboarding_disqualifying_factors?: string | null
          onboarding_example_ideal_companies?: string | null
          onboarding_example_messaging?: string | null
          onboarding_excluded_industries?: string | null
          onboarding_industries_to_target?: string | null
          onboarding_key_pain_points?: string | null
          onboarding_locations_to_target?: string | null
          onboarding_qualified_prospect_definition?: string | null
          onboarding_recommended_responses?: string | null
          onboarding_required_skills?: string | null
          onboarding_scheduling_link?: string | null
          onboarding_target_job_titles?: string | null
          onboarding_target_timezone?: string | null
          onboarding_unique_differentiator?: string | null
          onboarding_value_proposition?: string | null
          performance_fee_per_meeting?: number | null
          performance_start_date?: string | null
          phase?: string
          quarterly_attended_meeting_guarantee?: number | null
          sprint_campaign_id?: string | null
          status?: string
          target?: string | null
          tier?: string | null
        }
        Update: {
          bdr_assigned?: string | null
          campaign_type?: string | null
          candidate_onboarding_data?: Json | null
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          onboarding_bdr_notes?: string | null
          onboarding_booking_instructions?: string | null
          onboarding_common_objections?: string | null
          onboarding_company_size_range?: string | null
          onboarding_completed_at?: string | null
          onboarding_compliance_notes?: string | null
          onboarding_disqualifying_factors?: string | null
          onboarding_example_ideal_companies?: string | null
          onboarding_example_messaging?: string | null
          onboarding_excluded_industries?: string | null
          onboarding_industries_to_target?: string | null
          onboarding_key_pain_points?: string | null
          onboarding_locations_to_target?: string | null
          onboarding_qualified_prospect_definition?: string | null
          onboarding_recommended_responses?: string | null
          onboarding_required_skills?: string | null
          onboarding_scheduling_link?: string | null
          onboarding_target_job_titles?: string | null
          onboarding_target_timezone?: string | null
          onboarding_unique_differentiator?: string | null
          onboarding_value_proposition?: string | null
          performance_fee_per_meeting?: number | null
          performance_start_date?: string | null
          phase?: string
          quarterly_attended_meeting_guarantee?: number | null
          sprint_campaign_id?: string | null
          status?: string
          target?: string | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_sprint_campaign_id_fkey"
            columns: ["sprint_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_manager: string | null
          bdr_assigned: string | null
          best_times: string | null
          billing_address: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          billing_notes: string | null
          calling_hours: string | null
          calling_timezone: string | null
          campaign_start_date: string | null
          client_notes: string | null
          created_at: string
          current_plan: string | null
          id: string
          invoice_method: string | null
          invoicing_frequency: string | null
          last_updated_at: string | null
          last_updated_by: string | null
          legal_business_name: string | null
          meeting_link: string | null
          name: string
          performance_tier: string | null
          phase_history: Json | null
          preferred_channel: string | null
          preferred_currency: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_title: string | null
          quarterly_attendance_guarantee: number | null
          registered_address: string | null
          registration_number: string | null
          secondary_contacts: Json | null
          sending_email_address: string | null
          team_members_with_access: Json | null
          timezone: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          account_manager?: string | null
          bdr_assigned?: string | null
          best_times?: string | null
          billing_address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          billing_notes?: string | null
          calling_hours?: string | null
          calling_timezone?: string | null
          campaign_start_date?: string | null
          client_notes?: string | null
          created_at?: string
          current_plan?: string | null
          id?: string
          invoice_method?: string | null
          invoicing_frequency?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          legal_business_name?: string | null
          meeting_link?: string | null
          name: string
          performance_tier?: string | null
          phase_history?: Json | null
          preferred_channel?: string | null
          preferred_currency?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          quarterly_attendance_guarantee?: number | null
          registered_address?: string | null
          registration_number?: string | null
          secondary_contacts?: Json | null
          sending_email_address?: string | null
          team_members_with_access?: Json | null
          timezone?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          account_manager?: string | null
          bdr_assigned?: string | null
          best_times?: string | null
          billing_address?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          billing_notes?: string | null
          calling_hours?: string | null
          calling_timezone?: string | null
          campaign_start_date?: string | null
          client_notes?: string | null
          created_at?: string
          current_plan?: string | null
          id?: string
          invoice_method?: string | null
          invoicing_frequency?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          legal_business_name?: string | null
          meeting_link?: string | null
          name?: string
          performance_tier?: string | null
          phase_history?: Json | null
          preferred_channel?: string | null
          preferred_currency?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          quarterly_attendance_guarantee?: number | null
          registered_address?: string | null
          registration_number?: string | null
          secondary_contacts?: Json | null
          sending_email_address?: string | null
          team_members_with_access?: Json | null
          timezone?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          campaign_id: string | null
          client_id: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          campaign_id?: string | null
          client_id: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          campaign_id?: string | null
          client_id?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          campaign_id: string | null
          client_id: string
          contact_id: string | null
          created_at: string
          id: string
          scheduled_for: string | null
          status: string
          title: string
        }
        Insert: {
          campaign_id?: string | null
          client_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string | null
          status?: string
          title: string
        }
        Update: {
          campaign_id?: string | null
          client_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          campaign_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          requires_client_action: boolean
          resolved_at: string | null
          severity: string
          status: string
          title: string
          type: string
          visible_to_client: boolean
        }
        Insert: {
          body: string
          campaign_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          requires_client_action?: boolean
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          type: string
          visible_to_client?: boolean
        }
        Update: {
          body?: string
          campaign_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          requires_client_action?: boolean
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          type?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          client_id: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "bdr" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "bdr", "client"],
    },
  },
} as const
