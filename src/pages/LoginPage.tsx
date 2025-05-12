import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyUserConsistency } from '@/utils/authUtils';
import { AdvancedTroubleshooting } from '@/components/AdvancedTroubleshooting';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, authState, loading, clearAuthErrors } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { toast } = useToast();
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const from = location.state?.from || "/";

  useEffect(() => {
    // Clear auth errors when the component mounts or authState changes
    clearAuthErrors();
    setLoginAttempts(0);
  }, [clearAuthErrors, authState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginAttempts(prev => prev + 1);

    const success = await login(email, password);
    if (success) {
      // On successful login, navigate to the intended page
      navigate(from, { replace: true });
    } else {
      // On failed login, show an error message
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement password reset logic here
    toast({
      title: "Reset Request Sent",
      description: "Password reset functionality is under construction.",
    });
  };
  
  const handleRepair = () => {
    if (authState === 'authenticated') {
      setIsVerifying(true);
      
      verifyUserConsistency("test-user-id")
        .then(result => {
          console.log("User verification result:", result);
          setVerificationComplete(true);
          
          toast({
            title: "Verification Complete",
            description: "User data has been verified and repaired if needed.",
          });
        })
        .catch(error => {
          console.error("Verification error:", error);
          toast({
            title: "Verification Error",
            description: "An error occurred during user verification.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } else {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to repair your account.",
        variant: "destructive",
      });
    }
  };

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
                authState,
                loginAttempts
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Show troubleshooting option after a short delay */}
        <div className="mt-4">
          <AdvancedTroubleshooting />
        </div>
      </div>
    );
  }

  return (
    <div className="container relative mx-auto flex flex-col items-center justify-center min-h-screen">
      <Card className="w-[350px] md:w-[450px] lg:w-[550px] shadow-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email and password to login</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button disabled={loading} className="w-full mt-4" type="submit">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="flex items-center justify-between">
            <Link to="/register" className="text-sm text-gray-500 hover:text-gray-700">
              Create an account
            </Link>
            <button 
              onClick={handleForgotPassword} 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
      </Card>

      {showForgotPassword && (
        <Card className="w-[350px] md:w-[450px] lg:w-[550px] mt-4 shadow-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your email to reset your password</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleResetRequest}>
              <div className="grid gap-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input 
                  id="resetEmail" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full mt-4" type="submit">
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {loginAttempts > 2 && (
        <div className="mt-6">
          <button 
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          >
            {showTroubleshooting ? 'Hide Troubleshooting' : 'Show Troubleshooting'}
          </button>
          {showTroubleshooting && (
            <div className="mt-4">
              <AdvancedTroubleshooting onRepair={handleRepair} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
