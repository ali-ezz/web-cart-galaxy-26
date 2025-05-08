
import React from 'react';
import LoginTroubleshooting from './LoginTroubleshooting';
import { DatabaseConnectionCheck } from './DatabaseConnectionCheck';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AdvancedTroubleshootingProps {
  showDbCheck?: boolean;
  onRepair?: () => void;
}

export function AdvancedTroubleshooting({ showDbCheck = true, onRepair }: AdvancedTroubleshootingProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
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
