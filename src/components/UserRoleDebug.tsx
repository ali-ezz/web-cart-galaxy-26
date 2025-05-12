
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

export function UserRoleDebug() {
  const auth = useAuth();
  
  // Create a safe debug state object without relying on debugAuthState
  const getDebugState = () => {
    // Return basic auth state information
    return {
      user: auth.user ? {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.user_metadata?.name || auth.user.email?.split('@')[0] || 'Anonymous',
        metadata: auth.user.user_metadata
      } : null,
      isAuthenticated: auth.isAuthenticated,
      authState: auth.authState,
      userRole: auth.userRole,
      sessionExists: !!auth.session,
      sessionExpires: auth.session?.expires_at ? new Date(auth.session.expires_at * 1000).toLocaleString() : 'N/A'
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
