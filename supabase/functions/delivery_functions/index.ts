
// Follow Deno Deploy's ES module conventions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Define the allowed CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid JWT token or user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse the request body
    const { action, ...params } = await req.json();

    console.log("Delivery function called with action:", action, "params:", params);

    // Handle different actions
    switch (action) {
      case 'get_delivery_stats':
        return await getDeliveryStats(supabase, user.id, corsHeaders);
      
      case 'get_available_orders':
        return await getAvailableOrders(supabase, user.id, corsHeaders);
      
      case 'accept_order':
        return await acceptOrder(supabase, user.id, params.orderId, corsHeaders);
      
      case 'complete_delivery':
        return await completeDelivery(supabase, user.id, params.orderId, corsHeaders);
      
      case 'save_schedule':
        return await saveSchedule(supabase, user.id, params.schedule, corsHeaders);
      
      case 'get_schedule':
        return await getSchedule(supabase, user.id, corsHeaders);
      
      case 'get_delivery_assignments':
        return await getDeliveryAssignments(supabase, user.id, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}`, valid_actions: ['get_delivery_stats', 'get_available_orders', 'accept_order', 'complete_delivery', 'save_schedule', 'get_schedule', 'get_delivery_assignments'] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    // Handle any errors
    console.error(`Error processing request:`, error);
    
    // More detailed error response
    let errorMessage = 'Unknown error occurred';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = String(error);
      try {
        errorDetails = JSON.stringify(error);
      } catch (_) {
        // Ignore
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: errorDetails,
        hint: "Check your request parameters and authentication" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Get delivery stats for a delivery person
async function getDeliveryStats(supabase, userId, corsHeaders) {
  console.log("Getting delivery stats for id:", userId);
  
  try {
    // Get completed deliveries count - Fixed the query syntax
    const { count: deliveredCount, error: deliveredError } = await supabase
      .from('delivery_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_person_id', userId)
      .eq('status', 'delivered');
    
    if (deliveredError) {
      console.error("Error fetching completed deliveries:", deliveredError);
      throw deliveredError;
    }
    
    // Get in-progress deliveries count - Fixed the query syntax
    const { count: inProgressCount, error: inProgressError } = await supabase
      .from('delivery_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_person_id', userId)
      .eq('status', 'assigned');
    
    if (inProgressError) {
      console.error("Error fetching in-progress deliveries:", inProgressError);
      throw inProgressError;
    }
    
    // Get recent deliveries (limited to 5)
    const { data: recentDeliveries, error: recentError } = await supabase
      .from('delivery_assignments')
      .select('id, order_id, delivered_at, status')
      .eq('delivery_person_id', userId)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error("Error fetching recent deliveries:", recentError);
      throw recentError;
    }
    
    // Return the stats
    const stats = {
      total_delivered: deliveredCount || 0,
      in_progress: inProgressCount || 0,
      recent_deliveries: recentDeliveries || [],
    };
    
    console.log("Delivery stats:", stats);
    
    return new Response(
      JSON.stringify({ stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting delivery stats:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get delivery stats' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Get available orders for delivery
async function getAvailableOrders(supabase, userId, corsHeaders) {
  console.log("Fetching available orders");
  
  try {
    // Get orders that are paid and don't have delivery assignments yet
    const { data: availableOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        status,
        profiles:user_id (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('status', 'paid')
      .eq('delivery_status', 'pending');
    
    if (ordersError) {
      console.error("Error fetching available orders:", ordersError);
      throw ordersError;
    }
    
    console.log(`Found ${availableOrders?.length || 0} available orders`);
    
    return new Response(
      JSON.stringify({ orders: availableOrders || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting available orders:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get available orders' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Accept an order for delivery
async function acceptOrder(supabase, userId, orderId, corsHeaders) {
  console.log("Accepting order:", orderId, "for user:", userId);
  
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Order ID is required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  try {
    // Check if the order exists and is available
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, delivery_status')
      .eq('id', orderId)
      .eq('status', 'paid')
      .eq('delivery_status', 'pending')
      .single();
    
    if (orderError || !order) {
      console.error("Order not found or not available:", orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found or not available for delivery' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Check if the order is already assigned
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from('delivery_assignments')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (assignmentError) {
      console.error("Error checking existing assignment:", assignmentError);
      throw assignmentError;
    }
    
    if (existingAssignment) {
      return new Response(
        JSON.stringify({ error: 'Order is already assigned to a delivery person' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a new delivery assignment
    const { data: newAssignment, error: createError } = await supabase
      .from('delivery_assignments')
      .insert({
        delivery_person_id: userId,
        order_id: orderId,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating assignment:", createError);
      throw createError;
    }
    
    // Update the order's delivery status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ delivery_status: 'assigned' })
      .eq('id', orderId);
    
    if (updateError) {
      console.error("Error updating order status:", updateError);
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({ success: true, assignment: newAssignment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error accepting order:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to accept order' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Complete a delivery
async function completeDelivery(supabase, userId, orderId, corsHeaders) {
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Order ID is required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  try {
    // Check if the assignment exists and belongs to this delivery person
    const { data: assignment, error: assignmentError } = await supabase
      .from('delivery_assignments')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('delivery_person_id', userId)
      .single();
    
    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found or does not belong to you' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    if (assignment.status === 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Delivery is already marked as completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Update the delivery assignment
    const { error: updateAssignmentError } = await supabase
      .from('delivery_assignments')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);
    
    if (updateAssignmentError) throw updateAssignmentError;
    
    // Update the order's delivery status
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ delivery_status: 'delivered', status: 'completed' })
      .eq('id', orderId);
    
    if (updateOrderError) throw updateOrderError;
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error completing delivery:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to complete delivery' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Save a delivery schedule
async function saveSchedule(supabase, userId, schedule, corsHeaders) {
  if (!schedule || !Array.isArray(schedule)) {
    return new Response(
      JSON.stringify({ error: 'Valid schedule array is required' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  try {
    console.log("Saving schedule for user:", userId, "Schedule:", schedule);
    
    // Delete existing schedule entries
    const { error: deleteError } = await supabase
      .from('delivery_schedules')
      .delete()
      .eq('delivery_person_id', userId);
    
    if (deleteError) {
      console.error("Error deleting existing schedules:", deleteError);
      throw deleteError;
    }
    
    // Insert new schedule entries
    const scheduleData = schedule.map(slot => ({
      delivery_person_id: userId,
      day_of_week: slot.day,
      start_time: slot.startTime,
      end_time: slot.endTime,
      available: slot.available
    }));
    
    const { error: insertError } = await supabase
      .from('delivery_schedules')
      .insert(scheduleData);
    
    if (insertError) {
      console.error("Error inserting schedules:", insertError);
      throw insertError;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error saving schedule:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save schedule' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Get a delivery person's schedule
async function getSchedule(supabase, userId, corsHeaders) {
  try {
    console.log("Getting schedule for user:", userId);
    
    const { data, error } = await supabase
      .from('delivery_schedules')
      .select('*')
      .eq('delivery_person_id', userId);
    
    if (error) {
      console.error("Error fetching schedule:", error);
      throw error;
    }
    
    // Convert to the format expected by the frontend
    const schedule = (data || []).map(item => ({
      id: item.id,
      day: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      available: item.available
    }));
    
    return new Response(
      JSON.stringify({ schedule }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting schedule:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get schedule' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// NEW FUNCTION: Get delivery assignments for a delivery person
async function getDeliveryAssignments(supabase, userId, corsHeaders) {
  try {
    console.log("Getting delivery assignments for user:", userId);
    
    // Get all assignments for this delivery person with order details
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        id, 
        order_id,
        assigned_at,
        delivered_at,
        status,
        notes,
        orders:order_id (
          id,
          created_at,
          total,
          shipping_address,
          shipping_city,
          shipping_state, 
          shipping_postal_code,
          status
        )
      `)
      .eq('delivery_person_id', userId)
      .order('assigned_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching delivery assignments:", error);
      throw error;
    }
    
    // Convert to a nicer format for the frontend
    const assignments = (data || []).map(item => ({
      id: item.id,
      order_id: item.order_id,
      assigned_at: item.assigned_at,
      delivered_at: item.delivered_at,
      status: item.status,
      notes: item.notes,
      order: item.orders
    }));
    
    console.log(`Found ${assignments.length} assignments for delivery person ${userId}`);
    
    return new Response(
      JSON.stringify({ assignments }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting delivery assignments:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get delivery assignments' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
