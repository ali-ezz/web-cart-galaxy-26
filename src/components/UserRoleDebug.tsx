
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

export function UserRoleDebug() {
  const auth = useAuth();
  
  // Safely access debugAuthState if it exists
  const getDebugState = () => {
    if (typeof auth.debugAuthState === 'function') {
      return auth.debugAuthState();
    }
    
    // Fallback if debugAuthState doesn't exist
    return {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      authState: auth.authState,
      userRole: auth.userRole,
    };
  };
  
  const debugState = getDebugState();
  
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <h3 className="text-xs font-semibold mb-2">Debug Info:</h3>
        <div className="text-xs overflow-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugState, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
