
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw, BugPlay } from "lucide-react";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NotFound = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Log the 404 error
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Check auth status
    const checkAuthStatus = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
        
        if (data.session?.user?.id) {
          // Fetch user role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();
            
          setUserRole(roleData?.role || null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleDashboardRedirect = () => {
    if (!isLoggedIn) {
      toast({
        title: "Not logged in",
        description: "You need to log in first",
        variant: "destructive"
      });
      return;
    }
    
    if (!userRole) {
      toast({
        title: "Role not found",
        description: "Your user role could not be determined",
        variant: "destructive"
      });
      return;
    }
    
    // Redirect based on role
    switch (userRole) {
      case 'admin':
        window.location.href = '/admin';
        break;
      case 'seller':
        window.location.href = '/seller';
        break;
      case 'delivery':
        window.location.href = '/delivery';
        break;
      case 'customer':
        window.location.href = '/home';
        break;
      default:
        window.location.href = '/welcome';
    }
  };

  // Check if the path includes specific dashboard prefixes
  const isDashboardPath = location.pathname.includes('/seller') || 
                         location.pathname.includes('/admin') ||
                         location.pathname.includes('/delivery');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-7xl font-bold text-shop-purple mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
          {isDashboardPath && isLoggedIn && (
            <span className="block mt-2 font-medium">
              This appears to be a dashboard URL. You may need elevated permissions to access it.
            </span>
          )}
        </p>
        
        {isDashboardPath || 
         location.pathname.includes('/admin') ||
         location.pathname.includes('/delivery') ? (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <h3 className="text-md font-medium text-amber-800 mb-2">Dashboard Access Issue?</h3>
            <p className="text-sm text-amber-700 mb-2">
              If you're trying to access your dashboard but seeing this error, you may need to:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 mb-3">
              <li>Make sure you're logged in</li>
              <li>Check that your account has the correct role permissions</li>
              <li>Try reloading the page or logging out and back in</li>
            </ul>
            <div className="mt-4">
              <LoginTroubleshooting />
            </div>
          </div>
        ) : null}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="#" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
          
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
        
        {isDashboardPath && isLoggedIn && (
          <div className="mt-6">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleDashboardRedirect}
            >
              <BugPlay className="mr-2 h-4 w-4" />
              Try Dashboard Redirect
            </Button>
            
            <p className="text-xs text-gray-500 mt-2">
              Current path: {location.pathname}<br />
              Role detected: {isLoading ? "Loading..." : userRole || "None"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
