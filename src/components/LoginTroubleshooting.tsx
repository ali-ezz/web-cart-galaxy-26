
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Key, Shield, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginTroubleshootingProps {
  onRepair?: () => void;
}

const LoginTroubleshooting: React.FC<LoginTroubleshootingProps> = ({ onRepair }) => {
  const { toast } = useToast();
  const { user, fetchUserRole, clearAuthErrors } = useAuth();
  const [isRepairing, setIsRepairing] = React.useState(false);
  const [isRefreshingRole, setIsRefreshingRole] = React.useState(false);
  const [isResettingConnection, setIsResettingConnection] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);

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
      
      // Create a default profile if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id });
        
      if (profileError) {
        console.error("Error repairing profile:", profileError);
        toast({
          title: "Profile repair failed",
          description: "Could not create or update your profile.",
          variant: "destructive",
        });
        return;
      }
      
      // Create default role if needed
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role: 'customer' 
        });
        
      if (roleError) {
        console.error("Error repairing role:", roleError);
        toast({
          title: "Role repair failed",
          description: "Could not create or update your user role.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Account repaired",
        description: "Your account data has been checked and repaired if needed.",
      });
      
      // Refresh role after repair
      await fetchUserRole(user.id);
      
      if (onRepair) {
        onRepair();
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
      const role = await fetchUserRole(user.id);
      toast({
        title: "Role Refreshed",
        description: role 
          ? `Your user role has been refreshed to: ${role}` 
          : "Could not determine your role. A default role may be assigned.",
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
    setConnectionAttempts(prev => prev + 1);
    
    try {
      console.log("Resetting Supabase connection");
      clearAuthErrors();
      
      if (connectionAttempts >= 2) {
        // More aggressive reset - sign out and clear local storage
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        
        toast({
          title: "Full Connection Reset",
          description: "Authentication cleared. Please log in again.",
        });
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      // Try to refresh the auth session first
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        throw error;
      }
      
      // Test the connection with a simple query
      const { error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error("Connection test failed after reset:", testError);
        throw testError;
      }
      
      toast({
        title: "Connection Reset",
        description: "Database connection has been successfully reset.",
      });
    } catch (error) {
      console.error("Error resetting connection:", error);
      toast({
        title: "Connection Reset Failed",
        description: "Could not reset connection. Try the full reset option.",
        variant: "destructive",
      });
    } finally {
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
            Repairing Account...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Repair Account Data
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
            {connectionAttempts >= 2 ? 'Full Connection Reset' : 'Reset Database Connection'}
          </>
        )}
      </Button>
    </div>
  );
};

export default LoginTroubleshooting;
