
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function DatabaseConnectionCheck() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const checkConnection = async () => {
    setStatus('checking');
    setErrorDetails(null);
    setIsRetrying(true);
    setCheckCount(prev => prev + 1);
    
    try {
      console.log(`Attempt #${checkCount + 1} to check database connection`);
      
      // First check if we can connect to Supabase API - using a basic query instead of _http_test
      const { data: apiData, error: apiError } = await supabase.from('profiles').select('count').limit(1);
      
      if (apiError) {
        console.warn('API connectivity test failed:', apiError);
        // Continue with database check anyway
      } else {
        console.log('API connectivity test successful');
      }
      
      // Simple query to test database connectivity
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        setStatus('error');
        setErrorDetails(error.message || 'Unknown database error');
        
        // Check if this is a network error
        if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
          setErrorDetails('Network error: Unable to reach the database. Please check your internet connection.');
        }
      } else {
        console.log('Database connection successful');
        setStatus('success');
      }
    } catch (err: any) {
      console.error('Failed to check database connection:', err);
      setStatus('error');
      setErrorDetails(err?.message || 'Failed to check database connection');
    } finally {
      setIsRetrying(false);
    }
  };

  // Auto retry logic for connection issues
  useEffect(() => {
    // Only auto-retry if we're already authenticated
    if (status === 'error' && !isRetrying && isAuthenticated && checkCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Auto-retrying connection check (#${checkCount + 1})`);
        checkConnection();
      }, 2000 * (checkCount + 1)); // Exponential backoff
      
      return () => clearTimeout(retryTimer);
    }
  }, [status, isRetrying, checkCount, isAuthenticated]);

  useEffect(() => {
    checkConnection();
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
              onClick={checkConnection}
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
