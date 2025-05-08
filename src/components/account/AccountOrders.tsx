
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, AlertCircle, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
  product_image?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  tracking_number?: string;
  items?: OrderItem[];
}

export default function AccountOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['customerOrders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Get orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        if (!ordersData || ordersData.length === 0) return [];
        
        // For each order, fetch order items
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                price,
                product_id
              `)
              .eq('order_id', order.id);
              
            if (itemsError) throw itemsError;
            
            // Get product details for each item
            const itemsWithProductDetails = await Promise.all(
              (itemsData || []).map(async (item) => {
                const { data: product, error: productError } = await supabase
                  .from('products')
                  .select('name, image_url')
                  .eq('id', item.product_id)
                  .single();
                  
                // If product not found (might have been deleted), return item as is
                if (productError || !product) {
                  return {
                    ...item,
                    product_name: 'Product no longer available',
                    product_image: null
                  };
                }
                
                return {
                  ...item,
                  product_name: product.name,
                  product_image: product.image_url
                };
              })
            );
            
            return {
              ...order,
              items: itemsWithProductDetails
            };
          })
        );
        
        return ordersWithItems;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (isLoading) {
    return (
      <CardContent className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-shop-purple" />
          <p>Loading your orders...</p>
        </div>
      </CardContent>
    );
  }
  
  if (error) {
    return (
      <CardContent className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-medium text-red-800 mb-1">Error Loading Orders</h3>
          <p className="text-red-600 text-sm">
            There was a problem loading your order history. Please try again later.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </CardContent>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <CardContent className="py-6">
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">No Orders Yet</h3>
          <p className="text-gray-500 mb-4">
            You haven't placed any orders yet.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Start Shopping
          </Button>
        </div>
      </CardContent>
    );
  }
  
  return (
    <CardContent className="pt-6">
      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Order #:</span>
                  <span className="font-medium">{order.id.substring(0, 8)}...</span>
                </div>
                <div className="text-sm text-gray-500">
                  Placed on {formatDate(order.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">Status: {getStatusBadge(order.status)}</span>
                <span className="font-medium">${order.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-4">
              {order.items && order.items.length > 0 ? (
                <ul className="divide-y">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-4 flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="font-medium text-gray-900">
                              {item.product_name || 'Unknown Product'}
                            </h3>
                            <p className="ml-4">${item.price.toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No items found for this order.
                </div>
              )}
            </div>
            
            {order.tracking_number && (
              <div className="bg-gray-50 px-4 py-3 border-t">
                <div className="text-sm">
                  <span className="font-medium">Tracking Number:</span>{' '}
                  {order.tracking_number}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  );
}
