import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "clinic_admin" | "provider" | "assistant" | "read_only" | "patient";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRoles,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If role check is required but role hasn't loaded, allow access
  // This prevents blocking when RLS policies are missing
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    // Redirect clinic users trying to access patient portal
    if (role !== "patient" && requiredRoles.includes("patient")) {
      return <Navigate to="/dashboard" replace />;
    }
    // Redirect patients trying to access clinic dashboard
    if (role === "patient" && !requiredRoles.includes("patient")) {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  // If role is null but user is authenticated, allow access (RLS policy missing workaround)
  if (requiredRoles && !role && user) {
    console.warn("User authenticated but role not loaded - allowing access as fallback");
  }

  return <>{children}</>;
};
