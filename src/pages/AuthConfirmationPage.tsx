
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, AlertCircle, MailOpen, Loader2, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuthConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const confirmEmail = async () => {
      // Get the token and type from the URL
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      // If no token or type is provided, show the check email page instead of an error
      if (!token || !type) {
        setStatus('error');
        setMessage('Please check your email inbox and spam folder for the verification link.');
        return;
      }

      if (type === 'email_change') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email_change',
          });

          if (error) {
            setStatus('error');
            setMessage(error.message);
          } else {
            setStatus('success');
            setMessage('Email successfully verified!');
          }
        } catch (err) {
          setStatus('error');
          setMessage('An unexpected error occurred.');
          console.error('Verification error:', err);
        }
      } else if (type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          });

          if (error) {
            setStatus('error');
            setMessage(error.message);
          } else {
            setStatus('success');
            setMessage('Email successfully verified! You can now sign in.');
          }
        } catch (err) {
          setStatus('error');
          setMessage('An unexpected error occurred.');
          console.error('Verification error:', err);
        }
      } else if (type === 'recovery') {
        try {
          // For password recovery links
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (error) {
            setStatus('error');
            setMessage(error.message);
          } else {
            setStatus('success');
            setMessage('Password reset link verified. You can now set a new password.');
            // Redirect to a password reset page with the token
            navigate(`/reset-password?token=${token}`);
            return;
          }
        } catch (err) {
          setStatus('error');
          setMessage('An unexpected error occurred.');
          console.error('Verification error:', err);
        }
      } else {
        setStatus('error');
        setMessage(`Invalid verification type: ${type}`);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  // Check if no token or type was provided - show the check email page
  const noTokenProvided = !searchParams.get('token') || !searchParams.get('type');

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-50 mb-4">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
          )}
          
          {status === 'error' && noTokenProvided && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-50 mb-4">
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          )}
          
          {status === 'error' && !noTokenProvided && (
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-50 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && noTokenProvided && 'Check Your Email'}
            {status === 'error' && !noTokenProvided && 'Verification Failed'}
          </h2>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {status !== 'loading' && (
            <div className="space-y-4">
              {status === 'success' && (
                <Button 
                  className="w-full" 
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              )}
              
              {status === 'error' && noTokenProvided && (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200 text-left">
                    <MailOpen className="h-5 w-5 text-blue-500" />
                    <AlertTitle className="text-blue-700">Check your email</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      We've sent you a verification email. Click the link in the email to verify your account.
                      Don't forget to check your spam folder.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/login')}
                  >
                    Return to Sign In
                  </Button>
                </div>
              )}
              
              {status === 'error' && !noTokenProvided && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/login')}
                  >
                    Go to Sign In
                  </Button>
                  <p className="text-sm text-gray-500">
                    If you continue to have issues, please contact support.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
