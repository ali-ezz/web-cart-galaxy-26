
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

/**
 * Verifies if a user exists in the system and has proper role and profile
 * Will attempt to create missing entries if needed
 * 
 * @param userId - The user's ID to verify
 * @returns A promise that resolves to a boolean indicating success
 */
export const verifyUserConsistency = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log(`Verifying user consistency for ID: ${userId}`);
    
    // First check if user has a role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    // If there was an error other than "not found"
    if (roleError && roleError.code !== 'PGRST116') {
      console.error("Error checking user role:", roleError);
      return false;
    }
    
    // If role not found, create it
    if (!roleData) {
      console.log(`No role found for user ${userId}, creating default role`);
      
      // Try to get role from user metadata first (for SSO users)
      let roleToAssign: Database["public"]["Enums"]["user_role"] = 'customer';
      
      try {
        // Get the user's metadata to check for role_request
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData?.user?.user_metadata?.role_request) {
          const requestedRole = userData.user.user_metadata.role_request as string;
          if (['admin', 'seller', 'customer', 'delivery'].includes(requestedRole)) {
            roleToAssign = requestedRole as Database["public"]["Enums"]["user_role"];
            console.log(`Using role from metadata: ${roleToAssign}`);
          }
        }
      } catch (metadataError) {
        console.error("Error getting user metadata:", metadataError);
        // Continue with default role
      }
      
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: roleToAssign });
        
      if (insertRoleError) {
        console.error("Error creating default role:", insertRoleError);
        
        // If we get an RLS error, try with invoke repair function
        if (insertRoleError.code === '42501') {
          console.log("Attempting to repair via RPC function...");
          const { data: repairData, error: repairError } = await supabase
            .rpc('repair_user_entries', { user_id: userId });
            
          if (repairError) {
            console.error("Repair function failed:", repairError);
            return false;
          }
          console.log("Repair function succeeded:", repairData);
        } else {
          return false;
        }
      }
    }
    
    // Next check if user has a profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // If there was an error other than "not found"
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error checking user profile:", profileError);
      return false;
    }
    
    // If profile not found, create it
    if (!profileData) {
      console.log(`No profile found for user ${userId}, creating profile`);
      
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert({ id: userId });
        
      if (insertProfileError) {
        console.error("Error creating profile:", insertProfileError);
        return false;
      }
    }
    
    // All checks passed or issues resolved
    return true;
  } catch (error) {
    console.error("Exception in verifyUserConsistency:", error);
    return false;
  }
};

/**
 * Attempts to repair the user's database entries if they are inconsistent
 * This is a more aggressive version of verifyUserConsistency that will
 * attempt to repair issues by recreating entries via RPC
 * 
 * @param userId - The user's ID to repair
 * @returns A promise that resolves to a boolean indicating success
 */
export const repairUserEntries = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log(`Attempting to repair entries for user ID: ${userId}`);
    
    // Call the database function to repair user entries
    const { data, error } = await supabase
      .rpc('repair_user_entries', { user_id: userId });
      
    if (error) {
      console.error("Error calling repair function:", error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error("Exception in repairUserEntries:", error);
    return false;
  }
};
