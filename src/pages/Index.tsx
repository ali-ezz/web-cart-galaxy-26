
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { isAuthenticated, userRole, loading } = useAuth();
  const { toast } = useToast();

  // Display a toast with user role information when loaded
  useEffect(() => {
    if (!loading && isAuthenticated && userRole) {
      toast({
        title: "Authentication Status",
        description: `You are logged in as a ${userRole}`,
      });
    }
  }, [isAuthenticated, userRole, loading]);

  return (
    <>
      <Home />
      <Toaster />
    </>
  );
};

export default Index;
