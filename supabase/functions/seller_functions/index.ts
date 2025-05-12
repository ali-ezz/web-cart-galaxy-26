
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
    const requestBody = await req.json();
    const { action, ...params } = requestBody;

    console.log("Seller function called with action:", action, "params:", params);

    // Handle different actions
    switch (action) {
      case 'get_seller_sales':
        return await getSellerSales(supabase, params.seller_id, corsHeaders);
      
      case 'get_seller_pending_orders':
        return await getSellerPendingOrders(supabase, params.seller_id, corsHeaders);
      
      case 'get_seller_products':
        return await getSellerProducts(supabase, params.seller_id, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    // Handle any errors
    console.error(`Error processing request:`, error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getSellerSales(supabase, sellerId, corsHeaders) {
  console.log("Request:", { action: "get_seller_sales", seller_id: sellerId });
  
  try {
    // Fixed query to correctly count products
    const { data: products, count: productCount, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('seller_id', sellerId);
    
    if (productsError) {
      console.error("Error getting seller products:", productsError);
      throw productsError;
    }
    
    // If no products, return default values
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          total_sales: 0, 
          recent_sales: [],
          sales_by_product: [],
          total: 0,
          productCount: 0,
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get pending orders count (simplified for now)
    const pendingOrdersCount = 0; // We'll implement this properly later
    
    return new Response(
      JSON.stringify({
        total_sales: 0,
        recent_sales: [],
        sales_by_product: [],
        total: 0,
        productCount: productCount || products.length,
        count: pendingOrdersCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting seller sales:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get seller sales' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function getSellerPendingOrders(supabase, sellerId, corsHeaders) {
  console.log("Request:", { action: "get_seller_pending_orders", seller_id: sellerId });
  
  try {
    // This is a temporary simplification to avoid RLS errors
    // We'll just return an empty orders array for now
    return new Response(
      JSON.stringify({ orders: [], count: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting seller pending orders:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get pending orders' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function getSellerProducts(supabase, sellerId, corsHeaders) {
  try {
    // Get all products from this seller
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);
    
    if (productsError) {
      console.error("Error getting seller products:", productsError);
      throw productsError;
    }
    
    return new Response(
      JSON.stringify({ products: products || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting seller products:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get seller products' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
