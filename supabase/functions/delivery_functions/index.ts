
// Supabase Edge Function for delivery-related operations
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { action, ...data } = await req.json();

    let result;

    switch (action) {
      case 'get_available_orders':
        // Get orders that are not assigned to any delivery person
        const { data: availableOrders, error: availableError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'paid')
          .eq('delivery_status', 'pending')
          .not('id', 'in', (subquery) => 
            subquery.from('delivery_assignments').select('order_id')
          )
          .order('created_at', { ascending: false });
        
        if (availableError) throw availableError;
        result = { orders: availableOrders };
        break;

      case 'accept_delivery_order':
        // Create a delivery assignment record
        const { order_id, delivery_person_id } = data;
        
        const { data: assignment, error: assignmentError } = await supabase
          .from('delivery_assignments')
          .insert({
            order_id,
            delivery_person_id,
            status: 'assigned',
          })
          .select()
          .single();
        
        if (assignmentError) throw assignmentError;
        
        // Update the order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            delivery_status: 'assigned'
          })
          .eq('id', order_id);
          
        if (orderError) throw orderError;
        result = assignment;
        break;

      case 'get_delivery_assignments':
        // Get assignments for a delivery person
        const { data: assignments, error: assignmentsError } = await supabase
          .from('delivery_assignments')
          .select(`
            *,
            order:orders(*)
          `)
          .eq('delivery_person_id', data.delivery_person_id)
          .order('assigned_at', { ascending: false });
        
        if (assignmentsError) throw assignmentsError;
        result = assignments;
        break;

      case 'update_delivery_status':
        const { assignment_id, new_status, assignment_notes } = data;
        const updates: any = { status: new_status };
        
        if (new_status === 'delivered') {
          updates.delivered_at = new Date().toISOString();
        }
        
        if (assignment_notes) {
          updates.notes = assignment_notes;
        }
        
        // Update the delivery assignment
        const { data: updatedAssignment, error: updateError } = await supabase
          .from('delivery_assignments')
          .update(updates)
          .eq('id', assignment_id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        // Get the order ID
        const { data: assignmentData, error: getError } = await supabase
          .from('delivery_assignments')
          .select('order_id')
          .eq('id', assignment_id)
          .single();
          
        if (getError || !assignmentData) throw getError || new Error('Assignment not found');
        
        // Update the order status
        const orderStatus = new_status === 'delivered' ? 'completed' : 'paid';
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ 
            delivery_status: new_status,
            ...(new_status === 'delivered' ? { status: orderStatus } : {})
          })
          .eq('id', assignmentData.order_id);
          
        if (orderUpdateError) throw orderUpdateError;
        result = updatedAssignment;
        break;

      case 'get_delivery_stats':
        // Get stats for a delivery person
        const delivery_person_id = data.delivery_person_id;
        
        // Count assigned deliveries (not delivered)
        const { count: assignedCount, error: assignedError } = await supabase
          .from('delivery_assignments')
          .select('*', { count: 'exact' })
          .eq('delivery_person_id', delivery_person_id)
          .neq('status', 'delivered');
          
        if (assignedError) throw assignedError;
        
        // Count completed deliveries
        const { count: completedCount, error: completedError } = await supabase
          .from('delivery_assignments')
          .select('*', { count: 'exact' })
          .eq('delivery_person_id', delivery_person_id)
          .eq('status', 'delivered');
          
        if (completedError) throw completedError;
        
        // Calculate total earnings (placeholder - this would need to be implemented based on your payment model)
        const totalEarnings = 0; // Replace with actual calculation if available
        
        result = { 
          assignedCount: assignedCount || 0,
          completedCount: completedCount || 0,
          totalEarnings
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
