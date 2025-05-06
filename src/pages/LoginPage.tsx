
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";

// Create a schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize form with Zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // First verify if the session is valid before checking authentication
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Clear any existing errors
        setError('');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          // Verify user exists in database
          const { data: userData, error: userError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .maybeSingle();
          
          if (userError && userError.code !== 'PGRST116') {
            console.warn("Error verifying user in database:", userError);
            await supabase.auth.signOut();
          } else if (!userData) {
            console.log("Creating default role for user");
            // User doesn't have a role yet, create one
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({ user_id: data.session.user.id, role: 'customer' });
              
            if (insertError) {
              console.error("Error creating default role:", insertError);
              await supabase.auth.signOut();
            }
          }
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      } finally {
        setVerifyingSession(false);
      }
    };
    
    verifySession();
  }, []);
  
  // Check if user is already authenticated, redirect to appropriate page
  useEffect(() => {
    if (!verifyingSession && isAuthenticated) {
      const redirectTo = location.state?.from || (userRole ? getRoleBasedRedirect(userRole) : '/welcome');
      console.log(`User authenticated, redirecting to: ${redirectTo}`);
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, userRole, location.state, verifyingSession]);
  
  // Helper function to determine where to redirect based on user role
  const getRoleBasedRedirect = (role: string): string => {
    switch(role) {
      case 'admin': return '/admin';
      case 'seller': return '/seller';
      case 'delivery': return '/delivery';
      case 'customer': return '/';
      default: return '/welcome';
    }
  };
  
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError('');
    
    try {
      console.log("Attempting login with:", data.email);
      const success = await login(data.email, data.password);
      
      if (success) {
        // Login succeeded, will be redirected by the useEffect above
        console.log("Login successful");
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
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
              <AlertDescription>{error}</AlertDescription>
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
                  disabled={loading}
                >
                  {loading ? (
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
