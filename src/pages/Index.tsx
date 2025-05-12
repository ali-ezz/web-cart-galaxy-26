
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { verifyUserConsistency } from "@/utils/authUtils";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import { Loader2 } from "lucide-react";
import { DatabaseConnectionCheck } from '@/components/DatabaseConnectionCheck';

const Index = () => {
  const { isAuthenticated, userRole, loading, user, fetchUserRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Log component state for debugging
  useEffect(() => {
    console.log("Index page state:", { 
      isAuthenticated, 
      userRole, 
      loading, 
      user: user?.id
    });
  }, [isAuthenticated, userRole, loading, user]);

  // Function to redirect based on role
  const redirectToRoleDashboard = (role: string) => {
    // Don't redirect if we're already redirecting
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    console.log(`Redirecting based on role: ${role}`);
    
    // Add a short delay to ensure smooth transition
    setTimeout(() => {
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
    }, 300);
  };
  
  // Handle authentication and role-based routing
  useEffect(() => {
    // If loading is complete and we have authentication info
    if (!loading) {
      if (isAuthenticated && userRole && userRole !== 'customer') {
        console.log(`User authenticated with role ${userRole}, redirecting to dashboard`);
        redirectToRoleDashboard(userRole);
      }
      
      // If user is authenticated but we don't have a role yet, verify and fetch the role
      if (isAuthenticated && user?.id && !userRole) {
        setVerifying(true);
        
        // First verify the user data is consistent
        verifyUserConsistency(user.id).then(isConsistent => {
          if (isConsistent) {
            // Fetch the role after verification
            fetchUserRole(user.id).then(role => {
              setVerifying(false);
              if (role && role !== 'customer') {
                redirectToRoleDashboard(role);
              }
            });
          } else {
            toast({
              title: "Account verification issue",
              description: "There was a problem verifying your account. Please try logging in again.",
              variant: "destructive",
            });
            setVerifying(false);
          }
        });
      }
    }
  }, [isAuthenticated, userRole, loading, user]);

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
                userId: user?.id
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
  
  // For authenticated customers, show the home page with database connection check
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
