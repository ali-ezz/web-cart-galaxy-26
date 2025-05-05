
import React, { useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface SellerSummary {
  totalSales: number;
  activeProducts: number;
  pendingOrders: number;
}

export default function SellerDashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Fetch seller dashboard summary
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['sellerSummary', user?.id],
    queryFn: async (): Promise<SellerSummary> => {
      if (!user?.id) return { totalSales: 0, activeProducts: 0, pendingOrders: 0 };
      
      // 1. Get total sales (completed orders containing products by this seller)
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select(`
          price,
          quantity,
          product:products(seller_id)
        `)
        .eq('product.seller_id', user.id);
      
      if (salesError) throw salesError;
      
      const totalSales = salesData?.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0) || 0;
      
      // 2. Get count of active products by this seller
      const { count: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('seller_id', user.id);
      
      if (productsError) throw productsError;
      
      // 3. Get count of pending orders containing this seller's products
      const { data: pendingOrdersData, error: ordersError } = await supabase
        .from('order_items')
        .select(`
          id,
          order:orders(status),
          product:products(seller_id)
        `)
        .eq('product.seller_id', user.id)
        .eq('order.status', 'paid');
      
      if (ordersError) throw ordersError;
      
      // Count unique order IDs
      const uniqueOrderIds = new Set();
      pendingOrdersData?.forEach(item => {
        if (item.order && item.order.status === 'paid') {
          uniqueOrderIds.add(item.order.id);
        }
      });
      
      return {
        totalSales,
        activeProducts: activeProducts || 0,
        pendingOrders: uniqueOrderIds.size
      };
    },
    enabled: !!user?.id && userRole === 'seller',
  });
  
  useEffect(() => {
    // Redirect if not seller
    if (userRole !== 'seller') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'seller') {
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

  if (error) {
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
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your products and sales</p>
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
