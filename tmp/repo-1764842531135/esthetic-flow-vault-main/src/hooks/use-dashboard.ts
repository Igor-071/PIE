import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardMetrics {
  activePatients: number;
  treatmentsThisWeek: number;
  upcomingThisWeek: number;
  productsInStock: number;
  lowStock: number;
  expiringSoon: number;
  newPatientsThisMonth: number;
}

export interface ScheduleItem {
  id: string;
  patientName: string;
  treatmentType: string;
  time: string;
  status: "scheduled" | "preparing" | "follow_up";
}

export interface TodayScheduleData {
  appointments: ScheduleItem[];
  followUps: ScheduleItem[];
}

export interface QuickAction {
  label: string;
  description: string;
  action: "new_patient" | "book_treatment" | "reorder_stock" | "build_template";
  href: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  type: "inventory" | "notification";
  severity: "high" | "medium" | "low";
  timestamp: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export interface TreatmentRecord {
  id: string;
  treatment_date: string;
  treatment_type: string;
}

const startOfWeekISO = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
};

const endOfWeekISO = () => {
  const start = new Date(startOfWeekISO());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end.toISOString();
};

const startOfMonthISO = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const todayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

const inThirtyDaysISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
};

const inSevenDaysISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const [{ count: patientCount }, { count: newPatientsCount }] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonthISO()),
  ]);

  const [
    { count: treatmentsThisWeek },
    { count: upcomingThisWeek },
    { count: productsInStock },
    { count: lowStock },
    { count: expiringSoon },
  ] = await Promise.all([
    supabase
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .gte("treatment_date", startOfWeekISO())
      .lt("treatment_date", endOfWeekISO()),
    supabase
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .gte("treatment_date", todayBounds().start)
      .lt("treatment_date", inSevenDaysISO()),
    supabase.from("inventory").select("*", { count: "exact", head: true }),
    supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .lt("units_available", 5),
    supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .lte("expiration_date", inThirtyDaysISO()),
  ]);

  return {
    activePatients: patientCount || 0,
    newPatientsThisMonth: newPatientsCount || 0,
    treatmentsThisWeek: treatmentsThisWeek || 0,
    upcomingThisWeek: upcomingThisWeek || 0,
    productsInStock: productsInStock || 0,
    lowStock: lowStock || 0,
    expiringSoon: expiringSoon || 0,
  };
};

const fetchTreatmentTrends = async (): Promise<TreatmentRecord[]> => {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);

  const { data, error } = await supabase
    .from("treatments")
    .select("id, treatment_date, treatment_type")
    .gte("treatment_date", start.toISOString());

  if (error) throw error;

  return data ?? [];
};

const fetchTodaySchedule = async (userId: string | null): Promise<TodayScheduleData> => {
  const { start, end } = todayBounds();
  const { data, error } = await supabase
    .from("treatments")
    .select(
      `
        id,
        treatment_date,
        treatment_type,
        patients:patient_id (
          first_name,
          last_name
        )
      `
    )
    .gte("treatment_date", start)
    .lt("treatment_date", end)
    .order("treatment_date", { ascending: true });

  if (error) throw error;

  const appointments: ScheduleItem[] = (data || []).map((item) => ({
    id: item.id,
    patientName: `${item.patients?.first_name ?? "Patient"} ${item.patients?.last_name ?? ""}`.trim(),
    treatmentType: item.treatment_type,
    time: formatTime(item.treatment_date),
    status: "scheduled",
  }));

  let followUps: ScheduleItem[] = [];
  if (userId) {
    const { data: followUpNotifications, error: followUpError } = await supabase
      .from("notifications")
      .select("id, title, message, created_at")
      .eq("user_id", userId)
      .eq("type", "control_check")
      .eq("is_read", false)
      .order("created_at", { ascending: true })
      .limit(5);

    if (followUpError) throw followUpError;

    followUps =
      followUpNotifications?.map((item) => ({
        id: item.id,
        patientName: item.title,
        treatmentType: item.message,
        time: formatTime(item.created_at),
        status: "follow_up",
      })) ?? [];
  }

  return { appointments, followUps };
};

