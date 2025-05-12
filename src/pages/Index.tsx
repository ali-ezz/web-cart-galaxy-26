
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from './Home';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import LoginTroubleshooting from "@/components/LoginTroubleshooting";
import { DatabaseConnectionCheck } from '@/components/DatabaseConnectionCheck';

const Index = () => {
  const { isAuthenticated, userRole, authState, user } = useAuth();
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);

  // Show loading state
  if (authState === 'initializing') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shop-purple border-t-transparent"></div>
        <p className="text-gray-600">Checking authentication...</p>
        
        {/* Debug info toggle button */}
        <button 
          className="text-xs text-gray-400 underline mt-4"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide debug info' : 'Show debug info'}
        </button>
        
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-50 rounded border max-w-lg overflow-auto text-xs">
            <h4 className="font-bold mb-2">Debug Info:</h4>
            <pre>
              {JSON.stringify({ 
                authenticated: isAuthenticated, 
                role: userRole, 
                authState,
                hasUser: !!user,
                userId: user?.id
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Show troubleshooting option after a short delay */}
        <div className="mt-4">
          <LoginTroubleshooting />
        </div>
      </div>
    );
  }
  
  // For authenticated customers, show the home page with database connection check
  // For guests, show the home page without the database check
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {isAuthenticated && <DatabaseConnectionCheck />}
        <Home />
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
