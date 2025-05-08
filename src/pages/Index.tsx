
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { isAuthenticated, userRole, loading, user } = useAuth();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Display a toast with user role information when loaded
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Add a small delay to ensure the toast appears after the page loads
      const timer = setTimeout(() => {
        toast({
          title: "Authentication Status",
          description: `You are logged in as ${user?.name} with role: ${userRole || 'loading...'}`,
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userRole, loading, user, toast]);

  // Handle redirection for non-customer users
  useEffect(() => {
    if (!loading && isAuthenticated && userRole && userRole !== 'customer') {
      setIsRedirecting(true);
      // Give a moment for the UI to update before redirecting
      const timer = setTimeout(() => {
        setIsRedirecting(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userRole, loading]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shop-purple border-t-transparent"></div>
      </div>
    );
  }
  
  // Redirect non-customer users to welcome page
  if (isRedirecting || (isAuthenticated && userRole && userRole !== 'customer')) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <Home />
      <Toaster />
    </>
  );
};

export default Index;
