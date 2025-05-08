
import React, { useState } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { repairUserEntries } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginTroubleshootingProps {
  onRepair?: () => void;
}

export default function LoginTroubleshooting({ onRepair }: LoginTroubleshootingProps) {
  const [repairing, setRepairing] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        const userId = data.session.user.id;
        console.log(`Attempting account repair for user ID: ${userId}`);
        
        // Try to get metadata before signing out
        const roleFromMetadata = data.session.user.user_metadata?.role_request;
        if (roleFromMetadata) {
          console.log(`Found role in metadata: ${roleFromMetadata}`);
        }
        
        const repaired = await repairUserEntries(userId);
        
        if (repaired) {
          toast({
            title: "Repair successful",
            description: "Your account has been repaired. Please try logging in again.",
          });
          
          // Wait a moment before signing out to allow toast to be seen
          setTimeout(async () => {
            await supabase.auth.signOut();
            if (onRepair) onRepair();
            
            // Reload the page after a short delay
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }, 2000);
          
        } else {
          toast({
            title: "Repair failed",
            description: "Could not repair your account. Please try signing out and back in.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Not logged in",
          description: "You need to be logged in to repair your account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during repair:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during repair.",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Having trouble? Click here
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login Troubleshooting</AlertDialogTitle>
          <AlertDialogDescription>
            If you're having trouble logging in, we can try to repair your account data. 
            This will reset your role permissions and fix any database inconsistencies.
            <div className="mt-2 text-sm text-orange-600">
              Note: If you logged in with a social provider (Google, GitHub, etc.), 
              you may need to sign out and sign back in for role changes to take effect.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={repairing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRepair} disabled={repairing}>
            {repairing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Repairing...
              </>
            ) : (
              'Repair My Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
