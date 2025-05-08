
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header from the request
    const authHeader = req.headers.get("Authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message || "User not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Check if the user has a delivery role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
      
    if (roleError && roleError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: "Error checking user role", details: roleError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Clone the request to avoid body already consumed error
    const requestClone = req.clone();
    // Parse the request body data
    const requestData = await requestClone.json();
    const { action, ...params } = requestData;
    
    if (action !== 'get_available_orders' && (!roleData || roleData.role !== 'delivery')) {
      return new Response(
        JSON.stringify({ error: "Access denied. Delivery role required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Handle the request
    let result;
    
    switch (action) {
      case "get_available_orders":
        // Get orders that are paid but not assigned to a delivery person
        console.log("Fetching available orders");
        
        const { data: availableOrders, error: availableError } = await supabaseClient
          .from('orders')
          .select(`
            *,
            delivery_assignments(order_id)
          `)
          .eq('status', 'paid')
          .eq('delivery_status', 'pending')
          .is('delivery_assignments.order_id', null);
        
        if (availableError) {
          console.error("Error fetching available orders:", availableError);
          throw availableError;
        }
        
        console.log(`Found ${availableOrders?.length || 0} available orders`);
        result = { orders: availableOrders || [] };
        break;

      case "accept_delivery_order":
        // Delivery person accepts an order
        const { order_id } = params;
        const deliveryPersonId = user.id;
        
        if (!order_id) {
          throw new Error("Missing order_id parameter");
        }
        
        // Check if the order is already assigned
        const { data: existingAssignment, error: checkError } = await supabaseClient
          .from('delivery_assignments')
          .select('id')
          .eq('order_id', order_id)
          .maybeSingle();
          
        if (checkError) {
          console.error("Error checking assignment:", checkError);
          throw checkError;
        }
        
        if (existingAssignment) {
          throw new Error("This order is already assigned to a delivery person");
        }
        
        // Create delivery assignment
        const { data: assignment, error: assignmentError } = await supabaseClient
          .from('delivery_assignments')
          .insert({
            order_id,
            delivery_person_id: deliveryPersonId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (assignmentError) {
          console.error("Error creating assignment:", assignmentError);
          throw assignmentError;
        }
        
        // Update order status
        const { error: orderUpdateError } = await supabaseClient
          .from('orders')
          .update({ delivery_status: 'assigned' })
          .eq('id', order_id);
          
        if (orderUpdateError) {
          console.error("Error updating order:", orderUpdateError);
          throw orderUpdateError;
        }
        
        result = { success: true, assignment };
        break;

      case "get_delivery_assignments":
        // Get assignments for a delivery person
        const deliveryPersonIdParam = user.id; // Use user ID from authenticated token
        
        const { data: assignments, error: assignmentsError } = await supabaseClient
          .from('delivery_assignments')
          .select(`
            *,
            order:orders(*)
          `)
          .eq('delivery_person_id', deliveryPersonIdParam)
          .order('assigned_at', { ascending: false });
        
        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          throw assignmentsError;
        }
        
        result = { assignments: assignments || [] };
        break;

      case "update_delivery_status":
        // Update delivery status
        const { assignment_id, status, notes } = params;
        
        if (!assignment_id || !status) {
          throw new Error("Missing required parameters");
        }
        
        // Verify assignment belongs to this delivery person
        const { data: assignmentCheck, error: assignmentCheckError } = await supabaseClient
          .from('delivery_assignments')
          .select('order_id')
          .eq('id', assignment_id)
          .eq('delivery_person_id', user.id)
          .single();
          
        if (assignmentCheckError) {
          console.error("Error verifying assignment:", assignmentCheckError);
          throw new Error("Assignment not found or doesn't belong to you");
        }
        
        // Update assignment
        const updateData: any = { status };
        if (notes) updateData.notes = notes;
        if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
        
        const { data: updatedAssignment, error: updateError } = await supabaseClient
          .from('delivery_assignments')
          .update(updateData)
          .eq('id', assignment_id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating assignment:", updateError);
          throw updateError;
        }
        
        // Also update order status if delivered
        if (status === 'delivered') {
          const { error: orderUpdateErr } = await supabaseClient
            .from('orders')
            .update({ delivery_status: 'delivered' })
            .eq('id', assignmentCheck.order_id);
            
          if (orderUpdateErr) {
            console.error("Error updating order:", orderUpdateErr);
            throw orderUpdateErr;
          }
        }
        
        result = { success: true, assignment: updatedAssignment };
        break;

      case "get_delivery_stats":
        // Get stats for a delivery person
        const statsPersonId = user.id; // Use authenticated user ID
        
        console.log("Getting delivery stats for id:", statsPersonId);
        
        // Get completed deliveries count
        const { count: deliveredCount, error: deliveredError } = await supabaseClient
          .from('delivery_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('delivery_person_id', statsPersonId)
          .eq('status', 'delivered');
          
        if (deliveredError) {
          console.error("Error counting delivered:", deliveredError);
          throw deliveredError;
        }
        
        // Get in progress deliveries count
        const { count: assignedCount, error: assignedError } = await supabaseClient
          .from('delivery_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('delivery_person_id', statsPersonId)
          .eq('status', 'assigned');
          
        if (assignedError) {
          console.error("Error counting assigned:", assignedError);
          throw assignedError;
        }
        
        // Get recent deliveries
        const { data: recentDeliveries, error: recentError } = await supabaseClient
          .from('delivery_assignments')
          .select(`
            *,
            order:orders(*)
          `)
          .eq('delivery_person_id', statsPersonId)
          .eq('status', 'delivered')
          .order('delivered_at', { ascending: false })
          .limit(5);
          
        if (recentError) {
          console.error("Error fetching recent:", recentError);
          throw recentError;
        }
        
        result = {
          stats: {
            total_delivered: deliveredCount || 0,
            in_progress: assignedCount || 0,
            recent_deliveries: recentDeliveries || []
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing delivery function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error", stack: error.stack }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
