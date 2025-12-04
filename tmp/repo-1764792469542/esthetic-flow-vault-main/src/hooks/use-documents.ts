import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile, deleteFile, generateFilePath, STORAGE_BUCKETS } from "./use-storage";

export type Document = Tables<"documents">;

export interface UploadDocumentInput {
  patientId: string;
  file: File;
  documentType: string; // e.g., "consent_form", "medical_record", "insurance"
  description?: string;
}

const fetchPatientDocuments = async (patientId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const usePatientDocuments = (patientId?: string) => {
  return useQuery({
    queryKey: ["documents", "patient", patientId],
    queryFn: () => fetchPatientDocuments(patientId as string),
    enabled: !!patientId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      // Generate unique file path
      const filePath = generateFilePath(`patient-${input.patientId}`, input.file.name);

      // Upload file to Storage
      const uploadResult = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, filePath, input.file);

      // Save metadata to database
      const documentData: TablesInsert<"documents"> = {
        patient_id: input.patientId,
        uploaded_by: user?.id || null,
        file_name: input.file.name,
        file_type: input.file.type,
        file_size: input.file.size,
        storage_path: uploadResult.path,
        document_type: input.documentType,
        description: input.description || null,
      };

      const { data, error } = await supabase.from("documents").insert(documentData).select().single();
      if (error) throw error;

      return { ...data, publicUrl: uploadResult.publicUrl };
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Document uploaded",
        description: `${variables.file.name} has been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["documents", "patient", variables.patientId] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (document: Document) => {
      // Delete file from Storage
      await deleteFile(STORAGE_BUCKETS.DOCUMENTS, document.storage_path);

      // Delete metadata from database
      const { error } = await supabase.from("documents").delete().eq("id", document.id);
      if (error) throw error;
    },
    onSuccess: (_, document) => {
      toast({
        title: "Document deleted",
        description: "File has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["documents", "patient", document.patient_id] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const getDocumentUrl = (storagePath: string): string => {
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).getPublicUrl(storagePath);
  return publicUrl;
};

