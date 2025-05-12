import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Package, Truck, LayoutDashboard, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { verifyUserConsistency } from "@/utils/authUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import AccountErrorState from "@/components/AccountErrorState";

// Define the UserRole type to ensure consistency
type UserRole = Database["public"]["Enums"]["user_role"];

export default function WelcomePage() {
  const { isAuthenticated, userRole, loading, user, fetchUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [refreshingRole, setRefreshingRole] = useState(false);
  const [maxRetries, setMaxRetries] = useState(0);
  const [lastRedirectAttempt, setLastRedirectAttempt] = useState<number | null>(null);
  const [roleCheckCompleted, setRoleCheckCompleted] = useState(false);
  
  // Log component state for debugging
  useEffect(() => {
    console.log("Welcome page state:", { 
      isAuthenticated, 
      userRole, 
      loading, 
      user, 
      verifyingUser, 
      maxRetries,
      roleCheckCompleted 
    });
  }, [isAuthenticated, userRole, loading, user, verifyingUser, maxRetries, roleCheckCompleted]);
  
  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);
  
  // Verify user exists on load and fetch role if needed
  useEffect(() => {
    const verifyUser = async () => {
      if (isAuthenticated && user?.id && !loading && !roleCheckCompleted) {
        setVerifyingUser(true);
        setError(null);
        
        try {
          console.log("Verifying user consistency...");
          const isConsistent = await verifyUserConsistency(user.id);
          
          if (!isConsistent) {
            console.warn("User verification failed");
            setError("Your account data couldn't be verified. Please use the repair option below.");
            setMaxRetries(prev => prev + 1);
          } else {
            // If userRole is not yet set, fetch it
            if (!userRole) {
              console.log("Fetching user role after verification");
              await fetchUserRole(user.id);
            }
          }
        } catch (err) {
          console.error("Exception verifying user:", err);
          setError("An unexpected error occurred. Please try the repair option.");
          setMaxRetries(prev => prev + 1);
        } finally {
          setVerifyingUser(false);
          setRoleCheckCompleted(true);
        }
      }
    };
    
    verifyUser();
  }, [isAuthenticated, user, loading, userRole, fetchUserRole, roleCheckCompleted]);
  
  // Handle role-based navigation with improved error handling and timing
  useEffect(() => {
    if (roleCheckCompleted && userRole && !isRedirecting) {
      navigateToRoleDashboard();
    }
  }, [roleCheckCompleted, userRole]);
  
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
      
      // Set role check as completed to trigger navigation
      setRoleCheckCompleted(true);
    } catch (err) {
      console.error("Error refreshing role:", err);
      setError("Failed to refresh role. Please try the repair option.");
      setMaxRetries(prev => prev + 1);
    } finally {
      setRefreshingRole(false);
    }
  };
  
  // Function to handle role-based navigation with improved error handling
  const navigateToRoleDashboard = async () => {
    // Prevent repeated redirect attempts within a short time window
    const now = Date.now();
    if (lastRedirectAttempt && now - lastRedirectAttempt < 2000) {
      console.log("Ignoring rapid redirect attempt");
      return;
    }
    
    setIsRedirecting(true);
    setLastRedirectAttempt(now);
    setError(null);
    
    try {
      if (!userRole) {
        console.warn("User role not available yet, defaulting to home page");
        toast({
          title: "Role not detected",
          description: "Your user role could not be detected. Using default view.",
        });
        navigate("/");
        return;
      }
      
      console.log(`Navigating based on role: ${userRole}`);
      
      // Add a small delay for better UI feedback
      setTimeout(() => {
        switch (userRole) {
          case "admin":
            navigate("/admin", { replace: true });
            break;
          case "seller":
            navigate("/seller", { replace: true });
            break;
          case "delivery":
            navigate("/delivery", { replace: true });
            break;
          case "customer":
          default:
            navigate("/home", { replace: true });
            break;
        }
      }, 300);
    } catch (error) {
      console.error("Navigation error:", error);
      setError("Could not navigate to your dashboard. Please try the repair option.");
      setIsRedirecting(false);
      setMaxRetries(prev => prev + 1);
    }
  };

  // If too many retries, account is likely deleted or has serious issues
  if (maxRetries >= 3) {
    return (
      <AccountErrorState 
        title="Account Issues Detected" 
        message="We're having persistent problems verifying your account. Your account may have been deleted or reset."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-shop-purple">Welcome to ShopGalaxy</CardTitle>
          <CardDescription>Everything you need, all in one place</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 py-4">
          {loading || verifyingUser ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
              <p className="ml-2">{verifyingUser ? "Verifying your account..." : "Checking your account..."}</p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            
              <div className="text-center">
                <h3 className="text-lg font-medium mb-1">
                  Hello, {user?.name || "User"}!
                </h3>
                <p className="text-gray-600 mb-4">
                  You are logged in as a{userRole === "admin" ? "n" : ""} <strong>{userRole || "user"}</strong>
                </p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  {userRole === "admin" && <LayoutDashboard className="h-5 w-5 text-shop-purple mr-3" />}
                  {userRole === "seller" && <Package className="h-5 w-5 text-shop-purple mr-3" />}
                  {userRole === "delivery" && <Truck className="h-5 w-5 text-shop-purple mr-3" />}
                  {(userRole === "customer" || !userRole) && <ShoppingBag className="h-5 w-5 text-shop-purple mr-3" />}
                  
                  <div>
                    <h4 className="font-medium">Your Account Type</h4>
                    <p className="text-sm text-gray-600">
                      {userRole === "admin" && "Manage store operations and users"}
                      {userRole === "seller" && "Sell your products on our platform"}
                      {userRole === "delivery" && "Manage deliveries and routes"}
                      {(userRole === "customer" || !userRole) && "Shop our products and track orders"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Role refresh option */}
              {error && (
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
              )}
              
              {/* Debug information toggle */}
              <div className="mt-4 text-center">
                <button 
                  className="text-xs text-gray-400 underline"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? 'Hide debug info' : 'Show debug info'}
                </button>
              </div>
              
              {showDebug && (
                <div className="mt-4 p-4 bg-gray-50 rounded border max-w-lg overflow-auto text-xs">
                  <h4 className="font-bold mb-2">Debug Info:</h4>
                  <pre>
                    {JSON.stringify({ 
                      authenticated: isAuthenticated, 
                      role: userRole, 
                      loading, 
                      verifyingUser,
                      hasUser: !!user,
                      userId: user?.id,
                      retries: maxRetries,
                      redirecting: isRedirecting,
                      roleCheckCompleted
                    }, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Troubleshooting option */}
              <div className="mt-4 flex justify-center">
                <LoginTroubleshooting onRepair={() => {
                  setRoleCheckCompleted(false);
                  if (user?.id) {
                    verifyUserConsistency(user.id);
                  }
                }} />
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={navigateToRoleDashboard} 
            disabled={loading || verifyingUser || isRedirecting || refreshingRole} 
            className="w-full"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
              </>
            ) : verifyingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
