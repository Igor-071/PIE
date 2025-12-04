import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppRole = "clinic_admin" | "provider" | "assistant" | "read_only" | "patient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch user role (RLS policy may be missing):", error.message);
        // Return null instead of throwing - app will work without roles
        return null;
      }
      return data?.role as AppRole | null;
    } catch (error) {
      console.warn("Error fetching user role:", error);
      // Return null instead of blocking - app will work without roles
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Failsafe timeout - if auth doesn't initialize in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth initialization timeout - proceeding without auth");
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log("Auth state change:", event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer role fetch to prevent deadlock
        setTimeout(async () => {
          try {
            const userRole = await fetchUserRole(session.user.id);
            setRole(userRole);
            console.log("User role:", userRole || "none (will use defaults)");
          } catch (err) {
            console.warn("Role fetch failed, continuing without role");
            setRole(null);
          }
        }, 0);
      } else {
        setRole(null);
      }

      setLoading(false);
      clearTimeout(timeout);
    });

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
        }
        
        console.log("Initial session check:", session?.user?.email || "no session");
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer role fetch to prevent any potential issues
          setTimeout(async () => {
            try {
              const userRole = await fetchUserRole(session.user.id);
              setRole(userRole);
              console.log("Initial user role:", userRole || "none");
            } catch (err) {
              console.warn("Role fetch failed during init, continuing without role");
              setRole(null);
            }
          }, 0);
        }

        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((error) => {
        if (!mounted) return;
        
        console.error("Fatal error initializing auth:", error);
        // Still set loading to false so app doesn't hang
        setLoading(false);
        clearTimeout(timeout);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Create user role
      if (data.user) {
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: role,
        });

        if (roleError) {
          toast({
            title: "Role assignment failed",
            description: roleError.message,
            variant: "destructive",
          });
          return { error: roleError };
        }
      }

      toast({
        title: "Account created",
        description: "You can now sign in with your credentials.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
