
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface LoginTroubleshootingProps {
  onRepair?: () => void;
}

export default function LoginTroubleshooting({ onRepair }: LoginTroubleshootingProps) {
  const [repairing, setRepairing] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRepair = async () => {
    setRepairing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Authentication error. Please try logging in again.");
        toast({
          title: "Authentication error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        });
        
        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        
        return;
      }
      
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
          setSuccess("Repair successful! We've fixed your account data. Please try logging in again.");
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
          setError("Repair failed. We couldn't fix your account automatically. Please try signing out and back in.");
          toast({
            title: "Repair failed",
            description: "Could not repair your account. Please try signing out and back in.",
            variant: "destructive",
          });
        }
      } else {
        setError("You're not logged in. You need to be logged in to repair your account.");
        toast({
          title: "Not logged in",
          description: "You need to be logged in to repair your account.",
          variant: "destructive",
        });
        
        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error("Error during repair:", error);
      setError("An unexpected error occurred during repair.");
      toast({
        title: "Error",
        description: "An unexpected error occurred during repair.",
        variant: "destructive",
      });
      
      // Redirect to login after a brief delay for any unexpected errors
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Having trouble? Click here
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Login Troubleshooting</AlertDialogTitle>
          <AlertDialogDescription>
            If you're having trouble logging in or seeing a white page after login, we can try to repair your account data. 
            This will reset your role permissions and fix any database inconsistencies.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="my-2 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-orange-700 bg-orange-50 p-3 rounded-md border border-orange-200 mt-2">
          <p className="font-medium mb-1">Common issues this can fix:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Missing user role after registration</li>
            <li>Blank white screen after login</li>
            <li>Not being directed to the correct dashboard</li>
            <li>Account may have been deleted or reset</li>
            <li>Social login users with incorrect roles</li>
          </ul>
        </div>
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={repairing}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleRepair();
            }} 
            disabled={repairing}
            className="bg-shop-purple hover:bg-shop-purple/90"
          >
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
