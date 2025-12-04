import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowLeft } from "lucide-react";

const PatientLogin = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn(email, password);
    
    if (!result.error) {
      // Direct redirect - bypasses React Router
      window.location.href = "/portal";
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface-soft/50 to-accent/5 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-32 right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <Card variant="glass" className="w-full max-w-md shadow-[var(--shadow-luxury)] border-[var(--glass-border)] backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-4 text-center pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 hover:scale-105 transition-transform duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-2 shadow-[var(--shadow-elevated)]">
            <User className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-serif font-semibold">Patient Portal</CardTitle>
          <CardDescription className="text-base">
            Access your treatment records and photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-[var(--glass-background)] backdrop-blur-sm border-[var(--glass-border)] focus:border-primary/30 focus:shadow-[var(--shadow-soft)] transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-[var(--glass-background)] backdrop-blur-sm border-[var(--glass-border)] focus:border-primary/30 focus:shadow-[var(--shadow-soft)] transition-all duration-300"
              />
            </div>
            <Button type="submit" variant="luxury" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Secure access to your personalized records
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientLogin;
