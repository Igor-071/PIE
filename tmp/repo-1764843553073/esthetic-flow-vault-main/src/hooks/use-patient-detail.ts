import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useDecrementInventory } from "@/hooks/use-inventory";

export type Patient = Tables<"patients">;

type TreatmentRecord = Tables<"treatments"> & {
  profiles?: {
    full_name: string;
  } | null;
};

type ImplantRecord = Tables<"implants">;

const fetchPatient = async (patientId: string) => {
  const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
  if (error) throw error;
  return data as Patient;
};

const fetchTreatments = async (patientId: string) => {
  const { data, error } = await supabase
    .from("treatments")
    .select("*, profiles(full_name)")
    .eq("patient_id", patientId)
    .order("treatment_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TreatmentRecord[];
};

const fetchImplants = async (patientId: string) => {
  const { data, error } = await supabase
    .from("implants")
    .select("*")
    .eq("patient_id", patientId)
    .order("implant_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ImplantRecord[];
};

export const usePatientProfile = (patientId?: string) => {
  return useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId as string),
    enabled: !!patientId,
  });
};

export const usePatientTreatments = (patientId?: string) => {
  return useQuery({
    queryKey: ["patient", patientId, "treatments"],
    queryFn: () => fetchTreatments(patientId as string),
    enabled: !!patientId,
  });
};

export const usePatientImplants = (patientId?: string) => {
  return useQuery({
    queryKey: ["patient", patientId, "implants"],
    queryFn: () => fetchImplants(patientId as string),
    enabled: !!patientId,
  });
};

export interface TreatmentInput {
  patientId: string;
  treatmentType: string;
  treatmentDate: string;
  productName?: string;
  lotNumber?: string;
  unitsUsed?: number;
  providerId?: string;
  notes?: string;
}

export const useCreateTreatment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: decrementInventory } = useDecrementInventory();

  return useMutation({
    mutationFn: async (input: TreatmentInput) => {
      const payload: TablesInsert<"treatments"> = {
        patient_id: input.patientId,
        treatment_type: input.treatmentType,
        treatment_date: input.treatmentDate,
        product_name: input.productName || null,
        lot_number: input.lotNumber || null,
        units_used: input.unitsUsed ?? null,
        provider_id: input.providerId || null,
        notes: input.notes || null,
      };

      const { data, error } = await supabase.from("treatments").insert(payload).select().single();
      if (error) throw error;

      // Auto-decrement inventory if lot + units provided
      if (input.lotNumber && input.unitsUsed && input.unitsUsed > 0) {
        try {
          await decrementInventory({ lotNumber: input.lotNumber, unitsUsed: input.unitsUsed });
        } catch (inventoryError) {
          // Log but don't block treatment creation if inventory update fails
          console.warn("Failed to decrement inventory:", inventoryError);
        }
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Treatment recorded",
        description: variables.lotNumber && variables.unitsUsed 
          ? "Treatment logged and inventory updated." 
          : "The treatment history has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.patientId, "treatments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export interface ImplantInput {
  patientId: string;
  deviceName: string;
  implantDate: string;
  manufacturer: string;
  lotNumber: string;
  bodySide?: string;
  modelNumber?: string;
  serialNumber?: string;
  udi?: string;
  warrantyExpiration?: string;
}

export const useRegisterImplant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ImplantInput) => {
      const payload: TablesInsert<"implants"> = {
        patient_id: input.patientId,
        device_name: input.deviceName,
        implant_date: input.implantDate,
        manufacturer: input.manufacturer,
        lot_number: input.lotNumber,
        body_side: input.bodySide || null,
        model_number: input.modelNumber || null,
        serial_number: input.serialNumber || null,
        udi: input.udi || null,
        warranty_expiration: input.warrantyExpiration || null,
      };

      const { data, error } = await supabase.from("implants").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Implant registered",
        description: "Implant is now tracked in the registry.",
      });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.patientId, "implants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to register implant",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const usePatientStats = (treatments?: TreatmentRecord[], implants?: ImplantRecord[]) => {
  return useMemo(() => {
    const totalTreatments = treatments?.length ?? 0;
    const lastTreatmentDate = treatments?.[0]?.treatment_date ?? null;
    const activeImplants = implants?.length ?? 0;

    return {
      totalTreatments,
      activeImplants,
      lastTreatmentDate,
    };
  }, [treatments, implants]);
};

