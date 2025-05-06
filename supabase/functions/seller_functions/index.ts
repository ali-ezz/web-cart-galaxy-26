
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name?: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  customer_email?: string;
  items: OrderItem[];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get JWT token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify JWT token
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token", details: userError }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Get seller role from database
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "User role not found" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if the user is a seller
    if (roleData.role !== "seller" && roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Access denied: User is not a seller" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse the request body
    const requestBody = await req.json();
    console.log("Request:", requestBody);

    // Handle different actions
    const { action } = requestBody;

    switch (action) {
      case "get_seller_products":
        return await getSellerProducts(supabaseClient, user.id, corsHeaders);

      case "get_seller_sales":
        return await getSellerSales(supabaseClient, user.id, corsHeaders);

      case "get_seller_pending_orders":
        return await getSellerPendingOrders(supabaseClient, user.id, corsHeaders);

      case "get_seller_orders":
        return await getSellerOrders(supabaseClient, user.id, corsHeaders);

      case "update_order_status":
        return await updateOrderStatus(
          supabaseClient,
          user.id,
          requestBody.order_id,
          requestBody.status,
          corsHeaders
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Get all products for a seller
async function getSellerProducts(supabaseClient: any, sellerId: string, headers: Record<string, string>) {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching seller products:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch products", details: error }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({ products: data }),
    { status: 200, headers }
  );
}

// Get total sales for a seller
async function getSellerSales(supabaseClient: any, sellerId: string, headers: Record<string, string>) {
  try {
    // First get all product IDs for this seller
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id")
      .eq("seller_id", sellerId);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ total: 0 }),
        { status: 200, headers }
      );
    }

    const productIds = products.map((p: { id: string }) => p.id);

    // Get all order items for these products
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("price, quantity, order_id")
      .in("product_id", productIds);

    if (itemsError) throw itemsError;
    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({ total: 0 }),
        { status: 200, headers }
      );
    }

    // Calculate total sales
    const total = orderItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => 
        sum + (item.price * item.quantity), 
      0
    );

    return new Response(
      JSON.stringify({ total }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error calculating seller sales:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate sales", details: error }),
      { status: 500, headers }
    );
  }
}

// Count pending orders for a seller
async function getSellerPendingOrders(supabaseClient: any, sellerId: string, headers: Record<string, string>) {
  try {
    // First get all product IDs for this seller
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id")
      .eq("seller_id", sellerId);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ count: 0 }),
        { status: 200, headers }
      );
    }

    const productIds = products.map((p: { id: string }) => p.id);

    // Get distinct order IDs that contain seller products and are pending or processing
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("distinct order_id")
      .in("product_id", productIds);

    if (itemsError) throw itemsError;
    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({ count: 0 }),
        { status: 200, headers }
      );
    }

    const orderIds = orderItems.map((item: { order_id: string }) => item.order_id);

    // Count orders that are pending or processing
    const { count, error: countError } = await supabaseClient
      .from("orders")
      .select("id", { count: "exact" })
      .in("id", orderIds)
      .in("status", ["pending", "processing"]);

    if (countError) throw countError;

    return new Response(
      JSON.stringify({ count: count || 0 }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error fetching seller pending orders:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch pending orders", details: error }),
      { status: 500, headers }
    );
  }
}

// Get all orders for a seller with product details
async function getSellerOrders(supabaseClient: any, sellerId: string, headers: Record<string, string>) {
  try {
    // Get all products for this seller
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id, name")
      .eq("seller_id", sellerId);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ orders: [] }),
        { status: 200, headers }
      );
    }

    const productIds = products.map((p: { id: string }) => p.id);
    const productMap = products.reduce((map: Record<string, string>, product: { id: string, name: string }) => {
      map[product.id] = product.name;
      return map;
    }, {});

    // Get order items for these products
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("id, order_id, product_id, price, quantity")
      .in("product_id", productIds);

    if (itemsError) throw itemsError;
    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({ orders: [] }),
        { status: 200, headers }
      );
    }

    // Group order items by order ID
    const orderItemsMap = orderItems.reduce((map: Record<string, OrderItem[]>, item: OrderItem) => {
      if (!map[item.order_id]) map[item.order_id] = [];
      // Add product name to item
      item.product_name = productMap[item.product_id];
      map[item.order_id].push(item);
      return map;
    }, {});

    const orderIds = Object.keys(orderItemsMap);

    // Get the orders
    const { data: orders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, created_at, status, total, user_id")
      .in("id", orderIds)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;
    if (!orders) {
      return new Response(
        JSON.stringify({ orders: [] }),
        { status: 200, headers }
      );
    }

    // Get user emails for the orders
    const userIds = [...new Set(orders.map((order: Order) => order.user_id))];
    const { data: users, error: usersError } = await supabaseClient
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const userEmails: Record<string, string> = {};
    if (!usersError && users) {
      users.forEach((user: { id: string, email: string }) => {
        userEmails[user.id] = user.email;
      });
    }

    // Combine orders with their items and user emails
    const fullOrders = orders.map((order: Order) => ({
      ...order,
      customer_email: userEmails[order.user_id],
      items: orderItemsMap[order.id] || []
    }));

    return new Response(
      JSON.stringify({ orders: fullOrders }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch orders", details: error }),
      { status: 500, headers }
    );
  }
}

// Update an order's status
async function updateOrderStatus(
  supabaseClient: any, 
  sellerId: string, 
  orderId: string, 
  newStatus: string,
  headers: Record<string, string>
) {
  try {
    if (!orderId || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Order ID and status are required" }),
        { status: 400, headers }
      );
    }

    // Valid statuses
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: "Invalid status value" }),
        { status: 400, headers }
      );
    }

    // Verify that the seller has products in this order
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id")
      .eq("seller_id", sellerId);

    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "No products found for this seller" }),
        { status: 403, headers }
      );
    }

    const productIds = products.map((p: { id: string }) => p.id);

    // Check if the order contains the seller's products
    const { count, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("id", { count: "exact" })
      .eq("order_id", orderId)
      .in("product_id", productIds);

    if (itemsError) throw itemsError;
    if (!count || count === 0) {
      return new Response(
        JSON.stringify({ error: "No products from this seller in the order" }),
        { status: 403, headers }
      );
    }

    // Update the order status
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id, status")
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: updatedOrder,
        message: `Order status updated to ${newStatus}` 
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update order status", details: error }),
      { status: 500, headers }
    );
  }
}
