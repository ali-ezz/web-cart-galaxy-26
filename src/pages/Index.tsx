
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
import { DatabaseConnectionCheck } from '@/components/DatabaseConnectionCheck';

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
    console.log("Index page state:", { 
      isAuthenticated, 
      userRole, 
      loading, 
      verifying, 
      user: user?.id, 
      maxRetries 
    });
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
        // For customers, just stay on home page
        setIsRedirecting(false);
        break;
      default:
        console.warn(`Unknown role detected: ${role}`);
        setIsRedirecting(false);
        break;
    }
  };

  // If not authenticated, show home page for guest users
  if (!isAuthenticated && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Home />
        <Toaster />
      </div>
    );
  }
  
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
  
  // If authenticated and has a role, show home page or redirect to dashboard
  if (isAuthenticated && userRole && !loading) {
    if (userRole !== 'customer' && !isRedirecting) {
      // Redirect non-customer users to their dashboards
      redirectToRoleDashboard(userRole);
      return (
        <div className="flex flex-col justify-center items-center min-h-screen gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-shop-purple border-t-transparent"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      );
    }
    
    // For customers, show the home page
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Add database connection check at the top */}
          <DatabaseConnectionCheck />
          {/* Render home content */}
          <Home />
        </div>
        <Toaster />
      </div>
    );
  }

  // Default case: show Home for authenticated users without a role
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <DatabaseConnectionCheck />
        <Home />
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
