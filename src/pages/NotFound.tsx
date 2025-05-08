
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-7xl font-bold text-shop-purple mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        {location.pathname.includes('/seller') || 
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
      </div>
    </div>
  );
};

export default NotFound;
