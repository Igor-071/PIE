import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Activity, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProviderCard } from "@/components/ProviderCard";
import { TreatmentChart } from "@/components/TreatmentChart";
import { PhotoGallery } from "@/components/PhotoGallery";
import { motion } from "framer-motion";

const PatientPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [recentTreatments, setRecentTreatments] = useState<any[]>([]);
  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const [implantCount, setImplantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    try {
      // Get patient info
      const { data: patientUser } = await supabase
        .from("patient_users")
        .select("patient_id")
        .eq("id", user?.id)
        .single();

      if (!patientUser?.patient_id) {
        setLoading(false);
        return;
      }

      // Get patient details
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientUser.patient_id)
        .single();

      setPatient(patientData);

      // Get all treatments for chart
      const { data: allTreatmentsData } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", patientUser.patient_id)
        .order("treatment_date", { ascending: false });

      setAllTreatments(allTreatmentsData || []);
      setRecentTreatments(allTreatmentsData?.slice(0, 3) || []);

      // Get provider info from first treatment
      if (allTreatmentsData && allTreatmentsData.length > 0 && allTreatmentsData[0].provider_id) {
        const { data: providerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", allTreatmentsData[0].provider_id)
          .single();

        setProvider(providerData);
      }

      // Get implant count
      const { count } = await supabase
        .from("implants")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientUser.patient_id);

      setImplantCount(count || 0);
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Loading your portal...</div>
      </div>
    );
  }

  const totalTreatments = allTreatments.length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl pb-24">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent">
          Welcome back, {patient?.first_name || "Patient"}! 
        </h1>
        <p className="text-muted-foreground font-light">
          Your personalized aesthetic journey dashboard
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Treatments</p>
                <p className="text-3xl font-serif font-bold text-primary">{totalTreatments}</p>
              </div>
              <div className="p-2 rounded-xl bg-primary/10">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Implants</p>
                <p className="text-3xl font-serif font-bold text-primary">{implantCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Documents</p>
                <p className="text-3xl font-serif font-bold text-primary">5</p>
              </div>
              <div className="p-2 rounded-xl bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Next Visit</p>
                <p className="text-sm font-medium">Not scheduled</p>
              </div>
              <div className="p-2 rounded-xl bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Treatment Chart */}
      {allTreatments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TreatmentChart treatments={allTreatments} />
        </motion.div>
      )}

      {/* Latest Progress Photos */}
      {recentTreatments[0]?.before_photos?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Latest Progress</CardTitle>
              <CardDescription className="font-light">Your most recent transformation</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                beforePhotos={recentTreatments[0].before_photos}
                afterPhotos={recentTreatments[0].after_photos}
                treatmentDate={recentTreatments[0].treatment_date}
                treatmentType={recentTreatments[0].treatment_type}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Provider Card */}
        {provider && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ProviderCard provider={provider} showBooking={true} />
          </motion.div>
        )}

        {/* Recent Treatments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Recent Treatments</CardTitle>
              <CardDescription className="font-light">Your latest procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTreatments.length > 0 ? (
                <>
                  {recentTreatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card to-accent/5 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => navigate("/portal/records")}
                    >
                      <div>
                        <p className="font-medium">{treatment.treatment_type}</p>
                        <p className="text-sm text-muted-foreground font-light">
                          {new Date(treatment.treatment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Activity className="w-4 h-4 text-primary/60" />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/5"
                    onClick={() => navigate("/portal/records")}
                  >
                    View All Records
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 font-light">
                  No treatments recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientPortal;
