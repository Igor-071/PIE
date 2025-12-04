import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type PatientRecord = Tables<"patients">;

export interface NewPatientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  allergies?: string;
  medicalHistory?: string;
}

const fetchPatients = async (): Promise<PatientRecord[]> => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const usePatients = () => {
  const query = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
    staleTime: 60_000,
  });

  return query;
};

const mapToInsert = (payload: NewPatientInput): TablesInsert<"patients"> => ({
  first_name: payload.firstName.trim(),
  last_name: payload.lastName.trim(),
  email: payload.email?.trim() || null,
  phone: payload.phone?.trim() || null,
  date_of_birth: payload.dateOfBirth ? payload.dateOfBirth : null,
  allergies: payload.allergies?.trim() || null,
  medical_history: payload.medicalHistory?.trim() || null,
});

export const useAddPatient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NewPatientInput) => {
      const body = mapToInsert(payload);
      const { data, error } = await supabase.from("patients").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Patient added",
        description: "The new patient profile is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Patient deleted",
        description: "The patient record has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useFilteredPatients = (patients: PatientRecord[] | undefined, searchQuery: string) => {
  return useMemo(() => {
    if (!patients) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      return (
        fullName.includes(term) ||
        (patient.email?.toLowerCase() ?? "").includes(term) ||
        (patient.phone?.toLowerCase() ?? "").includes(term)
      );
    });
  }, [patients, searchQuery]);
};

