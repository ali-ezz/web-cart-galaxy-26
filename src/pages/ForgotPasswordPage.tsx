
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  const form = useForm<ForgotPasswordFormValues>();
  
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setError('');
    
    try {
      const success = await sendPasswordResetEmail(data.email);
      
      if (success) {
        setEmailSent(true);
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>
        
        <Card className="p-8">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mb-4">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to your email address. Please check your inbox and spam folders.
              </p>
              
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline" 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-6">
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
                    {loading ? 'Sending Email...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="text-shop-purple hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
