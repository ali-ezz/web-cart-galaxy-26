
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Check, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  const form = useForm<ResetPasswordFormValues>();
  
  // Verify that token is present
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    } else {
      setTokenValid(true);
    }
  }, [searchParams]);
  
  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    setError('');
    
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Get token from URL
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid or missing reset token');
      setLoading(false);
      return;
    }
    
    try {
      // Use Supabase to update the password
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setError('An error occurred while resetting your password');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="mt-2 text-gray-600">
            Choose a new password for your account
          </p>
        </div>
        
        <Card className="p-8">
          {resetSuccess ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Password Reset Successful</h2>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full bg-shop-purple hover:bg-shop-purple-dark"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {!tokenValid ? (
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-50 mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
                  <p className="text-gray-600 mb-6">
                    The password reset link is invalid or has expired. Please request a new password reset link.
                  </p>
                  
                  <Button 
                    onClick={() => navigate('/forgot-password')} 
                    className="w-full bg-shop-purple hover:bg-shop-purple-dark mt-2"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              required
                              minLength={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-shop-purple hover:bg-shop-purple-dark"
                      disabled={loading}
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                  </form>
                </Form>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
