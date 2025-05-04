
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define our own User type to match what we get from Supabase
interface User {
  id: string;
  name: string;
  email: string;
  role?: string; // Added role
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

  // Function to fetch user role
  const fetchUserRole = async (userId: string) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role:", error);
        return;
      }
      
      if (data) {
        setUserRole(data.role);
        return data.role;
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
    return null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata.name || 'User',
            email: session.user.email || '',
          };
          setUser(userData);
          setIsAuthenticated(true);
          
          // Fetch role with setTimeout to avoid recursive calls
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata.name || 'User',
          email: session.user.email || '',
        };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Fetch user role
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.user_metadata.name || data.user.email}!`,
        });
        
        // Fetch user role after successful login
        await fetchUserRole(data.user.id);
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
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
      // First check if this email already exists
      const { data: users } = await supabase.auth.admin.listUsers();
      
      const emailExists = users?.users.some(user => user.email === email);
      
      if (emailExists) {
        toast({
          title: "Registration Failed",
          description: "This email is already registered. Please use a different email or try to log in.",
          variant: "destructive",
        });
        return false;
      }

      // Proceed with registration if email not found
      const { data, error } = await supabase.auth.signUp({
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

      if (data.user) {
        // Store role and any role-specific questions in profiles table
        if (role !== 'admin') { // Admins are assigned manually
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ question_responses: roleQuestions || {} })
            .eq('id', data.user.id);

          if (roleError) {
            console.error("Error updating profile:", roleError);
          }

          // Create user role entry with properly typed role value
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .insert({ 
              user_id: data.user.id, 
              role: role 
            });

          if (userRoleError) {
            console.error("Error setting user role:", userRoleError);
          }
        }

        toast({
          title: "Registration Successful",
          description: `Welcome, ${name}! Please check your email to verify your account.`,
        });
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
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
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
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
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
