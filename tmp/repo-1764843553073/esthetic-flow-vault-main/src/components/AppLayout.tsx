import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Syringe,
  Package,
  FileText,
  CalendarDays,
  Settings,
  LogOut,
  BarChart3,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useClinicRealtimeSubscriptions } from "@/hooks/use-realtime";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Set up realtime subscriptions for live updates
  useClinicRealtimeSubscriptions();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Schedule", href: "/schedule", icon: CalendarDays },
    { name: "Implants", href: "/implants", icon: Syringe },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Premium Sidebar */}
      <aside className="w-64 border-r border-[var(--glass-border)] bg-gradient-to-b from-card via-card/95 to-surface-soft/50 backdrop-blur-xl flex flex-col shadow-[var(--shadow-elevated)]">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shadow-[var(--shadow-soft)]">
            <Syringe className="w-5 h-5 text-primary" />
          </div>
          <span className="ml-3 text-xl font-serif font-semibold tracking-wide">Aesthetica</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 hover:shadow-[var(--shadow-soft)] hover:scale-[1.02]",
                isActive(item.href)
                  ? "bg-gradient-to-r from-primary/10 to-accent/5 text-primary shadow-[var(--shadow-soft)] border border-primary/20"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5 transition-transform duration-300" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 space-y-1 bg-gradient-to-t from-surface-soft/30 to-transparent">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 hover:shadow-[var(--shadow-soft)]",
              isActive("/settings")
                ? "bg-gradient-to-r from-primary/10 to-accent/5 text-primary shadow-[var(--shadow-soft)] border border-primary/20"
                : "text-muted-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:shadow-[var(--shadow-soft)] text-left text-muted-foreground"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-surface-soft/20 to-background">
        {/* Header with Notifications */}
        <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-xl shadow-[var(--shadow-soft)]">
          <div className="container mx-auto px-8 py-4 flex items-center justify-end max-w-7xl">
            <NotificationBell />
          </div>
        </div>
        
        <div className="container mx-auto p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
