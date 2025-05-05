
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

    // Get the authorization header from the request
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
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Check if user is an admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin privileges required." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Parse the request body
    const { action, ...params } = await req.json();

    // Handle different admin actions based on the action parameter
    let responseData;

    switch (action) {
      case "get_users":
        // Get all users with their roles
        const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();
        
        if (usersError) throw usersError;
        
        // Get user roles from user_roles table
        const { data: userRoles, error: rolesError } = await supabaseClient
          .from("user_roles")
          .select("user_id, role");
          
        if (rolesError) throw rolesError;
        
        // Map roles to users
        const rolesMap = new Map(userRoles.map(r => [r.user_id, r.role]));
        
        // Format user data
        const formattedUsers = users.users.map(u => ({
          id: u.id,
          email: u.email,
          role: rolesMap.get(u.id) || 'customer',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          status: u.banned ? 'banned' : (u.email_confirmed_at ? 'active' : 'pending')
        }));
        
        responseData = formattedUsers;
        break;

      case "update_user_role":
        // Update user role
        const { user_id, role } = params;
        if (!user_id || !role) {
          throw new Error("Missing required parameters");
        }
        
        // Check if user exists
        const { data: userExists, error: userCheckError } = await supabaseClient.auth.admin.getUserById(user_id);
        if (userCheckError || !userExists) {
          throw new Error("User not found");
        }
        
        // Update or insert role
        const { data: updatedRole, error: updateRoleError } = await supabaseClient
          .from("user_roles")
          .upsert({ user_id, role }, { onConflict: 'user_id' })
          .select();
          
        if (updateRoleError) throw updateRoleError;
        
        responseData = { message: "User role updated successfully", role: updatedRole };
        break;

      case "get_orders_with_users":
        // Get all orders with user information
        const { data: orders, error: ordersError } = await supabaseClient
          .from("orders")
          .select("*, users:user_id(email)");
          
        if (ordersError) throw ordersError;
        
        // Format the response
        const formattedOrders = orders.map(order => ({
          ...order,
          user_email: order.users?.email
        }));
        
        responseData = formattedOrders;
        break;

      case "assign_delivery":
        // Assign a delivery person to an order
        const { order_id } = params;
        if (!order_id) {
          throw new Error("Missing order_id parameter");
        }
        
        // Get available delivery personnel
        const { data: deliveryPersonnel, error: deliveryError } = await supabaseClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "delivery")
          .limit(1);
          
        if (deliveryError || !deliveryPersonnel.length) {
          throw new Error("No available delivery personnel found");
        }
        
        // Assign the delivery person to the order
        const { data: updatedOrder, error: updateOrderError } = await supabaseClient
          .from("orders")
          .update({ delivery_person_id: deliveryPersonnel[0].user_id, status: "processing" })
          .eq("id", order_id)
          .select();
          
        if (updateOrderError) throw updateOrderError;
        
        responseData = { message: "Delivery assigned successfully", order: updatedOrder };
        break;

      case "get_role_applications":
        // Placeholder for role applications logic
        // In a real implementation, we would have a table for role applications
        // For now, we'll return mock data
        responseData = [
          {
            id: "1",
            user_id: "user1",
            user_email: "john.doe@example.com",
            role: "seller",
            status: "pending",
            created_at: new Date().toISOString(),
            question_responses: {
              businessName: "John's Electronics",
              businessType: "Electronics",
              experience: "5 years in retail"
            }
          },
          {
            id: "2",
            user_id: "user2",
            user_email: "jane.smith@example.com",
            role: "delivery",
            status: "pending",
            created_at: new Date().toISOString(),
            question_responses: {
              vehicleType: "Car",
              deliveryExperience: "2 years",
              availability: "Weekdays and weekends"
            }
          }
        ];
        break;

      case "approve_application":
        // Placeholder for approving application
        responseData = { message: "Application approved successfully" };
        break;

      case "reject_application":
        // Placeholder for rejecting application
        responseData = { message: "Application rejected successfully" };
        break;

      case "get_analytics":
        // Get analytics data for admin dashboard
        const { timeRange } = params;
        
        // Mock analytics data
        const mockAnalytics = {
          salesData: Array(7).fill(0).map((_, i) => ({
            day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
            amount: Math.floor(Math.random() * 500) + 100,
            orders: Math.floor(Math.random() * 10) + 1
          })),
          categorySales: [
            { name: "Electronics", value: 4000 },
            { name: "Clothing", value: 3000 },
            { name: "Books", value: 2000 },
            { name: "Home", value: 2780 },
            { name: "Beauty", value: 1890 },
            { name: "Sports", value: 2390 }
          ],
          topProducts: [
            { id: "1", name: "Smartphone X", sales: 42 },
            { id: "2", name: "Wireless Earbuds", sales: 38 },
            { id: "3", name: "Smart Watch", sales: 30 },
            { id: "4", name: "Laptop Pro", sales: 25 },
            { id: "5", name: "Gaming Console", sales: 22 }
          ],
          metrics: {
            totalRevenue: 12589.75,
            totalOrders: 145,
            totalCustomers: 78,
            totalProducts: 250,
            revenueTrend: 12.5,
            ordersTrend: 8.2,
            customersTrend: 5.7,
            productsTrend: -2.1
          }
        };
        
        responseData = mockAnalytics;
        break;

      case "get_store_settings":
        // Get store settings
        responseData = {
          store_name: "E-Commerce Store",
          contact_email: "support@ecommerce-store.com",
          support_phone: "1-800-123-4567",
          address: "123 Commerce St, Business City, ST 12345",
          shipping_policy: "Standard shipping takes 3-5 business days. Express shipping is available for an additional fee.",
          return_policy: "Items can be returned within 30 days of purchase for a full refund.",
          terms_conditions: "By using our service, you agree to our terms and conditions...",
          privacy_policy: "We value your privacy and protect your personal information...",
          maintenance_mode: false,
          enable_seller_applications: true,
          enable_delivery_applications: true
        };
        break;

      case "update_store_settings":
        // Update store settings
        const { settings } = params;
        if (!settings) {
          throw new Error("Missing settings parameter");
        }
        
        // In a real implementation, we would save these settings to a database
        responseData = { message: "Settings updated successfully", settings };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Return success response
    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
