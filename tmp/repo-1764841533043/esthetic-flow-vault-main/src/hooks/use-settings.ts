import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================
// Clinic Settings
// ============================================

interface ClinicSettings {
  id: string;
  clinic_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  website: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

async function fetchClinicSettings(): Promise<ClinicSettings | null> {
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function useClinicSettings() {
  return useQuery({
    queryKey: ["clinic-settings"],
    queryFn: fetchClinicSettings,
  });
}

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<ClinicSettings>) => {
      const { data: existing } = await supabase
        .from("clinic_settings")
        .select("id")
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("clinic_settings")
          .update(settings)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // If no settings exist, insert new
      const { data, error } = await supabase
        .from("clinic_settings")
        .insert([settings as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      toast.success("Clinic settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}

// ============================================
// Staff Management
// ============================================

interface Staff {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });
}

export function useAddStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: Omit<Staff, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("staff")
        .insert(staff)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add staff: ${error.message}`);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Staff> & { id: string }) => {
      const { data, error } = await supabase
        .from("staff")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update staff: ${error.message}`);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove staff: ${error.message}`);
    },
  });
}

// ============================================
// Notification Preferences
// ============================================

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_appointments: boolean;
  email_reminders: boolean;
  email_inventory_alerts: boolean;
  email_reports: boolean;
  sms_appointments: boolean;
  sms_reminders: boolean;
  in_app_all: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: fetchNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("notification_preferences")
          .update(prefs)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Insert new preferences
      const { data, error } = await supabase
        .from("notification_preferences")
        .insert({ ...prefs, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });
}

// ============================================
// Audit Log
// ============================================

interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string | null;
  changed_at: string;
  old_data: any;
  new_data: any;
}

async function fetchAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export function useAuditLog(limit = 100) {
  return useQuery({
    queryKey: ["audit-log", limit],
    queryFn: () => fetchAuditLog(limit),
  });
}

