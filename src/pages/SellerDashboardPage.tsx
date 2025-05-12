import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  DollarSign, 
  BarChart3,
  Settings,
  Plus,
  ShoppingBag,
  Star,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConnectionCheck } from '@/components/DatabaseConnectionCheck';

// Type for the response from the edge function
interface SellerSalesResponse {
  total: number;
}

// Type for the pending orders response
interface PendingOrdersResponse {
  count: number;
}

export default function SellerDashboardPage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Fetch seller dashboard summary
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['sellerSummary', user?.id],
    queryFn: async (): Promise<SellerSummary> => {
      if (!user?.id) return { totalSales: 0, activeProducts: 0, pendingOrders: 0 };
      
      try {
        // Use the seller functions edge function to get data
        console.log("Fetching sales data for seller:", user.id);
        const { data: salesData, error: salesError } = await supabase.functions.invoke<SellerSalesResponse>('seller_functions', {
          body: {
            action: 'get_seller_sales',
            seller_id: user.id
          }
        });
        
        if (salesError) {
          console.error("Error fetching sales data:", salesError);
          throw salesError;
        }
        
        const totalSales = salesData?.total || 0;
        
        // Get count of active products by this seller
        console.log("Fetching product count for seller:", user.id);
        const { count: activeProducts, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('seller_id', user.id);
        
        if (productsError) {
          console.error("Error fetching product count:", productsError);
          throw productsError;
        }
        
        // Get count of pending orders for this seller's products
        console.log("Fetching pending orders for seller:", user.id);
        try {
          const { data: pendingOrdersData, error: ordersError } = await supabase.functions.invoke<PendingOrdersResponse>('seller_functions', {
            body: {
              action: 'get_seller_pending_orders',
              seller_id: user.id
            }
          });
          
          if (ordersError) {
            console.error("Error fetching pending orders:", ordersError);
            throw ordersError;
          }
          
          return {
            totalSales,
            activeProducts: activeProducts || 0,
            pendingOrders: pendingOrdersData?.count || 0
          };
        } catch (pendingError) {
          console.error("Error in pending orders fetch:", pendingError);
          // Fall back to just showing sales and products
          return {
            totalSales,
            activeProducts: activeProducts || 0,
            pendingOrders: 0
          };
        }
      } catch (error) {
        console.error("Error fetching seller dashboard data:", error);
        setHasError(true);
        setErrorDetails(error instanceof Error ? error.message : String(error));
        
        // Return placeholder data
        return { totalSales: 0, activeProducts: 0, pendingOrders: 0 };
      }
    },
    enabled: !!user?.id && userRole === 'seller',
    retry: 1, // Limit retries to avoid excessive failed attempts
  });
  
  useEffect(() => {
    // Redirect if not seller
    if (userRole !== 'seller' && userRole !== undefined && !isLoading) {
      console.log("Not a seller, redirecting to account page. Current role:", userRole);
      toast({
        title: "Access Restricted",
        description: "You need seller permissions to access this page",
        variant: "destructive",
      });
      navigate('/welcome');
    }
  }, [userRole, navigate, isLoading, toast]);
  
  useEffect(() => {
    // Show toast on error
    if (error) {
      console.error("Error in seller dashboard query:", error);
      toast({
        title: "Dashboard Error",
        description: "There was a problem loading your seller dashboard. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user || (userRole !== 'seller' && userRole !== undefined)) {
    return null; // Don't render anything while redirecting
  }

  const sellerMenuItems = [
    {
      title: 'My Products',
      icon: <Package className="h-5 w-5" />,
      link: '/seller/products',
      description: 'Manage your product listings'
    },
    {
      title: 'Add New Product',
      icon: <Plus className="h-5 w-5" />,
      link: '/seller/products/new',
      description: 'Create a new product listing'
    },
    {
      title: 'Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      link: '/seller/orders',
      description: 'View and manage customer orders'
    },
    {
      title: 'Sales',
      icon: <DollarSign className="h-5 w-5" />,
      link: '/seller/sales',
      description: 'View your earnings and payouts'
    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      link: '/seller/analytics',
      description: 'Track product performance and customer trends'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      link: '/seller/settings',
      description: 'Configure your seller account'
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Loading your dashboard...</p>
        </div>
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your products and sales</p>
        </div>
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">Error loading dashboard</h3>
          <p className="text-gray-600 mb-4">
            There was a problem loading your seller dashboard information.
            {errorDetails && (
              <span className="block mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                Error: {errorDetails}
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate('/welcome')}>
              Go to Welcome Page
            </Button>
          </div>
        </Card>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerMenuItems.map((item, index) => (
              <Card 
                key={index} 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(item.link)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-shop-purple bg-opacity-10 text-shop-purple">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your products and sales</p>
          </div>
          <Button
            variant="outline"
            className="border-shop-purple text-shop-purple hover:bg-shop-purple hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Database Connection Check */}
      <div className="mb-8">
        <DatabaseConnectionCheck />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-lg font-medium mb-1">Total Sales</h3>
          <p className="text-3xl font-bold">
            ${summary?.totalSales.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.totalSales > 0 ? 'Lifetime earnings' : 'No sales yet'}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-green-50 to-teal-50">
          <h3 className="text-lg font-medium mb-1">Active Products</h3>
          <p className="text-3xl font-bold">{summary?.activeProducts}</p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.activeProducts > 0 ? 
              `${summary.activeProducts} product${summary.activeProducts !== 1 ? 's' : ''} listed` : 
              'Add products to start selling'}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50">
          <h3 className="text-lg font-medium mb-1">Pending Orders</h3>
          <p className="text-3xl font-bold">{summary?.pendingOrders}</p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.pendingOrders > 0 ? 
              `${summary.pendingOrders} order${summary.pendingOrders !== 1 ? 's' : ''} to fulfill` : 
              'No pending orders'}
          </p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellerMenuItems.map((item, index) => (
          <Card 
            key={index} 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(item.link)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-shop-purple bg-opacity-10 text-shop-purple">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-lg">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tips for Sellers</h2>
          <Button variant="link">View All</Button>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Take high-quality photos of your products from multiple angles</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Write detailed descriptions highlighting key features</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Price competitively by researching similar products</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Respond quickly to customer inquiries</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
