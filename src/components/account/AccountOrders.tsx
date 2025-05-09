
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Package, 
  Truck, 
  AlertCircle, 
  EyeIcon, 
  CheckCircle, 
  Clock
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  delivery_status: string;
  tracking_number: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  items: OrderItem[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

const deliveryStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

const orderStatuses = [
  "pending", "paid", "processing", "shipped", "delivered", "completed", "canceled"
];

export default function AccountOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);
  
  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              product_id,
              quantity,
              price,
              products:product_id (name)
            `)
            .eq('order_id', order.id);
          
          if (itemsError) throw itemsError;
          
          const items = (itemsData || []).map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
          }));
          
          return {
            ...order,
            items,
          };
        })
      );
      
      setOrders(ordersWithItems);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      toast({
        title: 'Error',
        description: 'Failed to load your orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };
  
  const getDeliveryStatusBadgeClass = (status: string) => {
    return deliveryStatusColors[status as keyof typeof deliveryStatusColors] || "bg-gray-100 text-gray-800";
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'paid':
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'shipped':
      case 'in_transit':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'canceled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Orders</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchOrders}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Orders</h2>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <Button asChild>
              <a href="/">Start Shopping</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      {order.delivery_status && order.delivery_status !== 'pending' && (
                        <Badge className={getDeliveryStatusBadgeClass(order.delivery_status)}>
                          {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => viewOrderDetails(order)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        {selectedOrder && (
                          <>
                            <SheetHeader>
                              <SheetTitle>Order #{selectedOrder.id.substring(0, 8)}</SheetTitle>
                              <SheetDescription>
                                Placed on {formatDate(selectedOrder.created_at)}
                              </SheetDescription>
                            </SheetHeader>
                            
                            <div className="py-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                  {getOrderStatusIcon(selectedOrder.status)}
                                  <span className="ml-2 font-medium">
                                    Status: {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                  </span>
                                </div>
                                <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                </Badge>
                              </div>
                              
                              {selectedOrder.tracking_number && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                                  <p className="text-sm font-medium">Tracking Number:</p>
                                  <p className="text-sm">{selectedOrder.tracking_number}</p>
                                </div>
                              )}
                              
                              <Accordion type="single" collapsible className="mb-4">
                                <AccordionItem value="items">
                                  <AccordionTrigger>Order Items</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2">
                                      {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                          <div>
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">
                                              {item.quantity} × ${item.price.toFixed(2)}
                                            </p>
                                          </div>
                                          <p className="font-medium">
                                            ${(item.price * item.quantity).toFixed(2)}
                                          </p>
                                        </div>
                                      ))}
                                      <div className="flex justify-between items-center pt-2">
                                        <p className="font-semibold">Total:</p>
                                        <p className="font-semibold">${selectedOrder.total.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="shipping">
                                  <AccordionTrigger>Shipping Address</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-1">
                                      <p>{selectedOrder.shipping_address}</p>
                                      <p>
                                        {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}
                                      </p>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                              
                              <div className="border-t pt-4">
                                <p className="font-semibold text-lg">Order Summary</p>
                                <div className="flex justify-between mt-2">
                                  <p>Subtotal:</p>
                                  <p>${selectedOrder.total.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between mt-2">
                                  <p>Shipping:</p>
                                  <p>Free</p>
                                </div>
                                <div className="flex justify-between mt-2 font-semibold">
                                  <p>Total:</p>
                                  <p>${selectedOrder.total.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <SheetFooter>
                              <SheetClose asChild>
                                <Button variant="outline" className="w-full">Close</Button>
                              </SheetClose>
                            </SheetFooter>
                          </>
                        )}
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
