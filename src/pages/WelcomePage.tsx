
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { User, ShoppingBag, Truck, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WelcomePage() {
  const { user, userRole, loading, fetchUserRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);
  
  useEffect(() => {
    // If the user is logged in but we don't have their role yet, fetch it
    const checkRole = async () => {
      if (user && !userRole && !loading) {
        console.log("Welcome page: Fetching user role");
        try {
          const role = await fetchUserRole(user.id);
          console.log(`Welcome page: Role fetched: ${role}`);
          setRoleCheckComplete(true);
        } catch (error) {
          console.error("Welcome page: Error fetching role", error);
          setRoleCheckComplete(true);
        }
      } else {
        setRoleCheckComplete(true);
      }
    };
    
    checkRole();
  }, [user, userRole, loading, fetchUserRole]);
  
  // Handle redirection based on user role once everything is loaded
  useEffect(() => {
    if (!loading && user && userRole && roleCheckComplete) {
      console.log(`Welcome page: Ready to redirect user with role: ${userRole}`);
      setIsRedirecting(true);
      
      const timer = setTimeout(() => {
        switch(userRole) {
          case 'admin':
            console.log("Welcome page: Redirecting to admin dashboard");
            navigate('/admin');
            break;
          case 'seller':
            console.log("Welcome page: Redirecting to seller dashboard");
            navigate('/seller');
            break;
          case 'delivery':
            console.log("Welcome page: Redirecting to delivery dashboard");
            navigate('/delivery');
            break;
          case 'customer':
            console.log("Welcome page: Redirecting to customer home");
            navigate('/');
            break;
          default:
            // If no valid role, show toast and stay on welcome page
            console.log("Welcome page: Invalid role detected");
            toast({
              title: "Role not recognized",
              description: "Your account doesn't have a valid role assigned.",
              variant: "destructive"
            });
            setIsRedirecting(false);
            break;
        }
      }, 500); // Small delay to avoid immediate redirects
      
      return () => clearTimeout(timer);
    }
  }, [userRole, loading, navigate, user, toast, roleCheckComplete]);
  
  if (loading || isRedirecting) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-shop-purple animate-spin mb-4" />
        <p className="text-gray-600">
          {loading ? "Checking your account..." : "Redirecting to your dashboard..."}
        </p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Welcome to ShopGalaxy</h1>
              <p className="text-gray-600">Your one-stop shop for everything</p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={() => navigate('/login')} className="mx-2">
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" className="mx-2">
                Register
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}!</h1>
            <p className="text-gray-600">Thank you for signing in to ShopGalaxy.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-center">
              {userRole ? (
                <span>
                  Your account is set up as a <span className="font-medium text-shop-purple">{userRole}</span> account.
                </span>
              ) : (
                <span>We're checking your account role...</span>
              )}
            </p>
            
            <div className="flex justify-center">
              {userRole === 'customer' ? (
                <Button onClick={() => navigate('/')} className="mx-2">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Start Shopping
                </Button>
              ) : userRole === 'seller' ? (
                <Button onClick={() => navigate('/seller')} className="mx-2">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Seller Dashboard
                </Button>
              ) : userRole === 'delivery' ? (
                <Button onClick={() => navigate('/delivery')} className="mx-2">
                  <Truck className="mr-2 h-4 w-4" />
                  Go to Delivery Dashboard
                </Button>
              ) : userRole === 'admin' ? (
                <Button onClick={() => navigate('/admin')} className="mx-2">
                  <User className="mr-2 h-4 w-4" />
                  Go to Admin Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate('/account')} className="mx-2">
                  Go to Your Account
                </Button>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              If you need to switch roles or have any questions, please contact an administrator.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/account" className="text-shop-purple hover:underline">
                View Your Account
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/help" className="text-shop-purple hover:underline">
                Get Help
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
