import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile, deleteFile, generateFilePath, STORAGE_BUCKETS } from "./use-storage";

export type TreatmentPhoto = Tables<"treatment_photos">;
export type PhotoType = "before" | "after" | "during";

export interface UploadPhotoInput {
  patientId: string;
  treatmentId?: string;
  file: File;
  photoType: PhotoType;
  takenAt?: string; // ISO string
  notes?: string;
}

const fetchPatientPhotos = async (patientId: string): Promise<TreatmentPhoto[]> => {
  const { data, error } = await supabase
    .from("treatment_photos")
    .select("*")
    .eq("patient_id", patientId)
    .order("taken_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

const fetchTreatmentPhotos = async (treatmentId: string): Promise<TreatmentPhoto[]> => {
  const { data, error } = await supabase
    .from("treatment_photos")
    .select("*")
    .eq("treatment_id", treatmentId)
    .order("photo_type", { ascending: true }); // before, during, after

  if (error) throw error;
  return data ?? [];
};

export const usePatientPhotos = (patientId?: string) => {
  return useQuery({
    queryKey: ["photos", "patient", patientId],
    queryFn: () => fetchPatientPhotos(patientId as string),
    enabled: !!patientId,
  });
};

export const useTreatmentPhotos = (treatmentId?: string) => {
  return useQuery({
    queryKey: ["photos", "treatment", treatmentId],
    queryFn: () => fetchTreatmentPhotos(treatmentId as string),
    enabled: !!treatmentId,
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UploadPhotoInput) => {
      // Validate file type (images only)
      if (!input.file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      // Generate unique file path
      const prefix = input.treatmentId
        ? `treatment-${input.treatmentId}`
        : `patient-${input.patientId}`;
      const filePath = generateFilePath(prefix, input.file.name);

      // Upload file to Storage
      const uploadResult = await uploadFile(STORAGE_BUCKETS.PHOTOS, filePath, input.file);

      // Save metadata to database
      const photoData: TablesInsert<"treatment_photos"> = {
        patient_id: input.patientId,
        treatment_id: input.treatmentId || null,
        uploaded_by: user?.id || null,
        photo_type: input.photoType,
        file_name: input.file.name,
        file_type: input.file.type,
        file_size: input.file.size,
        storage_path: uploadResult.path,
        taken_at: input.takenAt || new Date().toISOString(),
        notes: input.notes || null,
      };

      const { data, error } = await supabase.from("treatment_photos").insert(photoData).select().single();
      if (error) throw error;

      return { ...data, publicUrl: uploadResult.publicUrl };
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Photo uploaded",
        description: `${variables.photoType} photo has been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["photos", "patient", variables.patientId] });
      if (variables.treatmentId) {
        queryClient.invalidateQueries({ queryKey: ["photos", "treatment", variables.treatmentId] });
      }
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

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (photo: TreatmentPhoto) => {
      // Delete file from Storage
      await deleteFile(STORAGE_BUCKETS.PHOTOS, photo.storage_path);

      // Delete metadata from database
      const { error } = await supabase.from("treatment_photos").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: (_, photo) => {
      toast({
        title: "Photo deleted",
        description: "Photo has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["photos", "patient", photo.patient_id] });
      if (photo.treatment_id) {
        queryClient.invalidateQueries({ queryKey: ["photos", "treatment", photo.treatment_id] });
      }
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

export const getPhotoUrl = (storagePath: string): string => {
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKETS.PHOTOS).getPublicUrl(storagePath);
  return publicUrl;
};

