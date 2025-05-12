
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
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);
    
    if (productsError) throw productsError;
    
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          total_sales: 0, 
          recent_sales: [],
          sales_by_product: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const productIds = products.map(p => p.id);
    
    // Get total sales amount
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        price,
        quantity,
        product_id,
        orders:order_id (
          id,
          created_at,
          status
        )
      `)
      .in('product_id', productIds)
      .order('created_at', { foreignTable: 'orders', ascending: false });
      
    if (orderItemsError) throw orderItemsError;
    
    // Calculate total sales
    let totalSales = 0;
    let recentSales = [];
    
    if (orderItems && orderItems.length > 0) {
      // Process orders that are completed or paid
      const validOrderItems = orderItems.filter(item => 
        item.orders && ['completed', 'paid'].includes(item.orders.status)
      );
      
      // Sum up total sales
      totalSales = validOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Get recent sales (last 5)
      recentSales = validOrderItems.slice(0, 5).map(item => ({
        order_id: item.orders?.id,
        product_id: item.product_id,
        amount: item.price * item.quantity,
        date: item.orders?.created_at
      }));
    }
    
    // Get sales by product
    const { data: productSales, error: productSalesError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        order_items:order_items (
          quantity,
          price,
          order_id
        )
      `)
      .in('id', productIds);
      
    if (productSalesError) throw productSalesError;
    
    // Calculate sales by product
    const salesByProduct = productSales.map(product => {
      const productTotalSales = (product.order_items || []).reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      const productTotalQuantity = (product.order_items || []).reduce((sum, item) => 
        sum + item.quantity, 0
      );
      
      return {
        product_id: product.id,
        product_name: product.name,
        total_sales: productTotalSales,
        quantity_sold: productTotalQuantity
      };
    });
    
    return new Response(
      JSON.stringify({
        total_sales: totalSales,
        recent_sales: recentSales,
        sales_by_product: salesByProduct
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
    // First get all products from this seller
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', sellerId);
    
    if (productsError) throw productsError;
    
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ orders: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const productIds = products.map(p => p.id);
    
    // Query to get pending orders containing seller's products
    // Fixed query to not use "distinctorder_id" which was causing the error
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        product_id,
        order_id,
        orders:order_id (
          id,
          created_at,
          status,
          user_id,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          profiles:user_id (
            first_name,
            last_name
          )
        ),
        products:product_id (
          name,
          image_url
        )
      `)
      .in('product_id', productIds)
      .eq('status', 'paid', { foreignTable: 'orders' })
      .order('created_at', { foreignTable: 'orders', ascending: false });
    
    if (orderItemsError) {
      console.error("Error fetching seller pending orders:", orderItemsError);
      throw orderItemsError;
    }
    
    // Group items by order
    const orderMap = new Map();
    
    if (orderItems && orderItems.length > 0) {
      orderItems.forEach(item => {
        if (item.orders) {
          const orderId = item.order_id;
          
          if (!orderMap.has(orderId)) {
            orderMap.set(orderId, {
              id: orderId,
              created_at: item.orders.created_at,
              customer: {
                name: `${item.orders.profiles?.first_name || ''} ${item.orders.profiles?.last_name || ''}`.trim() || 'Unknown',
                id: item.orders.user_id
              },
              shipping: {
                address: item.orders.shipping_address,
                city: item.orders.shipping_city,
                state: item.orders.shipping_state,
                postal_code: item.orders.shipping_postal_code
              },
              items: []
            });
          }
          
          orderMap.get(orderId).items.push({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown Product',
            product_image: item.products?.image_url || null,
            quantity: item.quantity,
            price: item.price
          });
        }
      });
    }
    
    // Convert map to array
    const orders = Array.from(orderMap.values());
    
    return new Response(
      JSON.stringify({ orders }),
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
    
    if (productsError) throw productsError;
    
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
