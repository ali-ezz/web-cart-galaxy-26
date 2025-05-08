
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, Database, CheckCircle2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function DatabaseConnectionCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const checkConnection = async () => {
    setIsChecking(true);
    setErrorMessage(null);
    
    try {
      // Simple query to check database connection
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error("Database connection error:", error);
        setConnectionOk(false);
        setErrorMessage(error.message);
        toast({
          title: "Database Connection Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setConnectionOk(true);
        toast({
          title: "Database Connection Successful",
          description: "Connection to Supabase is working properly.",
        });
      }
    } catch (err: any) {
      console.error("Exception checking database:", err);
      setConnectionOk(false);
      setErrorMessage(err.message || "Unknown error occurred");
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    // Check connection when the component mounts
    checkConnection();
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
              If connection fails repeatedly, try logging out and back in, or contact support.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
