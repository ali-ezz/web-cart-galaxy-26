
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Package, Truck, LayoutDashboard, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";

export default function WelcomePage() {
  const { isAuthenticated, userRole, authState, user, fetchUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [refreshingRole, setRefreshingRole] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Handle role refresh
  const handleRefreshRole = async () => {
    if (!user?.id) return;
    
    setRefreshingRole(true);
    
    try {
      const role = await fetchUserRole(user.id);
      toast({
        title: "Role Updated",
        description: role ? `Your current role is: ${role}` : "No role could be detected",
      });
    } catch (err) {
      console.error("Error refreshing role:", err);
      toast({
        title: "Failed to refresh role",
        description: "Please try again or use the troubleshooting options below.",
        variant: "destructive"
      });
    } finally {
      setRefreshingRole(false);
    }
  };
  
  // Function to handle role-based navigation
  const navigateToRoleDashboard = () => {
    setIsRedirecting(true);
    
    try {
      if (!userRole) {
        toast({
          title: "Role not detected",
          description: "Your user role could not be detected. Using default view.",
        });
        
        // Set a timer to navigate to home if no role is detected
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1000);
        return;
      }
      
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
      }, 500);
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "Could not navigate to your dashboard. Please try again.",
        variant: "destructive"
      });
      setIsRedirecting(false);
    }
  };

  // If still authenticating, show loading
  if (authState === 'initializing') {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="space-y-6 py-8">
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
              <p className="ml-2">Loading your account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
          {!userRole && (
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
                  authState,
                  hasUser: !!user,
                  userId: user?.id,
                  redirecting: isRedirecting
                }, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Troubleshooting option */}
          <div className="mt-4 flex justify-center">
            <LoginTroubleshooting />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={navigateToRoleDashboard} 
            disabled={isRedirecting || refreshingRole || !isAuthenticated || !userRole} 
            className="w-full"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
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
