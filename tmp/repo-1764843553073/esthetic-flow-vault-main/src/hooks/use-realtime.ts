import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to subscribe to realtime updates for a specific table
 * Automatically invalidates React Query cache when changes occur
 */
export function useRealtimeSubscription(
  table: string,
  queryKey: string | string[],
  options?: {
    onInsert?: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    onDelete?: (payload: any) => void;
    showToasts?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const { onInsert, onUpdate, onDelete, showToasts = false } = options || {};

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        (payload) => {
          if (showToasts) {
            toast.success(`New ${table.slice(0, -1)} added`);
          }
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
          onInsert?.(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table },
        (payload) => {
          if (showToasts) {
            toast.info(`${table.slice(0, -1)} updated`);
          }
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
          onUpdate?.(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table },
        (payload) => {
          if (showToasts) {
            toast.error(`${table.slice(0, -1)} deleted`);
          }
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
          onDelete?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, queryClient, onInsert, onUpdate, onDelete, showToasts]);
}

/**
 * Hook to set up all critical realtime subscriptions for the clinic portal
 * This ensures all data stays in sync across sessions
 */
export function useClinicRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to patients table
    const patientsChannel = supabase
      .channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patients"] });
        queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      })
      .subscribe();

    // Subscribe to treatments table
    const treatmentsChannel = supabase
      .channel("treatments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "treatments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["treatments"] });
        queryClient.invalidateQueries({ queryKey: ["patient-treatments"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        queryClient.invalidateQueries({ queryKey: ["treatment-trends"] });
        queryClient.invalidateQueries({ queryKey: ["recent-treatments"] });
        queryClient.invalidateQueries({ queryKey: ["treatment-report"] });
        queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      })
      .subscribe();

    // Subscribe to implants table
    const implantsChannel = supabase
      .channel("implants-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "implants" }, () => {
        queryClient.invalidateQueries({ queryKey: ["implants"] });
        queryClient.invalidateQueries({ queryKey: ["patient-implants"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      })
      .subscribe();

    // Subscribe to inventory table
    const inventoryChannel = supabase
      .channel("inventory-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        queryClient.invalidateQueries({ queryKey: ["alerts-feed"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-report"] });
      })
      .subscribe();

    // Subscribe to appointments table
    const appointmentsChannel = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["today-schedule"] });
        queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      })
      .subscribe();

    // Subscribe to documents table
    const documentsChannel = supabase
      .channel("documents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-documents"] });
      })
      .subscribe();

    // Subscribe to treatment_photos table
    const photosChannel = supabase
      .channel("treatment_photos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "treatment_photos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-photos"] });
      })
      .subscribe();

    // Subscribe to treatment_templates table
    const templatesChannel = supabase
      .channel("treatment_templates-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "treatment_templates" }, () => {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(treatmentsChannel);
      supabase.removeChannel(implantsChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(photosChannel);
      supabase.removeChannel(templatesChannel);
    };
  }, [queryClient]);
}

/**
 * Hook to set up realtime subscriptions for patient portal
 */
export function usePatientRealtimeSubscriptions(patientId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!patientId) return;

    // Subscribe to patient's own data
    const patientChannel = supabase
      .channel(`patient-${patientId}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients", filter: `id=eq.${patientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-profile", patientId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treatments", filter: `patient_id=eq.${patientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-treatments", patientId] });
          queryClient.invalidateQueries({ queryKey: ["patient-records", patientId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "implants", filter: `patient_id=eq.${patientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-implants", patientId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `patient_id=eq.${patientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${patientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientChannel);
    };
  }, [patientId, queryClient]);
}

