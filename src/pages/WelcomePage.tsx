
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Package, Truck, LayoutDashboard } from "lucide-react";

export default function WelcomePage() {
  const { isAuthenticated, userRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Function to handle role-based navigation
  const navigateToRoleDashboard = () => {
    setIsRedirecting(true);
    if (!userRole) {
      console.warn("User role not available yet, defaulting to home page");
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
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
              <p className="ml-2">Checking your account...</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={navigateToRoleDashboard} 
            disabled={loading || isRedirecting} 
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
