
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as AuthUser } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define our own User type to match what we get from Supabase
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Extract the user_role type from Database type definition
type UserRole = Database["public"]["Enums"]["user_role"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: UserRole, roleQuestions?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  userRole: string | null;
  fetchUserRole: (userId: string) => Promise<string | null>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  // Enhanced function to fetch user role with improved error handling
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    if (!userId) {
      console.warn("fetchUserRole called with no userId");
      return null;
    }
    
    try {
      console.log(`Fetching role for user: ${userId}`);
      
      // First verify the user exists in auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData) {
        console.error("User does not exist:", userError);
        // Force logout if user doesn't exist in auth system
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setUserRole(null);
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`No role found for user ${userId}, creating default customer role`);
          // Create a default customer role for the user
          try {
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({ user_id: userId, role: 'customer' });
            
            if (insertError) {
              console.error("Error creating default role:", insertError);
              toast({
                title: "Error setting user role",
                description: "Could not set default user role. Please contact support.",
                variant: "destructive",
              });
              return 'customer'; // Still return customer as default
            }
            
            setUserRole('customer');
            return 'customer';
          } catch (insertError) {
            console.error("Exception creating default role:", insertError);
            return 'customer'; // Still return customer as default
          }
        }
        console.error("Error fetching user role:", error);
        return null;
      }
      
      if (data) {
        console.log(`Role found for user ${userId}: ${data.role}`);
        setUserRole(data.role);
        return data.role;
      } else {
        console.log(`No role data for user ${userId}, defaulting to customer`);
        setUserRole('customer');
        return 'customer';
      }
    } catch (error) {
      console.error("Exception in fetchUserRole:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state change: ${event}`, session?.user?.id || 'No user');
        
        setSession(session);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
          };
          setUser(userData);
          setIsAuthenticated(true);
          
          // Fetch user role with a delay to avoid state update issues
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            console.log(`User role after auth state change: ${role}`);
          }, 100);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Checking existing session", session?.user?.id || 'No session');
      
      if (session?.user) {
        // Verify the user still exists in the database
        try {
          const { data: userExists } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (!userExists) {
            console.warn("User found in session but not in database. Logging out.");
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
          };
          setUser(userData);
          setSession(session);
          setIsAuthenticated(true);
          
          // Fetch user role with a delay to avoid state update issues
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            console.log(`Initial role fetch complete: ${role}`);
          }, 100);
        } catch (error) {
          console.error("Error verifying user in database:", error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log(`Login attempt: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        console.log(`Login successful: ${data.user.id}`);
        
        // Verify user exists in user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();
          
        if (roleError || !roleData) {
          console.log("User not found in roles table, creating default role");
          // Create default customer role
          const { error: createRoleError } = await supabase
            .from('user_roles')
            .insert({ user_id: data.user.id, role: 'customer' });
            
          if (createRoleError) {
            console.error("Error creating default role:", createRoleError);
          }
          
          setUserRole('customer');
        } else {
          setUserRole(roleData.role);
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'}!`,
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Login exception:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole = 'customer',
    roleQuestions?: any
  ): Promise<boolean> => {
    try {
      setLoading(true);
      // First register the user
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role_request: role,
          },
          emailRedirectTo: window.location.origin + '/auth-confirmation',
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (authData.user) {
        // Create user role entry
        try {
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .insert({ 
              user_id: authData.user.id, 
              role: role 
            });

          if (userRoleError) {
            console.error("Error setting user role:", userRoleError);
            toast({
              title: "Warning",
              description: "Account created but role could not be set. Default role will be used.",
              variant: "warning",
            });
          }
        } catch (roleError: any) {
          console.error("Error setting user role:", roleError);
        }

        // Store role-specific questions if provided
        if (roleQuestions && Object.keys(roleQuestions).length > 0) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ question_responses: roleQuestions })
              .eq('id', authData.user.id);

            if (profileError) {
              console.error("Error updating profile:", profileError);
            }
          } catch (profileError: any) {
            console.error("Error updating profile:", profileError);
          }
        }

        toast({
          title: "Registration Successful",
          description: `Welcome, ${name}! Please check your email to verify your account.`,
        });
        
        // Set the user role immediately for a better user experience
        setUserRole(role);
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth-confirmation',
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      // Clear all auth state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setUserRole(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      register, 
      logout, 
      isAuthenticated,
      loading,
      userRole,
      fetchUserRole,
      sendPasswordResetEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
