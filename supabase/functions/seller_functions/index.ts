
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

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
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { action, seller_id, order_id, status } = await req.json();
    
    // Handle different actions
    switch (action) {
      case 'get_seller_sales':
        return await handleGetSellerSales(supabaseClient, seller_id);
      
      case 'get_seller_pending_orders':
        return await handleGetSellerPendingOrders(supabaseClient, seller_id);
      
      case 'get_seller_orders':
        return await handleGetSellerOrders(supabaseClient, seller_id);
      
      case 'update_order_status':
        return await handleUpdateOrderStatus(supabaseClient, seller_id, order_id, status);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Get seller total sales
async function handleGetSellerSales(supabaseClient, sellerId) {
  // Get all products by this seller
  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('id')
    .eq('seller_id', sellerId);
  
  if (productsError) {
    throw new Error(`Error fetching products: ${productsError.message}`);
  }
  
  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ total: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get ids of all seller products
  const productIds = products.map(p => p.id);
  
  // Get all order items for these products
  const { data: orderItems, error: orderItemsError } = await supabaseClient
    .from('order_items')
    .select('price, quantity')
    .in('product_id', productIds);
  
  if (orderItemsError) {
    throw new Error(`Error fetching order items: ${orderItemsError.message}`);
  }
  
  // Calculate total sales
  const total = orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  
  return new Response(
    JSON.stringify({ total }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get pending orders count
async function handleGetSellerPendingOrders(supabaseClient, sellerId) {
  // Get all products by this seller
  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('id')
    .eq('seller_id', sellerId);
  
  if (productsError) {
    throw new Error(`Error fetching products: ${productsError.message}`);
  }
  
  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ count: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get ids of all seller products
  const productIds = products.map(p => p.id);
  
  // Get all order items for these products that are in pending orders
  const { data: orderItems, error: orderItemsError } = await supabaseClient
    .from('order_items')
    .select('order_id')
    .in('product_id', productIds);
  
  if (orderItemsError) {
    throw new Error(`Error fetching order items: ${orderItemsError.message}`);
  }
  
  if (!orderItems || orderItems.length === 0) {
    return new Response(
      JSON.stringify({ count: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get unique order IDs
  const orderIds = [...new Set(orderItems.map(item => item.order_id))];
  
  // Count pending orders
  const { count, error: countError } = await supabaseClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('id', orderIds)
    .in('status', ['pending', 'processing']);
  
  if (countError) {
    throw new Error(`Error counting pending orders: ${countError.message}`);
  }
  
  return new Response(
    JSON.stringify({ count: count || 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get all orders for a seller
async function handleGetSellerOrders(supabaseClient, sellerId) {
  // Get all products by this seller
  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('id, name')
    .eq('seller_id', sellerId);
  
  if (productsError) {
    throw new Error(`Error fetching products: ${productsError.message}`);
  }
  
  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ orders: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get ids of all seller products and create a map for quick lookup
  const productIds = products.map(p => p.id);
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p.name;
  });
  
  // Get all order items for these products
  const { data: orderItems, error: orderItemsError } = await supabaseClient
    .from('order_items')
    .select('id, order_id, product_id, quantity, price')
    .in('product_id', productIds);
  
  if (orderItemsError) {
    throw new Error(`Error fetching order items: ${orderItemsError.message}`);
  }
  
  if (!orderItems || orderItems.length === 0) {
    return new Response(
      JSON.stringify({ orders: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Add product name to each item
  orderItems.forEach(item => {
    item.product_name = productMap[item.product_id];
  });
  
  // Group items by order
  const orderItemMap = {};
  orderItems.forEach(item => {
    if (!orderItemMap[item.order_id]) {
      orderItemMap[item.order_id] = [];
    }
    orderItemMap[item.order_id].push(item);
  });
  
  // Get unique order IDs
  const orderIds = [...new Set(orderItems.map(item => item.order_id))];
  
  // Get order details
  const { data: orders, error: ordersError } = await supabaseClient
    .from('orders')
    .select('id, created_at, status, total, user_id')
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  
  if (ordersError) {
    throw new Error(`Error fetching orders: ${ordersError.message}`);
  }
  
  // Add items to each order
  const ordersWithItems = orders.map(order => ({
    ...order,
    items: orderItemMap[order.id] || []
  }));
  
  // Get customer emails
  for (const order of ordersWithItems) {
    if (order.user_id) {
      const { data: userData, error: userError } = await supabaseClient
        .from('auth.users')
        .select('email')
        .eq('id', order.user_id)
        .single();
      
      if (!userError && userData) {
        order.customer_email = userData.email;
      }
    }
  }
  
  return new Response(
    JSON.stringify({ orders: ordersWithItems }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update order status
async function handleUpdateOrderStatus(supabaseClient, sellerId, orderId, newStatus) {
  // Verify the seller has products in this order
  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('id')
    .eq('seller_id', sellerId);
  
  if (productsError) {
    throw new Error(`Error fetching products: ${productsError.message}`);
  }
  
  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No products found for this seller' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    );
  }
  
  const productIds = products.map(p => p.id);
  
  // Check if the order contains products from this seller
  const { count, error: countError } = await supabaseClient
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .in('product_id', productIds);
  
  if (countError) {
    throw new Error(`Error verifying order: ${countError.message}`);
  }
  
  if (!count || count === 0) {
    return new Response(
      JSON.stringify({ error: 'Order does not contain products from this seller' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    );
  }
  
  // Update the order status
  const { data, error } = await supabaseClient
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  
  if (error) {
    throw new Error(`Error updating order status: ${error.message}`);
  }
  
  return new Response(
    JSON.stringify({ success: true, message: `Order status updated to ${newStatus}` }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