const fetchAlerts = async (userId: string | null): Promise<DashboardAlert[]> => {
  const [inventoryLow, inventoryExpiring, notifications] = await Promise.all([
    supabase
      .from("inventory")
      .select("id, product_name, lot_number, units_available, expiration_date")
      .lt("units_available", 5),
    supabase
      .from("inventory")
      .select("id, product_name, lot_number, units_available, expiration_date")
      .lte("expiration_date", inThirtyDaysISO()),
    userId
      ? supabase
          .from("notifications")
          .select("id, title, message, created_at, type, is_read, related_entity_type, related_entity_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25)
      : { data: [], error: null },
  ]);

  const alerts: DashboardAlert[] = [];

  const lowIds = new Set<string>();
  (inventoryLow.data || []).forEach((item) => {
    alerts.push({
      id: `low-${item.id}`,
      title: `${item.product_name} low stock`,
      description: `${item.units_available} units left • Lot ${item.lot_number}`,
      type: "inventory",
      severity: "high",
      timestamp: new Date().toISOString(),
      relatedEntityType: "inventory",
      relatedEntityId: item.id,
    });
    lowIds.add(item.id);
  });

  (inventoryExpiring.data || [])
    .filter((item) => !lowIds.has(item.id))
    .forEach((item) => {
      alerts.push({
        id: `exp-${item.id}`,
        title: `${item.product_name} expiring soon`,
        description: `Expires ${new Date(item.expiration_date).toLocaleDateString()}`,
        type: "inventory",
        severity: "medium",
        timestamp: new Date(item.expiration_date).toISOString(),
        relatedEntityType: "inventory",
        relatedEntityId: item.id,
      });
    });

  (notifications.data || [])
    .filter((n) => !n.is_read)
    .forEach((notification) => {
      alerts.push({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        type: "notification",
        severity: notification.type === "alert" ? "high" : "low",
        timestamp: notification.created_at,
        relatedEntityType: notification.related_entity_type,
        relatedEntityId: notification.related_entity_id,
      });
    });

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 60_000,
  });
};

export const useTreatmentTrends = () => {
  return useQuery({
    queryKey: ["dashboard", "treatment-trends"],
    queryFn: fetchTreatmentTrends,
    staleTime: 5 * 60_000,
  });
};

export const useTodaySchedule = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "today-schedule", user?.id],
    queryFn: () => fetchTodaySchedule(user?.id ?? null),
    refetchInterval: 30_000,
  });
};

export const useQuickActions = () => {
  const actions: QuickAction[] = useMemo(
    () => [
      {
        label: "Book Treatment",
        description: "Schedule a new appointment",
        action: "book_treatment",
        href: "/patients",
      },
      {
        label: "Add Patient",
        description: "Create a new patient profile",
        action: "new_patient",
        href: "/patients",
      },
      {
        label: "Reorder Products",
        description: "Manage low-stock inventory",
        action: "reorder_stock",
        href: "/inventory",
      },
      {
        label: "Build Template",
        description: "Update treatment templates",
        action: "build_template",
        href: "/templates",
      },
    ],
    []
  );

  return actions;
};

export const useAlertsFeed = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "alerts", user?.id],
    queryFn: () => fetchAlerts(user?.id ?? null),
    enabled: !!user,
    refetchInterval: 45_000,
  });
};

export interface RecentTreatment {
  id: string;
  patientName: string;
  treatmentType: string;
  treatmentDate: string;
}

const fetchRecentTreatments = async (): Promise<RecentTreatment[]> => {
  const { data, error } = await supabase
    .from("treatments")
    .select(
      `
        id,
        treatment_type,
        treatment_date,
        patients:patient_id (
          first_name,
          last_name
        )
      `
    )
    .order("treatment_date", { ascending: false })
    .limit(5);

  if (error) throw error;

  return (
    data?.map((item) => ({
      id: item.id,
      patientName: `${item.patients?.first_name ?? "Patient"} ${item.patients?.last_name ?? ""}`.trim(),
      treatmentType: item.treatment_type,
      treatmentDate: item.treatment_date,
    })) ?? []
  );
};

export const useRecentTreatments = () => {
  return useQuery({
    queryKey: ["dashboard", "recent-treatments"],
    queryFn: fetchRecentTreatments,
    staleTime: 60_000,
  });
};

export const useAlertActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const acknowledge = useMutation({
    mutationFn: async (alert: DashboardAlert) => {
      if (alert.type === "notification") {
        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", alert.id);
        if (error) throw error;
      } else if (alert.relatedEntityId && user) {
        const { error } = await supabase.from("notifications").insert({
          user_id: user.id,
          title: `Acknowledged ${alert.title}`,
          message: alert.description,
          type: "acknowledged",
          related_entity_type: alert.relatedEntityType,
          related_entity_id: alert.relatedEntityId,
          is_read: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "alerts"] });
      toast({
        title: "Alert acknowledged",
        description: "We recorded your acknowledgement.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to acknowledge alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const snooze = useMutation({
    mutationFn: async (alert: DashboardAlert) => {
      if (alert.type === "notification") {
        // For snooze, mark as read and re-create notification for later follow-up
        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", alert.id);
        if (error) throw error;

        if (user) {
          const snoozeTime = new Date();
          snoozeTime.setHours(snoozeTime.getHours() + 1);
          const { error: insertError } = await supabase.from("notifications").insert({
            user_id: user.id,
            title: `${alert.title} (Snoozed)`,
            message: alert.description,
            type: "alert",
            related_entity_type: alert.relatedEntityType,
            related_entity_id: alert.relatedEntityId,
            created_at: snoozeTime.toISOString(),
          });
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "alerts"] });
      toast({
        title: "Alert snoozed",
        description: "We will remind you again later.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to snooze alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    acknowledge,
    snooze,
  };
};

