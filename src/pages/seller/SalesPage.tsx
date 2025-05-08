
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Loader2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['sellerSales', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Fetching sales data from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // First get all product IDs for this seller
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', user.id);
          
        if (productsError) throw productsError;
        
        if (!products || products.length === 0) {
          return { 
            orders: [], 
            totalSales: 0, 
            totalOrders: 0,
            averageOrderValue: 0,
            recentTransactions: []
          };
        }
        
        const productIds = products.map(p => p.id);
        
        // Get order items for the seller's products
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('order_id, price, quantity, product_id')
          .in('product_id', productIds);
          
        if (itemsError) throw itemsError;
        
        if (!orderItems || orderItems.length === 0) {
          return { 
            orders: [],
            totalSales: 0, 
            totalOrders: 0,
            averageOrderValue: 0,
            recentTransactions: []
          };
        }
        
        // Get the order details
        const orderIds = [...new Set(orderItems.map(item => item.order_id))];
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        // Calculate totals
        let totalSales = 0;
        const orderMap = new Map();
        
        orderItems.forEach(item => {
          totalSales += item.price * item.quantity;
          
          if (!orderMap.has(item.order_id)) {
            orderMap.set(item.order_id, {
              total: 0,
              items: []
            });
          }
          
          const orderData = orderMap.get(item.order_id);
          orderData.total += item.price * item.quantity;
          orderData.items.push(item);
        });
        
        // Format orders with total sales for this seller
        const formattedOrders = orders ? orders.map(order => ({
          ...order,
          sellerTotal: orderMap.get(order.id)?.total || 0,
          items: orderMap.get(order.id)?.items || []
        })) : [];
        
        // Get last 5 transactions for the recent list
        const recentTransactions = formattedOrders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        return {
          orders: formattedOrders,
          totalSales,
          totalOrders: formattedOrders.length,
          averageOrderValue: formattedOrders.length > 0 ? totalSales / formattedOrders.length : 0,
          recentTransactions
        };
      } catch (error: any) {
        console.error('Error fetching sales data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sales data',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sales & Earnings</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error Loading Sales Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              We encountered a problem while loading your sales data. 
              Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <DollarSign className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">${salesData?.totalSales.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <ShoppingCart className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">{salesData?.totalOrders || 0}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <TrendingUp className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">${salesData?.averageOrderValue.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Transactions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest 5 sales</CardDescription>
            </CardHeader>
            <CardContent>
              {salesData?.recentTransactions && salesData.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">Order ID</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.recentTransactions.map((order) => (
                        <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {order.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">${order.sellerTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No transactions found in the last 30 days.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Monthly Breakdown */}
          {salesData?.orders && salesData.orders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Breakdown</CardTitle>
                <CardDescription>Sales trend for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <p className="text-center text-gray-500 py-10">
                    Sales chart would be displayed here, showing daily or weekly sales trends.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
