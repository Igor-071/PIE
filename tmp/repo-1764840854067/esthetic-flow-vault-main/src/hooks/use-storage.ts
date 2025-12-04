import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UploadFileResult {
  path: string;
  fullPath: string;
  publicUrl: string;
}

/**
 * Initialize storage buckets (should be run once, typically in setup/admin panel)
 * For now, buckets must be created manually in Supabase Dashboard
 */
export const STORAGE_BUCKETS = {
  DOCUMENTS: "patient-documents",
  PHOTOS: "treatment-photos",
} as const;

/**
 * Upload a file to a Supabase Storage bucket
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<UploadFileResult> => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl,
  };
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

/**
 * Generate a unique file path for storage
 */
export const generateFilePath = (
  prefix: string,
  fileName: string
): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${prefix}/${timestamp}-${randomString}-${sanitizedFileName}`;
};

/**
 * Hook to upload files with React Query
 */
export const useUploadFile = (bucket: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      path,
      file,
    }: {
      path: string;
      file: File;
    }) => {
      return await uploadFile(bucket, path, file);
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "File has been uploaded.",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete files with React Query
 */
export const useDeleteFile = (bucket: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (path: string) => {
      return await deleteFile(bucket, path);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "File has been removed from storage.",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  options?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } => {
  const maxSize = (options?.maxSizeMB || 10) * 1024 * 1024; // Default 10MB

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${options?.maxSizeMB || 10}MB limit`,
    };
  }

  if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
};

