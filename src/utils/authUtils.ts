
import { supabase } from "@/integrations/supabase/client";

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
      
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'customer' });
        
      if (insertRoleError) {
        console.error("Error creating default role:", insertRoleError);
        return false;
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
 * attempt to repair issues by recreating entries 
 * 
 * @param userId - The user's ID to repair
 * @returns A promise that resolves to a boolean indicating success
 */
export const repairUserEntries = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log(`Attempting to repair entries for user ID: ${userId}`);
    
    // First delete any potentially corrupted entries for this user
    const { error: deleteRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteRoleError) {
      console.warn("Error cleaning up user roles:", deleteRoleError);
      // Continue anyway, as it may not exist
    }
    
    // Create a fresh role entry
    const { error: insertRoleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'customer' });
      
    if (insertRoleError) {
      console.error("Error recreating user role:", insertRoleError);
      return false;
    }
    
    // Now make sure profile exists
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // If no profile, create it
    if (!profileData) {
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert({ id: userId });
        
      if (insertProfileError) {
        console.error("Error creating profile:", insertProfileError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Exception in repairUserEntries:", error);
    return false;
  }
};
