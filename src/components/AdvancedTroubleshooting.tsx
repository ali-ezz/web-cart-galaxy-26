
import React from 'react';
import LoginTroubleshooting from './LoginTroubleshooting';
import { DatabaseConnectionCheck } from './DatabaseConnectionCheck';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Database, Key } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/context/AuthContext';

interface AdvancedTroubleshootingProps {
  showDbCheck?: boolean;
  onRepair?: () => void;
}

export function AdvancedTroubleshooting({ showDbCheck = true, onRepair }: AdvancedTroubleshootingProps) {
  const { user, userRole } = useAuth();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <Alert className="bg-blue-50 border border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Having trouble with the application? Try these troubleshooting steps to resolve common issues.
          </AlertDescription>
        </Alert>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Auth Status:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
          {user && <p><strong>User ID:</strong> {user.id}</p>}
          {userRole && <p><strong>User Role:</strong> {userRole}</p>}
        </div>
        
        <LoginTroubleshooting onRepair={onRepair} />
        
        {showDbCheck && (
          <>
            <Separator className="my-3" />
            <DatabaseConnectionCheck />
          </>
        )}
      </CardContent>
    </Card>
  );
}
