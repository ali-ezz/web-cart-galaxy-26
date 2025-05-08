
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as AuthUser } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { verifyUserConsistency } from "@/utils/authUtils";

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
  roleLoading: boolean;
  userRole: string | null;
  fetchUserRole: (userId: string) => Promise<string | null>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  debugAuthState: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  // Return all auth state for debugging purposes
  const debugAuthState = () => {
    return {
      user,
      session,
      isAuthenticated,
      loading,
      roleLoading,
      userRole
    };
  };

  // Enhanced function to fetch user role with improved error handling and SSO support
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    if (!userId) {
      console.warn("fetchUserRole called with no userId");
      return null;
    }
    
    try {
      setRoleLoading(true);
      console.log(`Fetching role for user: ${userId}`);
      
      // First check if user exists in user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user role:", error);
        
        if (error.code === 'PGRST116') {
          console.warn(`No role found for user ${userId}, creating default customer role`);
          
          // Try to get role from user metadata first (for SSO users)
          let roleToAssign: UserRole = 'customer';
          
          // If we have a session, check if there's a role in user metadata
          const { data: sessionData } = await supabase.auth.getSession();
          const userMetadata = sessionData?.session?.user?.user_metadata;
          
          if (userMetadata && userMetadata.role_request) {
            console.log(`Found role_request in user metadata: ${userMetadata.role_request}`);
            // Need to ensure roleToAssign is of type UserRole
            const requestedRole = userMetadata.role_request as string;
            if (requestedRole === 'admin' || 
                requestedRole === 'customer' || 
                requestedRole === 'seller' || 
                requestedRole === 'delivery') {
              roleToAssign = requestedRole as UserRole;
            }
          }
          
          // Create a default role for the user using RPC to avoid RLS issues
          try {
            console.log(`Creating default role '${roleToAssign}' for user ${userId}`);
            const { error: repairError } = await supabase
              .rpc('repair_user_entries', { user_id: userId });
              
            if (repairError) {
              console.error("Error repairing user:", repairError);
              
              // Fallback: direct insert
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert({ 
                  user_id: userId, 
                  role: roleToAssign 
                });
              
              if (insertError) {
                console.error("Error creating default role:", insertError);
                toast({
                  title: "Error setting user role",
                  description: "Could not set default user role. Please try logging in again.",
                  variant: "destructive",
                });
                return 'customer'; // Still return customer as default
              }
            }
            
            // If role is not customer, update it after repair
            if (roleToAssign !== 'customer') {
              // Wait a bit for repair to complete
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const { error: updateError } = await supabase
                .from('user_roles')
                .update({ role: roleToAssign })
                .eq('user_id', userId);
                
              if (updateError) {
                console.error("Error updating role after repair:", updateError);
              }
            }
            
            setUserRole(roleToAssign);
            toast({
              title: "Role Assigned",
              description: `You've been assigned a ${roleToAssign} role.`
            });
            return roleToAssign;
          } catch (insertError) {
            console.error("Exception creating default role:", insertError);
            return 'customer'; // Still return customer as default
          }
        }
        
        return null;
      }
      
      if (data) {
        console.log(`Role found for user ${userId}: ${data.role}`);
        setUserRole(data.role);
        return data.role;
      } else {
        console.log(`No role data for user ${userId}, verifying consistency`);
        
        // Run a verification to ensure both profile and role are created
        const isConsistent = await verifyUserConsistency(userId);
        
        if (!isConsistent) {
          console.warn("User data consistency issues detected");
          
          // Try again after verification
          const { data: retryData, error: retryError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (retryError || !retryData) {
            toast({
              title: "Default Role Assigned",
              description: "You've been assigned a customer role by default."
            });
            setUserRole('customer');
            return 'customer';
          }
          
          setUserRole(retryData.role);
          return retryData.role;
        }
        
        setUserRole('customer');
        return 'customer';
      }
    } catch (error) {
      console.error("Exception in fetchUserRole:", error);
      return null;
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`Auth state change: ${event}`, currentSession?.user?.id || 'No user');
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Extract name from metadata with fallbacks for SSO providers
          const userName = currentSession.user.user_metadata?.name || 
                          currentSession.user.user_metadata?.full_name || 
                          currentSession.user.user_metadata?.preferred_username || 
                          currentSession.user.email?.split('@')[0] || 
                          'User';
          
          const userData = {
            id: currentSession.user.id,
            name: userName,
            email: currentSession.user.email || '',
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          
          // Handle SSO signup events
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Verify user consistency on auth state change, but don't block UI
            setTimeout(async () => {
              // Verify and repair user data if needed
              const isConsistent = await verifyUserConsistency(currentSession.user.id);
              if (isConsistent) {
                // If consistent, fetch the role
                const role = await fetchUserRole(currentSession.user.id);
                console.log(`User role after auth state change: ${role}`);
              } else {
                console.error("User data is inconsistent");
                toast({
                  title: "Account issue detected",
                  description: "There may be a problem with your account data.",
                  variant: "destructive",
                });
              }
            }, 100);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session with improved error handling
    const checkExistingSession = async () => {
      try {
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setLoading(false);
          return;
        }
        
        console.log("Checking existing session", existingSession?.user?.id || 'No session');
        
        if (existingSession?.user) {
          // Verify the user exists in the database and fix if needed
          const isConsistent = await verifyUserConsistency(existingSession.user.id);
          
          if (!isConsistent) {
            console.warn("User data is inconsistent, will auto-repair in background");
            toast({
              title: "Account verification",
              description: "We're checking your account data...",
            });
            
            // Continue with session, verification will happen in background
          }
          
          // Extract name from metadata with fallbacks for SSO providers
          const userName = existingSession.user.user_metadata?.name || 
                          existingSession.user.user_metadata?.full_name || 
                          existingSession.user.user_metadata?.preferred_username || 
                          existingSession.user.email?.split('@')[0] || 
                          'User';
          
          const userData = {
            id: existingSession.user.id,
            name: userName,
            email: existingSession.user.email || '',
          };
          
          setUser(userData);
          setSession(existingSession);
          setIsAuthenticated(true);
          
          // Fetch user role with a delay to avoid state update issues
          setTimeout(async () => {
            const role = await fetchUserRole(existingSession.user.id);
            console.log(`Initial role fetch complete: ${role}`);
          }, 100);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking session:", error);
        setLoading(false);
      }
    };
    
    checkExistingSession();

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
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
        
        // Verify user consistency after login
        const isConsistent = await verifyUserConsistency(data.user.id);
        
        if (!isConsistent) {
          console.warn("User data inconsistency detected during login");
          toast({
            title: "Account Issue",
            description: "We detected an issue with your account data which has been auto-repaired.",
          });
        }
        
        // Fetch or create role
        const role = await fetchUserRole(data.user.id);
        
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
            
            // Try a second time with a small delay
            setTimeout(async () => {
              const { error: retryError } = await supabase
                .from('user_roles')
                .insert({ 
                  user_id: authData.user.id, 
                  role: role 
                });
                
              if (retryError) {
                console.error("Second attempt to set role failed:", retryError);
                toast({
                  title: "Warning",
                  description: "Account created but role could not be set. Default role will be used.",
                  variant: "default",
                });
              } else {
                console.log("Second attempt to set role succeeded");
                setUserRole(role);
              }
            }, 500);
          } else {
            setUserRole(role);
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
      roleLoading,
      userRole,
      fetchUserRole,
      sendPasswordResetEmail,
      debugAuthState
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
