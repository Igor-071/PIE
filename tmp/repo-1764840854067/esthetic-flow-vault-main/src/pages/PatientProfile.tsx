import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogOut, User, Mail, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProviderCard } from "@/components/ProviderCard";

const PatientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    try {
      const { data: patientUser } = await supabase
        .from("patient_users")
        .select("patient_id, email, phone")
        .eq("id", user?.id)
        .single();

      if (!patientUser?.patient_id) {
        setLoading(false);
        return;
      }

      const { data: patient } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientUser.patient_id)
        .single();

      setPatientData({ ...patient, ...patientUser });

      // Get provider from treatments
      const { data: treatments } = await supabase
        .from("treatments")
        .select("provider_id")
        .eq("patient_id", patientUser.patient_id)
        .order("treatment_date", { ascending: false })
        .limit(1);

      if (treatments && treatments.length > 0 && treatments[0].provider_id) {
        const { data: providerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", treatments[0].provider_id)
          .single();

        setProvider(providerData);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-2xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Your personal information and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            This information is managed by your clinic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <div className="font-medium">
              {patientData
                ? `${patientData.first_name} ${patientData.last_name}`
                : "Not provided"}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <div className="font-medium">{patientData?.email || user?.email || "Not provided"}</div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              Phone
            </Label>
            <div className="font-medium">{patientData?.phone || "Not provided"}</div>
          </div>

          {patientData?.date_of_birth && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <div className="font-medium">
                {new Date(patientData.date_of_birth).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Contact Card */}
      {provider && (
        <ProviderCard provider={provider} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Need to update your information?</p>
        <p className="mt-1">Please contact your clinic</p>
      </div>
    </div>
  );
};

export default PatientProfile;
