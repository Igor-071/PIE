import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PatientLogin from "./pages/PatientLogin";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Implants from "./pages/Implants";
import Inventory from "./pages/Inventory";
import Templates from "./pages/Templates";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Diagnostic from "./pages/Diagnostic";
import AppLayout from "./components/AppLayout";
import PatientLayout from "./components/PatientLayout";
import PatientPortal from "./pages/PatientPortal";
import PatientRecords from "./pages/PatientRecords";
import PatientImplants from "./pages/PatientImplants";
import PatientDocuments from "./pages/PatientDocuments";
import PatientProfile from "./pages/PatientProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login/clinic" element={<Login />} />
            <Route path="/login/patient" element={<PatientLogin />} />
            <Route path="/diagnostic" element={<Diagnostic />} />

            {/* Clinic routes - protected for clinic staff only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Patients />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <PatientDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/implants"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Implants />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Inventory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Templates />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Schedule />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRoles={["clinic_admin", "provider", "assistant", "read_only"]}>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Patient routes - protected for patients only */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientLayout>
                    <PatientPortal />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/records"
              element={
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientLayout>
                    <PatientRecords />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/implants"
              element={
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientLayout>
                    <PatientImplants />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/documents"
              element={
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientLayout>
                    <PatientDocuments />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/profile"
              element={
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientLayout>
                    <PatientProfile />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
