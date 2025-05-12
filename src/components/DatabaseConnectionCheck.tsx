
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export const DatabaseConnectionCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(true);

  const checkConnection = async () => {
    setStatus('checking');
    setErrorMessage(null);
    
    try {
      // Simple query to check if the connection works
      const { data, error } = await supabase
        .from('user_roles')
        .select('count(*)')
        .limit(1)
        .single();
        
      if (error) {
        console.error("Database connection error:", error);
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }
      
      setStatus('connected');
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        if (status === 'connected') {
          setShowAlert(false);
        }
      }, 5000);
    } catch (err: any) {
      console.error("Unexpected database error:", err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (!showAlert) {
    return null;
  }

  return (
    <>
      {status === 'checking' && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
            <AlertTitle>Checking database connection...</AlertTitle>
          </div>
        </Alert>
      )}
      
      {status === 'connected' && (
        <Alert className="bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <AlertTitle>Connected to database</AlertTitle>
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}
      
      {status === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle>Database connection error</AlertTitle>
          <AlertDescription className="mt-2">
            {errorMessage || 'Could not connect to the database'}
          </AlertDescription>
          <div className="mt-3">
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 text-xs"
              onClick={checkConnection}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Try Again
            </Button>
          </div>
        </Alert>
      )}
    </>
  );
};
