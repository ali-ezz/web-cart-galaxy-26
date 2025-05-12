import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

interface ApiResult {
  error?: PostgrestError;
  data?: any;
}

export function DatabaseConnectionCheck() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Add a timeout control for the database connection checks
  const checkConnectionWithTimeout = async () => {
    setStatus('checking');
    setErrorDetails(null);
    setIsRetrying(true);
    setCheckCount(prev => prev + 1);
    
    // Create a timeout promise that rejects after 5 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timed out after 5 seconds')), 5000);
    });
    
    try {
      console.log(`Attempt #${checkCount + 1} to check database connection`);
      
      // Use Promise.race to implement timeout
      const apiCheckPromise = supabase.from('profiles').select('id').limit(1);
      const apiResult = await Promise.race([apiCheckPromise, timeoutPromise]) as ApiResult;
      
      if (apiResult.error) {
        console.warn('API connectivity test failed:', apiResult.error);
        throw apiResult.error;
      } else {
        console.log('API connectivity test successful');
      }
      
      // Simple query to test database connectivity with timeout
      const dbCheckPromise = supabase.from('profiles').select('id').limit(1);
      const dbResult = await Promise.race([dbCheckPromise, timeoutPromise]) as ApiResult;
      
      if (dbResult.error) {
        console.error('Database connection error:', dbResult.error);
        setStatus('error');
        setErrorDetails(dbResult.error.message || 'Unknown database error');
        
        // Check if this is a network error
        if (dbResult.error.message?.includes('network') || dbResult.error.code === 'NETWORK_ERROR') {
          setErrorDetails('Network error: Unable to reach the database. Please check your internet connection.');
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

  // More aggressive auto retry logic for connection issues
  useEffect(() => {
    // Only auto-retry if we're already authenticated or it's an error
    if ((status === 'error' || !status) && !isRetrying && checkCount < 5) {
      const retryDelay = Math.min(1000 * (checkCount + 1), 5000); // Exponential backoff with a max of 5 seconds
      
      console.log(`Scheduling auto-retry #${checkCount + 1} in ${retryDelay}ms`);
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying connection check (#${checkCount + 1})`);
        checkConnectionWithTimeout();
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [status, isRetrying, checkCount, isAuthenticated]);

  useEffect(() => {
    checkConnectionWithTimeout();
    
    // Set up a regular polling interval to keep checking the connection
    const checkInterval = setInterval(() => {
      if (!isRetrying && status === 'error') {
        checkConnectionWithTimeout();
      }
    }, 10000); // Check every 10 seconds if we're in error state
    
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
