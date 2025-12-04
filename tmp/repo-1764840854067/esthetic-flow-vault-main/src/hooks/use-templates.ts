import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type TreatmentTemplate = Tables<"treatment_templates">;

export interface NewTemplateInput {
  name: string;
  treatmentType: string;
  areas?: string[];
  unitsPerArea?: Record<string, number>;
  productName?: string;
  notes?: string;
}

export interface UpdateTemplateInput {
  id: string;
  name?: string;
  treatmentType?: string;
  areas?: string[];
  unitsPerArea?: Record<string, number>;
  productName?: string;
  notes?: string;
}

const fetchTemplates = async (): Promise<TreatmentTemplate[]> => {
  const { data, error } = await supabase
    .from("treatment_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const useTemplates = () => {
  return useQuery({
    queryKey: ["treatment_templates"],
    queryFn: fetchTemplates,
    staleTime: 60_000,
  });
};

export const useFilteredTemplates = (templates: TreatmentTemplate[] | undefined, searchQuery: string) => {
  return useMemo(() => {
    if (!templates) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return templates;

    return templates.filter((template) => {
      return template.name.toLowerCase().includes(term);
    });
  }, [templates, searchQuery]);
};

const mapToInsert = (payload: NewTemplateInput): TablesInsert<"treatment_templates"> => ({
  name: payload.name.trim(),
  areas: (payload.areas && payload.areas.length > 0 ? payload.areas : []) as any,
  default_units: (payload.unitsPerArea as any) || null,
});

export const useAddTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NewTemplateInput) => {
      const body = mapToInsert(payload);
      const { data, error } = await supabase.from("treatment_templates").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "The treatment template has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["treatment_templates"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateTemplateInput) => {
      const { id, ...updates } = payload;
      const body: TablesUpdate<"treatment_templates"> = {};
      if (updates.name !== undefined) body.name = updates.name.trim();
      if (updates.areas !== undefined) body.areas = (updates.areas.length > 0 ? updates.areas : []) as any;
      if (updates.unitsPerArea !== undefined) body.default_units = (updates.unitsPerArea as any);

      const { data, error } = await supabase.from("treatment_templates").update(body).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "Changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["treatment_templates"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatment_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "The treatment template has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["treatment_templates"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

