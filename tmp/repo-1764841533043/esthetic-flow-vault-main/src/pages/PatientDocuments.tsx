import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientDocuments, getDocumentUrl } from "@/hooks/use-documents";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PatientDocuments = () => {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState<string | undefined>();
  
  useEffect(() => {
    const fetchPatientId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("patient_users")
        .select("patient_id")
        .eq("id", user.id)
        .single();
      
      if (data?.patient_id) {
        setPatientId(data.patient_id);
      }
    };
    
    fetchPatientId();
  }, [user?.id]);
  
  const { data: documents, isLoading } = usePatientDocuments(patientId);

  const getCategoryColor = (documentType: string) => {
    switch (documentType) {
      case "consent_form":
        return "default";
      case "medical_record":
        return "secondary";
      case "insurance":
        return "outline";
      case "photo":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold tracking-wide">Documents</h1>
        <p className="text-muted-foreground font-light">
          Consent forms, treatment summaries, and post-care instructions
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-accent/5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1 font-serif">{doc.file_name}</CardTitle>
                      {doc.description && (
                        <CardDescription className="text-sm font-light">
                          {doc.description}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-light">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getCategoryColor(doc.document_type) as any} className="shrink-0 shadow-sm capitalize">
                    {doc.document_type.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-primary/30 hover:bg-primary/5"
                  onClick={() => window.open(getDocumentUrl(doc.storage_path), "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/50">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-light">No documents available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your clinic will upload documents here</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed border-border/50 bg-gradient-to-br from-accent/20 to-muted/30">
        <CardContent className="py-8 text-center">
          <Shield className="w-8 h-8 mx-auto text-primary/60 mb-2" />
          <p className="text-sm text-muted-foreground font-light">
            All documents are securely stored and only accessible to you
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDocuments;
