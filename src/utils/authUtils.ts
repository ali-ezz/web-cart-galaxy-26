
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
    
    // Add a small delay to ensure connections are established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First check if user has a role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
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
      }
      
      // Do a direct insert first as it's faster
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: roleToAssign 
        });
        
      if (insertRoleError) {
        console.error("Error creating role directly:", insertRoleError);
        
        // Try using repair function as fallback
        const { data: repairData, error: repairError } = await supabase
          .rpc('repair_user_entries', { user_id: userId });
          
        if (repairError) {
          console.error("Repair function failed:", repairError);
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
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error checking user profile:", profileError);
      return false;
    }
    
    // If profile not found, create it
    if (!profileData) {
      console.log(`No profile found for user ${userId}, creating profile`);
      
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .upsert({ id: userId });
        
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
    
    // Add a small delay to ensure connections are established
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // First try to get the current session to access metadata
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error retrieving session:", sessionError);
    }
    
    // Extract role from metadata if present
    let roleFromMetadata: string | null = null;
    if (sessionData?.session?.user?.user_metadata?.role_request) {
      roleFromMetadata = sessionData.session.user.user_metadata.role_request as string;
      console.log(`Found role in metadata: ${roleFromMetadata}`);
    }
    
    // Try the RPC function first
    const { data, error } = await supabase
      .rpc('repair_user_entries', { user_id: userId });
      
    if (error) {
      console.error("Error calling repair function:", error);
      
      // If function call fails, try manual repair
      
      // First delete potentially corrupted entries
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Create a fresh role entry based on metadata or default to customer
      const roleToUse = roleFromMetadata && ['admin', 'seller', 'customer', 'delivery'].includes(roleFromMetadata)
        ? roleFromMetadata as Database["public"]["Enums"]["user_role"]
        : 'customer';
        
      console.log(`Using role for repair: ${roleToUse}`);
      
      // Insert the role
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: roleToUse
        });
        
      if (insertRoleError) {
        console.error("Manual role repair failed:", insertRoleError);
        return false;
      }
      
      // Make sure profile exists
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .upsert({ id: userId });
        
      if (insertProfileError) {
        console.error("Manual profile repair failed:", insertProfileError);
        return false;
      }
      
      console.log("Manual repair completed successfully");
      return true;
    }
    
    console.log("Repair function succeeded");
    return data === true;
  } catch (error) {
    console.error("Exception in repairUserEntries:", error);
    return false;
  }
};

/**
 * Quickly checks if a user exists in the system
 * This is a lightweight version of verifyUserConsistency just for existence check
 * 
 * @param userId - The user's ID to check
 * @returns A promise that resolves to a boolean indicating if the user exists
 */
export const checkUserExists = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Check if user has a profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error("Error checking if user exists:", error);
      return false;
    }
    
    // Also check auth.users as a backup (requires elevated permissions)
    if (!data) {
      try {
        // Try to get user from auth.users via getUser API call
        const { data: userData, error: userError } = await supabase.auth.getUser();
        return !!userData.user && userData.user.id === userId;
      } catch (authError) {
        console.error("Error checking auth user:", authError);
        return false;
      }
    }
    
    return !!data;
  } catch (error) {
    console.error("Exception checking if user exists:", error);
    return false;
  }
};
