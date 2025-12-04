import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, FileText, Activity, Files, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { usePatientRealtimeSubscriptions } from "@/hooks/use-realtime";

interface PatientLayoutProps {
  children: ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Set up realtime subscriptions for patient updates
  usePatientRealtimeSubscriptions(user?.user_metadata?.patient_id);

  const navItems = [
    { icon: Home, label: "Home", path: "/portal" },
    { icon: FileText, label: "Records", path: "/portal/records" },
    { icon: Activity, label: "Implants", path: "/portal/implants" },
    { icon: Files, label: "Documents", path: "/portal/documents" },
    { icon: User, label: "Profile", path: "/portal/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col">
      {/* Premium Top Header */}
      <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass-background)] backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shadow-[var(--shadow-soft)]">
            <h1 className="text-lg font-serif font-bold text-primary">A</h1>
          </div>
          <h1 className="text-xl font-serif font-semibold tracking-wide">Aesthetica</h1>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-[var(--shadow-elevated)]">
            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/20 text-primary font-semibold text-base">
              {user?.email?.charAt(0).toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content - with bottom padding for nav */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border/50 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="h-full flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative",
                isActive(path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              {isActive(path) && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 shadow-sm" />
              )}
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                isActive(path) && "scale-110"
              )} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default PatientLayout;
