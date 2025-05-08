
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Key, Shield, RotateCw } from 'lucide-react';
import { verifyUserConsistency } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';

interface LoginTroubleshootingProps {
  onRepair?: () => void;
}

const LoginTroubleshooting: React.FC<LoginTroubleshootingProps> = ({ onRepair }) => {
  const { toast } = useToast();
  const { user, fetchUserRole, userRole } = useAuth();
  const [isRepairing, setIsRepairing] = React.useState(false);
  const [isRefreshingRole, setIsRefreshingRole] = React.useState(false);
  const [isResettingConnection, setIsResettingConnection] = React.useState(false);

  const handleRepairAccount = async () => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to repair your account.",
        variant: "destructive",
      });
      return;
    }

    setIsRepairing(true);
    try {
      console.log("Starting account verification for user:", user.id);
      const isRepaired = await verifyUserConsistency(user.id);
      if (isRepaired) {
        toast({
          title: "Account verified",
          description: "Your account data has been checked and repaired if needed.",
        });
        
        // Refresh role after repair
        await fetchUserRole(user.id);
        
        if (onRepair) {
          onRepair();
        }
      } else {
        toast({
          title: "Verification failed",
          description: "Could not verify account data. Try logging out and back in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error repairing account:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during account verification.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };
  
  const handleRefreshRole = async () => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to refresh your role.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRefreshingRole(true);
    try {
      console.log("Refreshing role for user:", user.id);
      await fetchUserRole(user.id);
      toast({
        title: "Role Refreshed",
        description: "Your user role has been refreshed. Please check your dashboard.",
      });
    } catch (error) {
      console.error("Error refreshing role:", error);
      toast({
        title: "Error",
        description: "Failed to refresh role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingRole(false);
    }
  };
  
  const handleResetConnection = async () => {
    setIsResettingConnection(true);
    try {
      console.log("Resetting Supabase connection");
      
      // Sign out and clear local storage to reset connection state
      await supabase.auth.signOut();
      
      // Clear any cached data that might be causing issues
      localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Connection Reset",
        description: "Database connection has been reset. Please log in again.",
      });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
    } catch (error) {
      console.error("Error resetting connection:", error);
      toast({
        title: "Error",
        description: "Failed to reset connection. Please try again.",
        variant: "destructive",
      });
      setIsResettingConnection(false);
    }
  };

  return (
    <div className="space-y-3">
      <Alert className="bg-blue-50 border border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Having trouble logging in or accessing your dashboard? Try these steps:
        </AlertDescription>
      </Alert>

      <Button variant="outline" className="w-full justify-start" onClick={handleRefreshRole} disabled={isRefreshingRole}>
        {isRefreshingRole ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Refreshing Role...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh User Role
          </>
        )}
      </Button>

      <Button variant="outline" className="w-full justify-start" onClick={handleRepairAccount} disabled={isRepairing}>
        {isRepairing ? (
          <>
            <Key className="mr-2 h-4 w-4 animate-spin" />
            Verifying Account...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Verify Account Data
          </>
        )}
      </Button>
      
      <Button variant="outline" className="w-full justify-start" onClick={handleResetConnection} disabled={isResettingConnection}>
        {isResettingConnection ? (
          <>
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            Resetting Connection...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Reset Database Connection
          </>
        )}
      </Button>
    </div>
  );
};

export default LoginTroubleshooting;
