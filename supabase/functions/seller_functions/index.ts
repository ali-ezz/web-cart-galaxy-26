
// Supabase Edge Function for seller-related operations
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
      case 'get_seller_sales':
        // Calculate total sales for a seller
        const { seller_id } = data;
        const { data: orderItems, error: salesError } = await supabase
          .from('order_items')
          .select(`
            price,
            quantity,
            product:products(seller_id)
          `)
          .eq('product.seller_id', seller_id);
        
        if (salesError) throw salesError;
        
        const totalSales = orderItems?.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0) || 0;
        
        result = { total: totalSales };
        break;

      case 'get_seller_pending_orders':
        // Get count of pending orders for a seller's products
        const { data: pendingOrders, error: ordersError } = await supabase
          .from('order_items')
          .select(`
            id,
            order:orders(status),
            product:products(seller_id)
          `)
          .eq('product.seller_id', data.seller_id)
          .eq('order.status', 'paid');
        
        if (ordersError) throw ordersError;
        
        // Count unique order IDs
        const uniqueOrderIds = new Set();
        pendingOrders?.forEach(item => {
          if (item.order && item.order.status === 'paid') {
            uniqueOrderIds.add(item.order.id);
          }
        });
        
        result = { count: uniqueOrderIds.size };
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
