import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type ImplantRecord = Tables<"implants">;

export interface NewImplantInput {
  patientId: string;
  deviceName: string;
  manufacturer: string;
  modelNumber?: string;
  lotNumber: string;
  serialNumber?: string;
  udi?: string;
  implantDate: string;
  bodySide?: "left" | "right" | "bilateral" | "n/a";
  warrantyExpiration?: string;
}

const fetchImplants = async (): Promise<ImplantRecord[]> => {
  const { data, error } = await supabase
    .from("implants")
    .select(`
      *,
      patients:patient_id (
        first_name,
        last_name
      )
    `)
    .order("implant_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const useImplants = () => {
  return useQuery({
    queryKey: ["implants"],
    queryFn: fetchImplants,
    staleTime: 60_000,
  });
};

const mapToInsert = (payload: NewImplantInput): TablesInsert<"implants"> => ({
  patient_id: payload.patientId,
  device_name: payload.deviceName.trim(),
  manufacturer: payload.manufacturer.trim(),
  model_number: payload.modelNumber?.trim() || null,
  lot_number: payload.lotNumber.trim(),
  serial_number: payload.serialNumber?.trim() || null,
  udi: payload.udi?.trim() || null,
  implant_date: payload.implantDate,
  body_side: payload.bodySide || null,
  warranty_expiration: payload.warrantyExpiration || null,
});

export const useRegisterImplant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NewImplantInput) => {
      const body = mapToInsert(payload);
      const { data, error } = await supabase.from("implants").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Implant registered",
        description: "The implant has been added to the registry.",
      });
      queryClient.invalidateQueries({ queryKey: ["implants"] });
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

