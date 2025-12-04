import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Syringe, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      // Redirect authenticated users to their respective portals
      if (role === "patient") {
        navigate("/portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-soft to-accent/10 p-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Syringe className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Aesthetica</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive injectable & implant records management
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="shadow-lg border-border/50 hover:shadow-xl transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">For Clinics</CardTitle>
              <CardDescription className="text-base">
                Providers, staff, and administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Manage patient records & treatments
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Track implants & inventory
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Document before & after photos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Handle recall alerts
                </li>
              </ul>
              <Button
                onClick={() => navigate("/login/clinic")}
                className="w-full"
                size="lg"
              >
                Clinic Sign In
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50 hover:shadow-xl transition-shadow cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <Syringe className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">For Patients</CardTitle>
              <CardDescription className="text-base">
                Secure access to your records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                  View treatment history
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                  Access implant cards with QR codes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                  Download consent forms & documents
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                  Receive recall notifications
                </li>
              </ul>
              <Button
                onClick={() => navigate("/login/patient")}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Patient Sign In
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Privacy-first records management with secure access
        </p>
      </div>
    </div>
  );
};

export default Landing;
