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
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          provider_id: string | null
          reminder_sent: boolean | null
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          provider_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          city: string | null
          clinic_name: string
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          state: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          clinic_name: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          clinic_name?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          patient_id: string
          storage_path: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          patient_id: string
          storage_path: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          patient_id?: string
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      implants: {
        Row: {
          body_side: string | null
          created_at: string | null
          device_name: string
          id: string
          implant_date: string
          lot_number: string
          manufacturer: string
          model_number: string | null
          patient_id: string
          serial_number: string | null
          udi: string | null
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          body_side?: string | null
          created_at?: string | null
          device_name: string
          id?: string
          implant_date: string
          lot_number: string
          manufacturer: string
          model_number?: string | null
          patient_id: string
          serial_number?: string | null
          udi?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          body_side?: string | null
          created_at?: string | null
          device_name?: string
          id?: string
          implant_date?: string
          lot_number?: string
          manufacturer?: string
          model_number?: string | null
          patient_id?: string
          serial_number?: string | null
          udi?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implants_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          added_at: string | null
          expiration_date: string
          id: string
          lot_number: string
          manufacturer: string | null
          product_name: string
          units_available: number
        }
        Insert: {
          added_at?: string | null
          expiration_date: string
          id?: string
          lot_number: string
          manufacturer?: string | null
          product_name: string
          units_available?: number
        }
        Update: {
          added_at?: string | null
          expiration_date?: string
          id?: string
          lot_number?: string
          manufacturer?: string | null
          product_name?: string
          units_available?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_appointments: boolean | null
          email_inventory_alerts: boolean | null
          email_reminders: boolean | null
          email_reports: boolean | null
          id: string
          in_app_all: boolean | null
          sms_appointments: boolean | null
          sms_reminders: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_appointments?: boolean | null
          email_inventory_alerts?: boolean | null
          email_reminders?: boolean | null
          email_reports?: boolean | null
          id?: string
          in_app_all?: boolean | null
          sms_appointments?: boolean | null
          sms_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_appointments?: boolean | null
          email_inventory_alerts?: boolean | null
          email_reminders?: boolean | null
          email_reports?: boolean | null
          id?: string
          in_app_all?: boolean | null
          sms_appointments?: boolean | null
          sms_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          patient_id: string | null
          phone: string | null
          preferences: Json | null
          push_token: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          patient_id?: string | null
          phone?: string | null
          preferences?: Json | null
          push_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          patient_id?: string | null
          phone?: string | null
          preferences?: Json | null
          push_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_users_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          medical_history: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clinic_name: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          specialties: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clinic_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          specialties?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clinic_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          specialties?: string[] | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      treatment_photos: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          patient_id: string
          photo_type: string
          storage_path: string
          taken_at: string | null
          treatment_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          patient_id: string
          photo_type: string
          storage_path: string
          taken_at?: string | null
          treatment_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          photo_type?: string
          storage_path?: string
          taken_at?: string | null
          treatment_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_photos_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_templates: {
        Row: {
          areas: Json
          created_at: string | null
          created_by: string | null
          default_units: number | null
          id: string
          name: string
        }
        Insert: {
          areas: Json
          created_at?: string | null
          created_by?: string | null
          default_units?: number | null
          id?: string
          name: string
        }
        Update: {
          areas?: Json
          created_at?: string | null
          created_by?: string | null
          default_units?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          after_photos: string[] | null
          areas_treated: string[] | null
          before_photos: string[] | null
          created_at: string | null
          id: string
          lot_number: string | null
          notes: string | null
          patient_id: string
          product_name: string | null
          provider_id: string | null
          treatment_date: string
          treatment_type: string
          units_used: number | null
          updated_at: string | null
        }
        Insert: {
          after_photos?: string[] | null
          areas_treated?: string[] | null
          before_photos?: string[] | null
          created_at?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          patient_id: string
          product_name?: string | null
          provider_id?: string | null
          treatment_date: string
          treatment_type: string
          units_used?: number | null
          updated_at?: string | null
        }
        Update: {
          after_photos?: string[] | null
          areas_treated?: string[] | null
          before_photos?: string[] | null
          created_at?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          patient_id?: string
          product_name?: string | null
          provider_id?: string | null
          treatment_date?: string
          treatment_type?: string
          units_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      create_control_check_notifications: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "clinic_admin"
        | "provider"
        | "assistant"
        | "read_only"
        | "patient"
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
      app_role: [
        "clinic_admin",
        "provider",
        "assistant",
        "read_only",
        "patient",
      ],
    },
  },
} as const
