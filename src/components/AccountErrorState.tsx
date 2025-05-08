
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, LogOut, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoginTroubleshooting from './LoginTroubleshooting';

interface AccountErrorStateProps {
  title?: string;
  message?: string;
  showRepair?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

export default function AccountErrorState({
  title = "Account Issue Detected",
  message = "We're having trouble with your account. This could be because your account was deleted or there's a permission issue.",
  showRepair = true,
  showRetry = true,
  showHome = true,
  onRetry
}: AccountErrorStateProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You've been logged out. Please sign in again."
      });
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      // Force redirect to login even if signOut fails
      navigate('/login');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior: reload the current page
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        
        <p className="mb-4 text-gray-600">
          This could happen if:
        </p>
        
        <ul className="list-disc pl-5 mb-6 text-gray-600 space-y-1">
          <li>Your account has been deleted</li>
          <li>Your session has expired</li>
          <li>There's an issue with your account permissions</li>
          <li>The database connection is experiencing problems</li>
        </ul>
        
        <div className="space-y-3">
          {showRetry && (
            <Button 
              onClick={handleRetry}
              variant="outline" 
              className="w-full flex items-center justify-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          )}
          
          <Button 
            onClick={handleLogout}
            variant="default" 
            className="w-full flex items-center justify-center bg-shop-purple hover:bg-shop-purple/90"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out and Log In Again
          </Button>
          
          {showHome && (
            <Button 
              onClick={handleGoHome}
              variant="ghost" 
              className="w-full flex items-center justify-center"
            >
              <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Button>
          )}
          
          {showRepair && (
            <div className="mt-4 flex justify-center">
              <LoginTroubleshooting />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
