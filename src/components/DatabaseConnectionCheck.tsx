
import React, { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

interface ApiResult {
  error?: PostgrestError | Error | unknown;
  data?: any;
}

export function DatabaseConnectionCheck() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Improved connection check with better timeout handling
  const checkConnectionWithTimeout = async () => {
    setStatus('checking');
    setErrorDetails(null);
    setIsRetrying(true);
    setCheckCount(prev => prev + 1);
    
    try {
      console.log(`Database check attempt #${checkCount + 1}`);
      
      // Use improved connection check function with retries
      const { success, error } = await checkSupabaseConnection();
      
      if (!success) {
        console.warn('Database connection failed:', error);
        setStatus('error');
        
        // Provide more specific error messages based on error type
        if (error instanceof Error) {
          setErrorDetails(error.message);
        } else if (typeof error === 'object' && error !== null) {
          const pgError = error as PostgrestError;
          setErrorDetails(pgError.message || pgError.details || 'Unknown database error');
          
          // Check if this is a network error
          if (pgError.message?.includes('network') || pgError.code === 'NETWORK_ERROR') {
            setErrorDetails('Network error: Unable to reach the database. Please check your internet connection.');
          }
          // Check if this is an authentication error
          else if (pgError.code === '401' || pgError.code === '403') {
            setErrorDetails('Authentication error: Unable to access the database. Please log out and back in.');
          }
        } else {
          setErrorDetails('Unknown error connecting to database');
        }

        // Notify user about connection issues
        toast({
          title: "Database Connection Issue",
          description: "There was a problem connecting to the database. Retrying...",
          variant: "destructive",
        });
      } else {
        console.log('Database connection successful');
        setStatus('success');
        
        // Clear any existing toasts about connection issues
        if (checkCount > 0) {
          toast({
            title: "Connection Restored",
            description: "Database connection has been established successfully.",
            variant: "default",
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to check database connection:', err);
      setStatus('error');
      setErrorDetails(err?.message || 'Failed to check database connection');
      
      // Notify user about connection issues
      toast({
        title: "Connection Error",
        description: err?.message || "Failed to connect to the database",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // More aggressive auto retry logic with smarter backoff
  useEffect(() => {
    // Only auto-retry if we're already authenticated or it's an error
    if ((status === 'error' || !status) && !isRetrying) {
      // Calculate backoff delay with upper limit and random jitter for better distribution
      const maxRetries = 8;
      if (checkCount < maxRetries) {
        const baseDelay = Math.min(1000 * (1.5 ** checkCount), 15000); 
        const jitter = Math.random() * 1000;
        const retryDelay = baseDelay + jitter;
        
        console.log(`Scheduling auto-retry #${checkCount + 1} in ${Math.round(retryDelay)}ms`);
        const retryTimer = setTimeout(() => {
          console.log(`Auto-retrying connection check (#${checkCount + 1})`);
          checkConnectionWithTimeout();
        }, retryDelay);
        
        return () => clearTimeout(retryTimer);
      } else {
        console.log(`Reached maximum retry attempts (${maxRetries})`);
      }
    }
  }, [status, isRetrying, checkCount, isAuthenticated]);

  useEffect(() => {
    checkConnectionWithTimeout();
    
    // Set up a regular polling interval to keep checking the connection
    const checkInterval = setInterval(() => {
      if (!isRetrying && status === 'error') {
        checkConnectionWithTimeout();
      }
    }, 15000); // Check every 15 seconds if we're in error state
    
    return () => clearInterval(checkInterval);
  }, []);

  if (status === 'success') {
    return (
      <Alert className="bg-green-50 border-green-200 mb-4">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Database Connected</AlertTitle>
        <AlertDescription className="text-green-600">
          Your application is successfully connected to the database.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Database Connection Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Unable to connect to the database. This may cause functionality issues.</p>
          {errorDetails && (
            <div className="text-xs bg-red-50 p-2 rounded overflow-auto max-w-full">
              <strong>Error:</strong> {errorDetails}
            </div>
          )}
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkConnectionWithTimeout}
              disabled={isRetrying}
              className="mt-2"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Checking state
  return (
    <Alert className="bg-blue-50 border-blue-200 mb-4">
      <Wifi className="h-4 w-4 text-blue-500 animate-pulse" />
      <AlertTitle className="text-blue-700">Checking Database Connection</AlertTitle>
      <AlertDescription className="text-blue-600">
        Verifying connection to the database...
      </AlertDescription>
    </Alert>
  );
}
