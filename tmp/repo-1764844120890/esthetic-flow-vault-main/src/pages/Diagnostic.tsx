import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const Diagnostic = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const checks: any[] = [];

    // Check 1: Supabase connection
    try {
      const { data, error } = await supabase.from("patients").select("count").limit(1);
      checks.push({
        name: "Supabase Connection",
        status: error ? "error" : "success",
        message: error ? error.message : "Connected successfully",
      });
    } catch (err: any) {
      checks.push({
        name: "Supabase Connection",
        status: "error",
        message: err.message,
      });
    }

    // Check 2: clinic_settings table
    try {
      const { data, error } = await supabase.from("clinic_settings").select("*").maybeSingle();
      checks.push({
        name: "clinic_settings Table",
        status: error ? "error" : data ? "success" : "warning",
        message: error ? error.message : data ? "Table exists with data" : "Table exists but empty",
        data: data || null,
      });
    } catch (err: any) {
      checks.push({
        name: "clinic_settings Table",
        status: "error",
        message: err.message,
      });
    }

    // Check 3: staff table
    try {
      const { data, error } = await supabase.from("staff").select("count");
      checks.push({
        name: "staff Table",
        status: error ? "error" : "success",
        message: error ? error.message : `Table exists (${data?.length || 0} records)`,
      });
    } catch (err: any) {
      checks.push({
        name: "staff Table",
        status: "error",
        message: err.message,
      });
    }

    // Check 4: patient_users table
    try {
      const { data, error } = await supabase.from("patient_users").select("count");
      checks.push({
        name: "patient_users Table",
        status: error ? "error" : "success",
        message: error ? error.message : `Table exists (${data?.length || 0} records)`,
      });
    } catch (err: any) {
      checks.push({
        name: "patient_users Table",
        status: "error",
        message: err.message,
      });
    }

    // Check 5: Auth status
    try {
      const { data, error } = await supabase.auth.getUser();
      checks.push({
        name: "Authentication",
        status: error ? "error" : data.user ? "success" : "warning",
        message: error ? error.message : data.user ? `Logged in as ${data.user.email}` : "Not logged in",
      });
    } catch (err: any) {
      checks.push({
        name: "Authentication",
        status: "error",
        message: err.message,
      });
    }

    // Check 5b: User Roles table and RLS policies
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        
        if (error) {
          // Check if it's an RLS policy error
          if (error.message.includes("policy") || error.code === "42501" || error.code === "PGRST301") {
            checks.push({
              name: "user_roles RLS Policies",
              status: "error",
              message: "❌ RLS policies missing! Users cannot read their roles. Contact Lovable support to add RLS policies.",
              data: {
                fix: "Ask Lovable to run: CREATE POLICY \"Users can view their own roles\" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);"
              }
            });
          } else {
            checks.push({
              name: "user_roles Table",
              status: "error",
              message: error.message,
            });
          }
        } else {
          checks.push({
            name: "user_roles Table & RLS",
            status: "success",
            message: data ? `Role assigned: ${data.role}` : "Table accessible but no role assigned",
          });
        }
      }
    } catch (err: any) {
      checks.push({
        name: "user_roles Check",
        status: "error",
        message: err.message,
      });
    }

    // Check 6: Other critical tables
    const tables: string[] = [
      "patients",
      "treatments",
      "implants",
      "inventory",
      "appointments",
      "documents",
      "treatment_photos",
      "treatment_templates",
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table as any).select("count").limit(1);
        checks.push({
          name: `${table} Table`,
          status: error ? "error" : "success",
          message: error ? error.message : "Table exists",
        });
      } catch (err: any) {
        checks.push({
          name: `${table} Table`,
          status: "error",
          message: err.message,
        });
      }
    }

    setResults(checks);
    setLoading(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Running Diagnostics...</h1>
      </div>
    );
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
        <p className="text-muted-foreground">
          Checking database tables, connections, and authentication
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <p className="text-sm text-muted-foreground">Passing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50"
              >
                {getIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{result.name}</h4>
                    <Badge variant={getBadgeVariant(result.status) as any}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600">
                        Show data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {errorCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Errors detected!</strong> The application may not work correctly.
            </p>
            <p>Common fixes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Run database migrations: <code className="bg-white px-2 py-1 rounded">supabase db push</code></li>
              <li>Check your Supabase connection settings</li>
              <li>Verify RLS policies in Supabase Dashboard</li>
              <li>See <code>/docs/SETUP_INSTRUCTIONS.md</code> for detailed setup</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Diagnostic;

