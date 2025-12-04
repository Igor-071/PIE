import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Package } from "lucide-react";
import { PhotoGallery } from "@/components/PhotoGallery";

const PatientRecords = () => {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTreatments();
    }
  }, [user]);

  const loadTreatments = async () => {
    try {
      const { data: patientUser } = await supabase
        .from("patient_users")
        .select("patient_id")
        .eq("id", user?.id)
        .single();

      if (!patientUser?.patient_id) {
        setLoading(false);
        return;
      }

      const { data: treatments } = await supabase
        .from("treatments")
        .select("*, profiles(full_name)")
        .eq("patient_id", patientUser.patient_id)
        .order("treatment_date", { ascending: false });

      setTreatments(treatments || []);
    } catch (error) {
      console.error("Error loading treatments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Loading your records...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Treatment Records</h1>
        <p className="text-muted-foreground">
          Complete history of all your treatments
        </p>
      </div>

      {treatments.length > 0 ? (
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{treatment.treatment_type}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(treatment.treatment_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{treatment.profiles?.full_name || "Provider"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {treatment.areas_treated && treatment.areas_treated.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Areas Treated
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {treatment.areas_treated.map((area: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {treatment.product_name && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Product Details
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">Product:</span>{" "}
                        {treatment.product_name}
                      </div>
                      {treatment.units_used && (
                        <div>
                          <span className="text-muted-foreground">Units:</span>{" "}
                          {treatment.units_used}
                        </div>
                      )}
                      {treatment.lot_number && (
                        <div>
                          <span className="text-muted-foreground">Lot:</span>{" "}
                          {treatment.lot_number}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {treatment.notes && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Notes</div>
                    <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                  </div>
                )}

                {/* Progress Photos */}
                {(treatment.before_photos?.length > 0 || treatment.after_photos?.length > 0) && (
                  <PhotoGallery
                    beforePhotos={treatment.before_photos || []}
                    afterPhotos={treatment.after_photos || []}
                    treatmentDate={treatment.treatment_date}
                    treatmentType={treatment.treatment_type}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No treatment records available yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientRecords;
