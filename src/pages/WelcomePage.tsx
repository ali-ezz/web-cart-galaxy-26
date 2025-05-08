
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Package, Truck, LayoutDashboard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { verifyUserConsistency } from "@/utils/authUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";

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
  
  // Log component state for debugging
  useEffect(() => {
    console.log("Welcome page state:", { isAuthenticated, userRole, loading, user, verifyingUser });
  }, [isAuthenticated, userRole, loading, user, verifyingUser]);
  
  // Function to verify the user exists in the database with improved error handling
  const verifyUserExists = async () => {
    if (!user?.id) {
      console.error("No user ID available to verify");
      return false;
    }
    
    setVerifyingUser(true);
    setError(null);
    
    try {
      console.log(`Verifying user ID: ${user.id} on Welcome page`);
      
      const isConsistent = await verifyUserConsistency(user.id);
      
      if (!isConsistent) {
        console.warn("User verification failed on welcome page");
        setError("Your account data couldn't be verified. Please try logging out and back in.");
        return false;
      }
      
      // Refresh role after verification
      if (user.id) {
        await fetchUserRole(user.id);
      }
      
      return true;
    } catch (err) {
      console.error("Exception verifying user:", err);
      setError("An unexpected error occurred. Please try again.");
      return false;
    } finally {
      setVerifyingUser(false);
    }
  };
  
  // Verify user data on initial load
  useEffect(() => {
    if (isAuthenticated && user?.id && !loading) {
      verifyUserExists();
    }
  }, [isAuthenticated, user, loading, fetchUserRole]);
  
  // Function to handle role-based navigation with improved error handling
  const navigateToRoleDashboard = async () => {
    setIsRedirecting(true);
    setError(null);
    
    try {
      // Verify user exists in database
      const userExists = await verifyUserExists();
      if (!userExists) {
        console.warn("User validation failed, redirecting to login");
        toast({
          title: "Account Problem",
          description: "There was a problem with your account. Please log in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/login");
        return;
      }
      
      // Add a small delay to ensure userRole is updated
      setTimeout(() => {
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
        switch (userRole) {
          case "admin":
            navigate("/admin");
            break;
          case "seller":
            navigate("/seller");
            break;
          case "delivery":
            navigate("/delivery");
            break;
          case "customer":
          default:
            navigate("/");
            break;
        }
      }, 500); // Short delay to ensure userRole is properly loaded
    } catch (error) {
      console.error("Navigation error:", error);
      setError("Could not navigate to your dashboard. Please try again.");
      setIsRedirecting(false);
    }
  };

  useEffect(() => {
    // If loading is complete and we have authentication info, proceed
    if (!loading) {
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to login");
        navigate("/login");
      }
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-shop-purple">Welcome to UniMarket</CardTitle>
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
                      userId: user?.id
                    }, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Troubleshooting option */}
              <div className="mt-4 flex justify-center">
                <LoginTroubleshooting onRepair={() => verifyUserExists()} />
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={navigateToRoleDashboard} 
            disabled={loading || verifyingUser || isRedirecting} 
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
