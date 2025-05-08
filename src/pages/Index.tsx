
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { verifyUserConsistency } from "@/utils/authUtils";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AccountErrorState from "@/components/AccountErrorState";

const Index = () => {
  const { isAuthenticated, userRole, loading, user, session, fetchUserRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingRole, setRefreshingRole] = useState(false);
  const [maxRetries, setMaxRetries] = useState(0);

  // Log component state for debugging
  useEffect(() => {
    console.log("Index page state:", { isAuthenticated, userRole, loading, verifying, user, maxRetries });
  }, [isAuthenticated, userRole, loading, verifying, user, maxRetries]);

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

      if (role) {
        // Attempt redirection based on the newly fetched role
        redirectToRoleDashboard(role);
      }
    } catch (err) {
      console.error("Error refreshing role:", err);
      setError("Failed to refresh role. Please try the repair option.");
    } finally {
      setRefreshingRole(false);
    }
  };

  // Function to redirect based on role
  const redirectToRoleDashboard = (role: string) => {
    // Don't redirect if we're already redirecting
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    console.log(`Redirecting based on role: ${role}`);
    
    // Use setTimeout to ensure state updates have been processed
    setTimeout(() => {
      try {
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'seller':
            navigate('/seller');
            break;
          case 'delivery':
            navigate('/delivery');
            break;
          case 'customer':
            // For customers, navigate to home page
            navigate('/home');
            break;
          default:
            // For unknown roles, try navigating to a default dashboard
            console.warn(`Unknown role detected: ${role}, redirecting to welcome page`);
            navigate('/welcome');
            setIsRedirecting(false);
            break;
        }
      } catch (err) {
        console.error("Navigation error:", err);
        setIsRedirecting(false);
        setError("Failed to navigate to your dashboard. Please try again.");
      }
    }, 100);
  };

  // Verify user data consistency when the component loads
  useEffect(() => {
    if (loading) return;
    
    const verifyUser = async () => {
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
          toast({
            title: "Account issue detected",
            description: "Some account data is missing. We're attempting to fix this automatically.",
          });
          
          // Try auto-repair
          const isRepaired = await verifyUserConsistency(user.id);
          if (!isRepaired) {
            setError("Account data issue detected. Please use the repair option below.");
          }
        } 
        
        if (userRole) {
          console.log("User data is consistent with role:", userRole);
          
          // Add a small delay to ensure the toast appears after the page loads
          const timer = setTimeout(() => {
            toast({
              title: "Authentication Status",
              description: `You are logged in as ${user?.name} with role: ${userRole}`,
            });
            
            // If user has a role, redirect them to appropriate page
            redirectToRoleDashboard(userRole);
          }, 300);
          
          return () => clearTimeout(timer);
        } else {
          console.warn("User data is consistent but no role found");
          setError("Your account appears valid but no role was found. Please use the repair option.");
        }
      } catch (error) {
        console.error("Error verifying user:", error);
        setMaxRetries(prev => prev + 1);
        setError("There was a problem checking your account data.");
        
        if (maxRetries >= 2) {
          toast({
            title: "Persistent verification error",
            description: "We're having trouble verifying your account. Please try logging out and back in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Verification error",
            description: "There was a problem checking your account data.",
            variant: "destructive",
          });
        }
      } finally {
        setVerifying(false);
      }
    };
    
    verifyUser();
  }, [isAuthenticated, user, loading, toast, userRole, maxRetries]);

  // Handle redirection for users with roles when component loads
  useEffect(() => {
    // If authenticated, not loading, not verifying, and has role
    if (!loading && !verifying && isAuthenticated && userRole && !isRedirecting) {
      console.log(`Detected role: ${userRole}, redirecting to appropriate dashboard...`);
      redirectToRoleDashboard(userRole);
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
                hasSession: !!session,
                retries: maxRetries
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
  
  // Max retries exceeded, possibly deleted account
  if (maxRetries >= 3) {
    return (
      <AccountErrorState 
        title="Account Error" 
        message="We're having persistent problems verifying your account. Your account may have been deleted or reset."
      />
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
                  hasSession: !!session,
                  retries: maxRetries
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

  // If not authenticated, show home page for guest users
  if (!isAuthenticated && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Home />
        <Toaster />
      </div>
    );
  }
  
  // If user is authenticated but we're waiting for redirection
  if (isRedirecting) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shop-purple border-t-transparent"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Default case: show Home for non-authenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      <Home />
      <Toaster />
    </div>
  );
};

export default Index;
