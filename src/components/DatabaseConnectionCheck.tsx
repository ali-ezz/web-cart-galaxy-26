
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DatabaseConnectionCheck() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    setStatus('checking');
    setErrorDetails(null);
    setIsRetrying(true);
    
    try {
      // Simple query to test database connectivity
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        setStatus('error');
        setErrorDetails(error.message || 'Unknown database error');
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
        <AlertCircle className="h-4 w-4" />
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
      <Database className="h-4 w-4 text-blue-500 animate-pulse" />
      <AlertTitle className="text-blue-700">Checking Database Connection</AlertTitle>
      <AlertDescription className="text-blue-600">
        Verifying connection to the database...
      </AlertDescription>
    </Alert>
  );
}
