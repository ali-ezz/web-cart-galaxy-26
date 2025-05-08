
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, Package, Truck, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// Define the UserRole type to ensure consistency
type UserRole = Database["public"]["Enums"]["user_role"];

export default function WelcomePage() {
  const { isAuthenticated, userRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(false);
  
  // Function to verify the user exists in the database with improved error handling
  const verifyUserExists = async () => {
    if (!user?.id) return false;
    
    setVerifyingUser(true);
    try {
      console.log(`Verifying user ID: ${user.id}`);
      
      // Check if user has a role assigned
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error verifying user:", error);
        toast({
          title: "Error verifying account",
          description: "There was a problem connecting to the database. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!data) {
        console.log("No role found, creating default role for user");
        
        // Get role from user metadata if available (for SSO users)
        let roleToAssign: UserRole = 'customer';
        
        // Try to extract role from metadata for SSO users
        const { data: sessionData } = await supabase.auth.getSession();
        const userMetadata = sessionData?.session?.user?.user_metadata;
        
        if (userMetadata && userMetadata.role_request) {
          const requestedRole = userMetadata.role_request as string;
          if (requestedRole === 'admin' || 
              requestedRole === 'customer' || 
              requestedRole === 'seller' || 
              requestedRole === 'delivery') {
            roleToAssign = requestedRole as UserRole;
            console.log(`Using role from metadata: ${roleToAssign}`);
          }
        }
        
        // Create default role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: user.id, 
            role: roleToAssign 
          });
          
        if (insertError) {
          console.error("Error creating default role:", insertError);
          toast({
            title: "Account setup issue",
            description: "Could not set up your user profile. Please try logging out and back in.",
            variant: "destructive",
          });
          return false;
        }
        
        toast({
          title: "Account set up",
          description: `Your account has been set up as a ${roleToAssign}`,
        });
      }
      
      // Also make sure the profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking profile:", profileError);
      }
      
      // Create profile if not exists
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert({ id: user.id });
          
        if (insertProfileError) {
          console.error("Error creating profile:", insertProfileError);
        }
      }
      
      return true;
    } catch (err) {
      console.error("Exception verifying user:", err);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setVerifyingUser(false);
    }
  };
  
  // Function to handle role-based navigation with improved error handling
  const navigateToRoleDashboard = async () => {
    setIsRedirecting(true);
    
    try {
      // Verify user exists in database
      const userExists = await verifyUserExists();
      if (!userExists) {
        console.warn("User validation failed, redirecting to login");
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
      toast({
        title: "Navigation error",
        description: "Could not navigate to your dashboard. Please try again.",
        variant: "destructive", 
      });
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
