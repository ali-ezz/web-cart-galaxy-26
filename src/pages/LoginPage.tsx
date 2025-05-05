
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const from = location.state?.from || '/welcome';
  
  const form = useForm<LoginFormValues>();
  
  // Check if user is already authenticated, redirect to appropriate page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/welcome');
    }
  }, [isAuthenticated, navigate, userRole]);
  
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError('');
    
    try {
      // Use the auth context to log in the user
      const success = await login(data.email, data.password);
      
      if (success) {
        navigate('/welcome');
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>

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
          <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Login:</h3>
          <div className="text-sm text-gray-600">
            <p className="mb-1">Email: admin@example.com</p>
            <p className="mb-1">Password: admin123</p>
            <p className="mt-3 text-xs text-gray-500">Note: For testing only. In production, use secure credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
