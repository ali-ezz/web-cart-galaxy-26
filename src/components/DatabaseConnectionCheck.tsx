
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseCheckResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

export function DatabaseConnectionCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkResults, setCheckResults] = useState<DatabaseCheckResult[]>([]);
  const { toast } = useToast();
  
  const checkConnection = async () => {
    setIsChecking(true);
    setErrorMessage(null);
    
    const checkResult: DatabaseCheckResult = {
      success: false,
      message: "",
      timestamp: new Date()
    };
    
    try {
      // Check 1: Simple query to verify database connection
      console.log("Testing database connection with simple query");
      const { data: testData, error: testError } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error("Database connection test failed:", testError);
        checkResult.message = "Connection test failed: " + testError.message;
        checkResult.details = testError;
        throw testError;
      }
      
      // Check 2: Verify authentication state
      console.log("Checking authentication state");
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error("Authentication check failed:", authError);
        checkResult.message = "Auth check failed: " + authError.message;
        checkResult.details = authError;
        throw authError;
      }
      
      // Check 3: Test RLS with user-specific data
      console.log("Testing Row Level Security with user-specific data");
      if (authData?.session?.user) {
        const { data: rlsData, error: rlsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.session.user.id)
          .maybeSingle();
          
        if (rlsError && rlsError.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error("RLS check failed:", rlsError);
          checkResult.message = "RLS check failed: " + rlsError.message;
          checkResult.details = rlsError;
          throw rlsError;
        }
      }
      
      // All checks passed
      setConnectionOk(true);
      checkResult.success = true;
      checkResult.message = "All connection checks passed";
      
      toast({
        title: "Database Connection Verified",
        description: "Connection to Supabase is working properly.",
      });
    } catch (err: any) {
      console.error("Exception checking database:", err);
      setConnectionOk(false);
      
      if (!checkResult.message) {
        checkResult.message = err.message || "Unknown error occurred";
      }
      
      setErrorMessage(checkResult.message);
      
      toast({
        title: "Database Connection Failed",
        description: checkResult.message,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
      setCheckResults(prev => [checkResult, ...prev].slice(0, 5));
    }
  };
  
  useEffect(() => {
    // Check connection when the component mounts
    checkConnection();
    
    // Set up a heartbeat check every 60 seconds
    const interval = setInterval(() => {
      if (!isChecking) {
        checkConnection();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {isChecking ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking database connection...</span>
            </div>
          ) : connectionOk === null ? (
            <div className="text-sm text-gray-500">Initializing connection check...</div>
          ) : connectionOk ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Database connection successful</span>
            </div>
          ) : (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{errorMessage || "Could not connect to the database"}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection}
            disabled={isChecking}
            className="mt-2 w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Check Connection
              </>
            )}
          </Button>
          
          {!connectionOk && !isChecking && (
            <div className="text-xs text-gray-500 mt-2">
              If connection fails repeatedly, verify your network connection and try logging out and back in.
            </div>
          )}
          
          {checkResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium mb-1">Recent Connection Checks:</h4>
              <div className="text-xs space-y-1">
                {checkResults.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    {result.success ? 
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    }
                    <span className={result.success ? "text-green-600" : "text-amber-500"}>
                      {result.timestamp.toLocaleTimeString()}: {result.message.substring(0, 60)}
                      {result.message.length > 60 ? '...' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
