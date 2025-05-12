
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthRedirectProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function AuthRedirect({ 
  children, 
  requireAuth = false, 
  allowedRoles = [] 
}: AuthRedirectProps) {
  const { isAuthenticated, userRole, authState, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    // Skip redirect logic if already processed
    if (processingComplete || isRedirecting) return;

    // Don't process until auth is initialized
    if (authState === 'initializing') return;

    const currentPath = location.pathname;
    const isAuthPage = ['/login', '/register', '/auth-confirmation'].includes(currentPath);

    // For pages requiring authentication
    if (requireAuth) {
      if (!isAuthenticated && authState === 'unauthenticated') {
        console.log('Auth required but user is not authenticated, redirecting to login');
        setIsRedirecting(true);
        navigate('/login', { state: { from: currentPath } });
        return;
      }

      // Role-based access control
      if (isAuthenticated && allowedRoles.length > 0 && userRole) {
        if (!allowedRoles.includes(userRole)) {
          console.log(`User role ${userRole} not allowed, redirecting to home`);
          setIsRedirecting(true);
          navigate('/');
          return;
        }
      }
    } 
    // For auth pages when user is already authenticated
    else if (isAuthPage && isAuthenticated) {
      console.log('User already authenticated, redirecting based on role');
      setIsRedirecting(true);
      
      if (userRole) {
        switch (userRole) {
          case 'admin':
            navigate('/admin');
            break;
          case 'seller':
            navigate('/seller');
            break;
          case 'delivery':
            navigate('/delivery');
            break;
          default:
            navigate('/');
            break;
        }
      } else {
        navigate('/');
      }
      return;
    }

    setProcessingComplete(true);
  }, [
    isAuthenticated, 
    userRole, 
    authState, 
    loading, 
    requireAuth, 
    allowedRoles, 
    navigate, 
    location, 
    processingComplete,
    isRedirecting
  ]);

  if (authState === 'initializing' || isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-shop-purple mb-4" />
        <p className="text-gray-600">
          {isRedirecting ? 'Redirecting...' : 'Checking authentication...'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
