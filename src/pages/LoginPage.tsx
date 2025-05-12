
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import LoginTroubleshooting from "@/components/LoginTroubleshooting";

// Create a schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, userRole, loading, user, fetchUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [lastRedirectTime, setLastRedirectTime] = useState<number | null>(null);
  const [roleCheckCompleted, setRoleCheckCompleted] = useState(false);
  
  // Initialize form with Zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  useEffect(() => {
    console.log("LoginPage state:", { isAuthenticated, userRole, loading, userId: user?.id, roleCheckCompleted });
  }, [isAuthenticated, userRole, loading, user, roleCheckCompleted]);
  
  // First verify if the session is valid before checking authentication
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Clear any existing errors
        setError('');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("Active session found in LoginPage");
          // Setting verified to trigger the redirect flow below
          setRoleCheckCompleted(true);
        }
      } catch (err) {
        console.error("Error verifying session:", err);
        setShowTroubleshooting(true);
      } finally {
        setVerifyingSession(false);
      }
    };
    
    verifySession();
  }, []);
  
  // Fetch role when user is authenticated but role is missing
  useEffect(() => {
    if (isAuthenticated && user?.id && !userRole && !roleCheckCompleted) {
      const fetchRole = async () => {
        try {
          console.log("Fetching role for authenticated user");
          const role = await fetchUserRole(user.id);
          if (role) {
            console.log("Role fetched successfully:", role);
            setRoleCheckCompleted(true);
          }
        } catch (err) {
          console.error("Error fetching role:", err);
        }
      };
      
      fetchRole();
    }
  }, [isAuthenticated, user, userRole, fetchUserRole, roleCheckCompleted]);
  
  // Improved check if user is already authenticated, redirect to appropriate page
  useEffect(() => {
    const now = Date.now();
    
    // Prevent multiple redirects within a short time window
    if (lastRedirectTime && now - lastRedirectTime < 2000) {
      console.log("Preventing rapid redirects");
      return;
    }
    
    if (!loading && !verifyingSession && isAuthenticated) {
      console.log("Auth state detected in LoginPage, preparing for redirect with role:", userRole);
      
      // Set the redirect time to prevent multiple redirects
      setLastRedirectTime(now);
      
      // Add a deliberate delay to ensure roles are properly loaded
      setTimeout(() => {
        const redirectTo = location.state?.from || getRoleBasedRedirect(userRole);
        console.log(`User authenticated, redirecting to: ${redirectTo}`);
        
        navigate(redirectTo, { replace: true });
      }, 500);
    }
  }, [isAuthenticated, verifyingSession, userRole, loading, navigate, location.state, lastRedirectTime, roleCheckCompleted]);
  
  // Helper function to determine where to redirect based on user role
  const getRoleBasedRedirect = (role: string | null): string => {
    if (!role) return '/welcome'; // Send to welcome page if role is not yet loaded
    
    switch(role) {
      case 'admin': return '/admin';
      case 'seller': return '/seller';
      case 'delivery': return '/delivery';
      case 'customer': return '/';
      default: return '/welcome';
    }
  };
  
  // Function to handle retry for database connection issues
  const handleRetry = async () => {
    setError('');
    setRetryCount(prev => prev + 1);
    
    try {
      // Force refresh the session
      await supabase.auth.refreshSession();
      setVerifyingSession(true);
      
      // Short timeout before checking session again
      setTimeout(async () => {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          console.log("Session refreshed successfully");
          setRoleCheckCompleted(false); // Reset role check to trigger redirection
        } else {
          setVerifyingSession(false);
          setError("Session refresh failed. Please try logging in again.");
        }
      }, 500);
    } catch (err) {
      console.error("Error during retry:", err);
      setVerifyingSession(false);
      setError("Retry failed. Please try logging in again.");
    }
  };
  
  const onSubmit = async (data: LoginFormValues) => {
    if (isLoggingIn) return; // Prevent duplicate submissions
    
    setIsLoggingIn(true);
    setError('');
    
    try {
      console.log("Attempting login with:", data.email);
      const success = await login(data.email, data.password);
      
      if (success) {
        // Login succeeded, will be redirected by the useEffect above
        console.log("Login successful");
        toast({
          title: "Login successful",
          description: "Redirecting you to your dashboard...",
          variant: "default"
        });
        
        // Reset role check to trigger the redirection useEffect
        setRoleCheckCompleted(false);
      } else {
        setError('Invalid email or password');
        setShowTroubleshooting(true);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setShowTroubleshooting(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Sign in to your account
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("connection") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry} 
                    className="mt-2"
                    disabled={isLoggingIn}
                  >
                    Retry Connection
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {verifyingSession ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
              <p className="ml-2">Verifying session...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <Link to="/forgot-password" className="text-sm text-shop-purple hover:underline">
                          Forgot Password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-shop-purple hover:bg-shop-purple-dark py-6"
                  disabled={isLoggingIn || loading}
                >
                  {isLoggingIn || loading ? (
                    <> 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                    </>
                  ) : 'Sign In'}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-shop-purple hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {(showTroubleshooting || error) && (
            <div className="mt-6">
              <LoginTroubleshooting />
            </div>
          )}
        </div>

        {/* Demo accounts section */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
          <div className="text-sm text-gray-600 space-y-3">
            <div>
              <p className="font-medium">Admin:</p>
              <p className="mb-1">Email: admin@example.com</p>
              <p>Password: admin123</p>
            </div>
            <div>
              <p className="font-medium">Seller:</p>
              <p className="mb-1">Email: seller@example.com</p>
              <p>Password: seller123</p>
            </div>
            <div>
              <p className="font-medium">Customer:</p>
              <p className="mb-1">Email: customer@example.com</p>
              <p>Password: customer123</p>
            </div>
            <p className="mt-3 text-xs text-gray-500">Note: For testing only. In production, use secure credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
