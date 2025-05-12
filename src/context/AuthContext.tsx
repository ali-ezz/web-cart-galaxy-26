
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as AuthUser } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

// Define our own User type to match what we get from Supabase
interface User {
  id: string;
  name: string;
  email: string;
}

// Extract the user_role type from Database type definition
type UserRole = Database["public"]["Enums"]["user_role"];

// Define the states for the authentication process
type AuthState = 
  | 'initializing' 
  | 'authenticated' 
  | 'unauthenticated'
  | 'error';

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
  authState: AuthState;
  clearAuthErrors: () => void;
  debugAuthState: () => Record<string, any>; // Add the missing function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to extract user name from user metadata with fallbacks
const extractUserName = (user: AuthUser): string => {
  return user.user_metadata?.name || 
         user.user_metadata?.full_name || 
         user.user_metadata?.preferred_username || 
         user.email?.split('@')[0] || 
         'User';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Tracking variables
  const [sessionChecked, setSessionChecked] = useState(false);
  const [roleFetchAttempts, setRoleFetchAttempts] = useState(0);
  
  const { toast } = useToast();

  // Clear any authentication errors
  const clearAuthErrors = () => {
    setAuthError(null);
  };

  // Debug function to get current auth state for debugging
  const debugAuthState = () => {
    return {
      user,
      isAuthenticated,
      authState,
      userRole,
      sessionChecked,
      roleFetchAttempts,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      error: authError
    };
  };

  // Enhanced function to fetch user role with improved error handling and SSO support
  const fetchUserRole = useCallback(async (userId: string): Promise<string | null> => {
    if (!userId) {
      console.warn("fetchUserRole called with no userId");
      return null;
    }
    
    try {
      setRoleLoading(true);
      console.log(`Fetching role for user: ${userId}`);
      
      // Fetch user role with explicit ordering to ensure we get the most recent role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user role:", error);
        
        // If no role found, try automatic repair
        if (error.code === 'PGRST116') {
          console.warn(`No role found for user ${userId}, creating default role`);
          
          // Create a default role for the user
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'customer' });
            
          if (insertError) {
            console.error("Failed to create default role:", insertError);
            return null;
          }
          
          setUserRole('customer');
          return 'customer';
        }
        
        return null;
      }
      
      if (data) {
        console.log(`Role found for user ${userId}: ${data.role}`);
        setUserRole(data.role);
        return data.role;
      } else {
        console.log(`No role data for user ${userId}, creating default role`);
        
        // Create a default role for the user if none exists
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'customer' });
          
        if (insertError) {
          console.error("Failed to create default role:", insertError);
          return null;
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
  }, []);

  // Simplified auth state initialization
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log(`Auth state change: ${event}`, currentSession?.user?.id || 'No user');
            
            // Always update the session state
            setSession(currentSession);
            
            if (currentSession?.user) {
              // Extract user info
              const userName = extractUserName(currentSession.user);
              
              const userData = {
                id: currentSession.user.id,
                name: userName,
                email: currentSession.user.email || '',
              };
              
              setUser(userData);
              setIsAuthenticated(true);
              setAuthState('authenticated');
              setRoleFetchAttempts(0);
              
              // Fetch user role if not already loaded
              if (!userRole) {
                const role = await fetchUserRole(currentSession.user.id);
                console.log(`User role after auth state change: ${role}`);
              }
            } else {
              setUser(null);
              setIsAuthenticated(false);
              setUserRole(null);
              setAuthState('unauthenticated');
              setRoleFetchAttempts(0);
            }
          }
        );

        // THEN check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          setAuthState('error');
          setAuthError(error.message);
        } else {
          if (data.session) {
            const currentUser = data.session.user;
            
            // Extract user info
            const userName = extractUserName(currentUser);
            
            const userData = {
              id: currentUser.id,
              name: userName,
              email: currentUser.email || '',
            };
            
            setUser(userData);
            setSession(data.session);
            setIsAuthenticated(true);
            setAuthState('authenticated');
            
            // Fetch user role
            const role = await fetchUserRole(currentUser.id);
            console.log(`Initial role fetch complete: ${role}`);
          } else {
            setAuthState('unauthenticated');
          }
        }
        
        setSessionChecked(true);
        setLoading(false);
      } catch (error) {
        console.error("Critical error during auth initialization:", error);
        setAuthState('error');
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [fetchUserRole]);

  // Add retry mechanism for role fetching with exponential backoff
  useEffect(() => {
    if (isAuthenticated && user?.id && !userRole && roleFetchAttempts < 3 && authState === 'authenticated') {
      const fetchRoleWithRetry = async () => {
        try {
          const role = await fetchUserRole(user.id);
          if (!role) {
            setRoleFetchAttempts(prev => prev + 1);
            console.log(`Role fetch attempt ${roleFetchAttempts + 1} failed`);
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setRoleFetchAttempts(prev => prev + 1);
        }
      };
      
      // Wait longer between retries with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, roleFetchAttempts), 8000);
      console.log(`Scheduling role fetch retry in ${delay}ms`);
      const timer = setTimeout(fetchRoleWithRetry, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, userRole, roleFetchAttempts, authState, fetchUserRole]);

  // Authentication methods
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthError(null);
      console.log(`Login attempt: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        setAuthError(error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        console.log(`Login successful: ${data.user.id}`);
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${extractUserName(data.user)}!`,
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Login exception:", error);
      setAuthError(error.message || "An unexpected error occurred");
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
      setAuthError(null);
      
      // First register the user
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role_request: role, // Store requested role in metadata
          },
          emailRedirectTo: window.location.origin + '/auth-confirmation',
        },
      });

      if (error) {
        setAuthError(error.message);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (authData.user) {
        // Store role-specific questions if provided
        if (roleQuestions && Object.keys(roleQuestions).length > 0) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({ 
                id: authData.user.id,
                first_name: name.split(' ')[0],
                last_name: name.split(' ').slice(1).join(' '),
                question_responses: roleQuestions 
              });

            if (profileError) {
              console.error("Error updating profile:", profileError);
            }
          } catch (profileError: any) {
            console.error("Error updating profile:", profileError);
          }
        }

        toast({
          title: "Registration Successful",
          description: `Welcome, ${name}! Your account has been created with ${role} role.`,
        });
        
        // Set the user role immediately for a better user experience
        setUserRole(role);
        return true;
      }

      return false;
    } catch (error: any) {
      setAuthError(error.message || "An unexpected error occurred");
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
      setAuthError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth-confirmation',
      });

      if (error) {
        setAuthError(error.message);
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
      setAuthError(error.message || "An unexpected error occurred");
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
      setAuthError(null);
      
      await supabase.auth.signOut();
      
      // Clear all auth state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setRoleFetchAttempts(0);
      setAuthState('unauthenticated');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      setAuthError(error.message || "An unexpected error occurred");
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
      authState,
      clearAuthErrors,
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
