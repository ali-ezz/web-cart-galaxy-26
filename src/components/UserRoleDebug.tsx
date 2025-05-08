
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle, ShieldAlert, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyUserConsistency } from '@/utils/authUtils';

export function UserRoleDebug() {
  const { userRole, isAuthenticated, loading, roleLoading, user, debugAuthState, fetchUserRole } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [repairing, setRepairing] = React.useState(false);
  
  const handleRefreshRole = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    await fetchUserRole(user.id);
    setRefreshing(false);
    
    toast({
      title: "Role refreshed",
      description: userRole ? `Your current role is: ${userRole}` : "No role could be detected",
    });
  };
  
  const handleRepairAccount = async () => {
    if (!user?.id) return;
    
    setRepairing(true);
    try {
      const isRepaired = await verifyUserConsistency(user.id);
      
      if (isRepaired) {
        toast({
          title: "Account verified",
          description: "Your account data has been checked and repaired if needed",
        });
        
        // Refresh role after repair
        await fetchUserRole(user.id);
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
        description: "An unexpected error occurred during account verification",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
    }
  };

  // Format debug info
  const debugInfo = debugAuthState();
  const formattedDebugInfo = JSON.stringify(debugInfo, null, 2);
  
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">User Role Status</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Authentication:</span>
            <div>
              {loading ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Checking...</span>
                </Badge>
              ) : isAuthenticated ? (
                <Badge className="bg-green-500">Authenticated</Badge>
              ) : (
                <Badge variant="destructive">Not Authenticated</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Role:</span>
            <div>
              {roleLoading ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading...</span>
                </Badge>
              ) : userRole ? (
                <Badge className="bg-blue-500">{userRole}</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500 border-orange-500">Not Set</Badge>
              )}
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">User ID:</span>
              <span className="text-xs font-mono">{user?.id?.substring(0, 8)}...</span>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={handleRefreshRole}
                disabled={refreshing || loading || repairing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh Role
                  </>
                )}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={handleRepairAccount}
                disabled={repairing || loading || refreshing}
              >
                {repairing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-3 w-3" />
                    Verify Account
                  </>
                )}
              </Button>
            </div>
          )}
          
          {isExpanded && (
            <div className="mt-4 space-y-2">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded-md overflow-auto text-xs max-h-40">
                  {formattedDebugInfo}
                </pre>
              </details>
              
              <div className="pt-2 text-xs text-gray-500 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  If your role is not showing correctly, try refreshing your role or verifying your account. 
                  If problems persist, log out and back in.
                </p>
              </div>
              
              <div className="pt-2 text-xs text-gray-500 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  SSO users (Google, GitHub, etc): Your role might be reset on first login. 
                  Use the "Verify Account" button to ensure proper role assignment.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
