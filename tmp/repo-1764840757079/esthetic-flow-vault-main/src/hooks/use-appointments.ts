import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Appointment = Tables<"appointments"> & {
  patients?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type AppointmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface NewAppointmentInput {
  patientId: string;
  appointmentDate: string; // ISO string
  appointmentType: string;
  durationMinutes?: number;
  providerId?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  id: string;
  appointmentDate?: string;
  appointmentType?: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
  notes?: string;
  reminderSent?: boolean;
}

const fetchAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      patients:patient_id (
        first_name,
        last_name
      )
    `)
    .order("appointment_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

const fetchAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      patients:patient_id (
        first_name,
        last_name
      )
    `)
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate)
    .order("appointment_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const useAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
    staleTime: 30_000,
  });
};

export const useAppointmentsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["appointments", "range", startDate, endDate],
    queryFn: () => fetchAppointmentsByDateRange(startDate, endDate),
    staleTime: 30_000,
    enabled: !!startDate && !!endDate,
  });
};

export const useTodayAppointments = () => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  return useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => fetchAppointmentsByDateRange(startOfDay, endOfDay),
    staleTime: 30_000,
  });
};

export const useUpcomingAppointments = (days: number = 7) => {
  const today = new Date();
  const startDate = today.toISOString();
  const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ["appointments", "upcoming", days],
    queryFn: () => fetchAppointmentsByDateRange(startDate, endDate),
    staleTime: 30_000,
  });
};

export const usePatientAppointments = (patientId?: string) => {
  return useQuery({
    queryKey: ["appointments", "patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId as string)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!patientId,
  });
};

export const useAppointmentStats = (appointments?: Appointment[]) => {
  return useMemo(() => {
    if (!appointments) return { total: 0, today: 0, upcoming: 0, completed: 0 };

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayCount = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= today && aptDate < tomorrow && apt.status !== "cancelled" && apt.status !== "no_show";
    }).length;

    const upcomingCount = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= today && aptDate < nextWeek && apt.status !== "cancelled" && apt.status !== "no_show" && apt.status !== "completed";
    }).length;

    const completedCount = appointments.filter((apt) => apt.status === "completed").length;

    return {
      total: appointments.length,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
    };
  }, [appointments]);
};

const mapToInsert = (payload: NewAppointmentInput): TablesInsert<"appointments"> => ({
  patient_id: payload.patientId,
  appointment_date: payload.appointmentDate,
  appointment_type: payload.appointmentType,
  duration_minutes: payload.durationMinutes ?? 60,
  provider_id: payload.providerId || null,
  notes: payload.notes || null,
  status: payload.status ?? "scheduled",
});

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NewAppointmentInput) => {
      const body = mapToInsert(payload);
      const { data, error } = await supabase.from("appointments").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Appointment scheduled",
        description: "The appointment has been added to the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateAppointmentInput) => {
      const { id, ...updates } = payload;
      const body: TablesUpdate<"appointments"> = {};
      if (updates.appointmentDate !== undefined) body.appointment_date = updates.appointmentDate;
      if (updates.appointmentType !== undefined) body.appointment_type = updates.appointmentType;
      if (updates.durationMinutes !== undefined) body.duration_minutes = updates.durationMinutes;
      if (updates.status !== undefined) body.status = updates.status;
      if (updates.notes !== undefined) body.notes = updates.notes;
      if (updates.reminderSent !== undefined) body.reminder_sent = updates.reminderSent;

      const { data, error } = await supabase.from("appointments").update(body).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Appointment updated",
        description: "Changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Appointment deleted",
        description: "The appointment has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

