
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Loader2, TrendingUp, Package, Users } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30days');
  
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['sellerAnalytics', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Calculate date range based on selected timeRange
        const currentDate = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case '7days':
            startDate.setDate(currentDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(currentDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(currentDate.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(currentDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(currentDate.getDate() - 30); // Default to 30 days
        }
        
        // First get all product IDs for this seller
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, category, price, stock, created_at')
          .eq('seller_id', user.id);
          
        if (productsError) throw productsError;
        
        if (!products || products.length === 0) {
          return { 
            products: [],
            categorySales: [],
            lowStockProducts: [],
            totalProducts: 0,
            totalSales: 0
          };
        }
        
        const productIds = products.map(p => p.id);
        
        // Get order items for these products within the date range
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('price, quantity, product_id, order_id')
          .in('product_id', productIds);
          
        if (itemsError) throw itemsError;
        
        // Get orders within the date range
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at')
          .gte('created_at', startDate.toISOString());
          
        if (ordersError) throw ordersError;
        
        // Filter order items to only those from orders within our date range
        const orderIds = orders ? orders.map(order => order.id) : [];
        const filteredOrderItems = orderItems ? 
          orderItems.filter(item => orderIds.includes(item.order_id)) : [];
        
        // Calculate product performance
        const productPerformance = new Map();
        let totalSales = 0;
        const categorySales = {};
        
        // Initialize product performance with all products
        products.forEach(product => {
          productPerformance.set(product.id, {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            sales: 0,
            revenue: 0,
            quantity: 0
          });
          
          // Initialize category sales
          if (!categorySales[product.category]) {
            categorySales[product.category] = {
              category: product.category,
              sales: 0,
              revenue: 0,
              productCount: 0
            };
          }
          
          categorySales[product.category].productCount++;
        });
        
        // Update with sales data
        filteredOrderItems.forEach(item => {
          const product = productPerformance.get(item.product_id);
          if (product) {
            product.sales++;
            product.revenue += item.price * item.quantity;
            product.quantity += item.quantity;
            
            totalSales += item.price * item.quantity;
            
            // Update category sales
            const category = product.category;
            if (categorySales[category]) {
              categorySales[category].sales += item.quantity;
              categorySales[category].revenue += item.price * item.quantity;
            }
          }
        });
        
        // Convert to array and sort by revenue
        const productPerformanceArray = Array.from(productPerformance.values())
          .sort((a, b) => b.revenue - a.revenue);
        
        // Get low stock products (less than 10 items)
        const lowStockProducts = productPerformanceArray
          .filter(product => product.stock < 10)
          .sort((a, b) => a.stock - b.stock);
        
        // Convert category sales to array
        const categorySalesArray = Object.values(categorySales)
          .sort((a: any, b: any) => b.revenue - a.revenue);
        
        return {
          products: productPerformanceArray,
          categorySales: categorySalesArray,
          lowStockProducts,
          totalProducts: products.length,
          totalSales
        };
      } catch (error: any) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        
        <div className="mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              We encountered a problem while loading your analytics data. 
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
                  <TrendingUp className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">${analyticsData?.totalSales.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <Package className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">{analyticsData?.totalProducts || 0}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Unique Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <Users className="h-5 w-5 text-shop-purple mr-2" />
                  <span className="text-3xl font-bold">-</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Data not available</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Analytics Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>
            
            {/* Products Tab */}
            <TabsContent value="products" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                  <CardDescription>Sales data for your products</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.products && analyticsData.products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Units Sold</th>
                            <th scope="col" className="px-6 py-3">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.products.map((product) => (
                            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4">
                                {product.category}
                              </td>
                              <td className="px-6 py-4">
                                {product.quantity}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                ${product.revenue.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No product sales data available for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Sales breakdown by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.categorySales && analyticsData.categorySales.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3"># of Products</th>
                            <th scope="col" className="px-6 py-3">Units Sold</th>
                            <th scope="col" className="px-6 py-3">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.categorySales.map((category: any) => (
                            <tr key={category.category} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {category.category}
                              </td>
                              <td className="px-6 py-4">
                                {category.productCount}
                              </td>
                              <td className="px-6 py-4">
                                {category.sales}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                ${category.revenue.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No category data available for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alert</CardTitle>
                  <CardDescription>Products with low inventory (less than 10 units)</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.lowStockProducts && analyticsData.lowStockProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3">Product Name</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Current Stock</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.lowStockProducts.map((product) => (
                            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4">
                                {product.category}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {product.stock}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  product.stock === 0 ? 'bg-red-100 text-red-800' : 
                                  product.stock < 5 ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {product.stock === 0 ? 'Out of Stock' : 
                                   product.stock < 5 ? 'Critical' : 'Low'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No low stock products found. Inventory levels are good!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
