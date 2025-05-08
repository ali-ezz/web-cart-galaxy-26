
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { verifyUserConsistency } from "@/utils/authUtils";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const { isAuthenticated, userRole, loading, user, session, fetchUserRole } = useAuth();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingRole, setRefreshingRole] = useState(false);

  // Log component state for debugging
  useEffect(() => {
    console.log("Index page state:", { isAuthenticated, userRole, loading, verifying, user });
  }, [isAuthenticated, userRole, loading, verifying, user]);

  // Handle manual role refresh
  const handleRefreshRole = async () => {
    if (!user?.id) return;
    
    setRefreshingRole(true);
    setError(null);
    try {
      const role = await fetchUserRole(user.id);
      toast({
        title: "Role Updated",
        description: role ? `Your current role is: ${role}` : "No role could be detected",
      });
    } catch (err) {
      console.error("Error refreshing role:", err);
      setError("Failed to refresh role. Please try the repair option.");
    } finally {
      setRefreshingRole(false);
    }
  };

  // Verify user data consistency when the component loads
  useEffect(() => {
    const verifyUser = async () => {
      if (loading) return;
      
      // Only verify authenticated users with an ID
      if (!isAuthenticated || !user?.id) {
        console.log("User not authenticated or no user ID, skipping verification");
        return;
      }
      
      setVerifying(true);
      console.log("Verifying user consistency on Index page...");
      
      try {
        const isConsistent = await verifyUserConsistency(user.id);
        
        if (!isConsistent) {
          console.warn("User data is inconsistent, attempting to repair");
          setError("Account data issue detected. Please use the repair option below.");
          
          toast({
            title: "Account issue detected",
            description: "Some account data is missing. Use the repair option below.",
            variant: "destructive",
          });
        } else {
          console.log("User data is consistent");
          // Add a small delay to ensure the toast appears after the page loads
          const timer = setTimeout(() => {
            toast({
              title: "Authentication Status",
              description: `You are logged in as ${user?.name} with role: ${userRole || 'loading...'}`,
            });
          }, 300);
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error verifying user:", error);
        setError("There was a problem checking your account data.");
        toast({
          title: "Verification error",
          description: "There was a problem checking your account data.",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };
    
    verifyUser();
  }, [isAuthenticated, user, loading, toast, userRole]);

  // Handle redirection for non-customer users with fallback timer
  useEffect(() => {
    if (!loading && !verifying && isAuthenticated && userRole) {
      if (userRole !== 'customer') {
        console.log(`Detected non-customer role: ${userRole}, redirecting to welcome page...`);
        
        // Give a moment for the UI to update before redirecting
        const timer = setTimeout(() => {
          setIsRedirecting(true);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log("User is a customer, showing Home page");
      }
    }
  }, [isAuthenticated, userRole, loading, verifying]);
  
  // Show loading state
  if (loading || verifying) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shop-purple border-t-transparent"></div>
        <p className="text-gray-600">{loading ? 'Checking authentication...' : 'Verifying your account...'}</p>
        
        {/* Debug info toggle button */}
        <button 
          className="text-xs text-gray-400 underline mt-4"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide debug info' : 'Show debug info'}
        </button>
        
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-50 rounded border max-w-lg overflow-auto text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <pre>
              {JSON.stringify({ 
                authenticated: isAuthenticated, 
                role: userRole, 
                loading, 
                verifying,
                hasUser: !!user,
                userId: user?.id,
                hasSession: !!session
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Show troubleshooting option after a delay */}
        {(loading || verifying) && (
          <div className="mt-4">
            <LoginTroubleshooting />
          </div>
        )}
      </div>
    );
  }
  
  // Problem detected - show repair options
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Account Issue Detected</h2>
          </div>
          
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <p className="mb-4 text-gray-600">
            We detected an issue with your account that needs to be fixed before continuing.
            You can try these options:
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRefreshRole} 
              disabled={refreshingRole}
              variant="outline" 
              className="w-full"
            >
              {refreshingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh Role
                </>
              )}
            </Button>
            
            <div className="mt-4">
              <LoginTroubleshooting />
            </div>
          </div>
          
          {showDebug && (
            <div className="mt-6 p-3 bg-gray-50 rounded border text-xs">
              <h4 className="font-bold mb-2">Debug Info:</h4>
              <pre>
                {JSON.stringify({ 
                  authenticated: isAuthenticated, 
                  role: userRole, 
                  loading, 
                  hasUser: !!user,
                  userId: user?.id,
                  hasSession: !!session
                }, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <button 
              className="text-xs text-gray-400 underline"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide debug info' : 'Show debug info'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect non-customer users to welcome page
  if (isRedirecting || (isAuthenticated && userRole && userRole !== 'customer')) {
    console.log(`Redirecting from Index to Welcome page, role: ${userRole}`);
    return <Navigate to="/welcome" replace />;
  }

  // Render Home for customers or non-authenticated users
  return (
    <>
      <Home />
      <Toaster />
    </>
  );
};

export default Index;
