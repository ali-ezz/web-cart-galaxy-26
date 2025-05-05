
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackageCheck, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  customer_email?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
}

interface OrdersResponse {
  orders: Order[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch seller orders
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sellerOrders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke<OrdersResponse>('seller_functions', {
        body: {
          action: 'get_seller_orders',
          seller_id: user.id
        }
      });
      
      if (error) throw error;
      
      return data?.orders || [];
    },
    enabled: !!user?.id,
  });
  
  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('seller_functions', {
        body: {
          action: 'update_order_status',
          order_id: orderId,
          status: newStatus,
          seller_id: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Order Updated",
        description: `Order #${orderId.substring(0, 8)} has been marked as ${newStatus}`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the order",
        variant: "destructive",
      });
    }
  };
  
  // Filter and search orders
  const filteredOrders = data?.filter(order => {
    let matchesSearch = true;
    let matchesStatus = true;
    
    // Apply search filter
    if (searchTerm) {
      matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.items.some(item => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Apply status filter
    if (statusFilter) {
      matchesStatus = order.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });
  
  // Group orders by status for the summary
  const ordersByStatus = data?.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {}) || {};
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading your orders...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Loading Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">There was a problem loading your orders.</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="mt-2 md:mt-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total</CardTitle>
            <CardDescription>All orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50" onClick={() => setStatusFilter('pending')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending</CardTitle>
            <CardDescription>Awaiting processing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ordersByStatus['pending'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50" onClick={() => setStatusFilter('processing')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Processing</CardTitle>
            <CardDescription>In progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ordersByStatus['processing'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50" onClick={() => setStatusFilter('shipped')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Shipped</CardTitle>
            <CardDescription>On their way</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ordersByStatus['shipped'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50" onClick={() => setStatusFilter('delivered')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Delivered</CardTitle>
            <CardDescription>Completed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ordersByStatus['delivered'] || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10"
            placeholder="Search orders by ID, product, or customer email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button 
            variant={statusFilter === 'processing' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('processing')}
          >
            Processing
          </Button>
          <Button 
            variant={statusFilter === 'shipped' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('shipped')}
          >
            Shipped
          </Button>
          <Button 
            variant={statusFilter === 'delivered' ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered
          </Button>
        </div>
      </div>
      
      {/* Orders Table */}
      {filteredOrders?.length ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{order.customer_email || 'Anonymous'}</TableCell>
                    <TableCell>
                      {order.items.map((item, i) => (
                        <div key={i} className="text-sm">
                          {item.quantity}x {item.product_name || `Product #${item.product_id.substring(0, 5)}`}
                          {i < order.items.length - 1 ? ', ' : ''}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <OrderActions 
                        order={order}
                        onUpdateStatus={updateOrderStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          {searchTerm || statusFilter ? (
            <>
              <PackageCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-1">No matching orders found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter(null); }}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <PackageCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-1">No orders yet</h3>
              <p className="text-gray-500">Your order history will appear here once customers start purchasing your products.</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'processing':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Processing</Badge>;
    case 'shipped':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Shipped</Badge>;
    case 'delivered':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Order actions component
function OrderActions({ order, onUpdateStatus }: { 
  order: Order, 
  onUpdateStatus: (id: string, status: string) => Promise<void> 
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleUpdateStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Define available actions based on current status
  const getAvailableActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled={isUpdating}
            onClick={() => handleUpdateStatus('processing')}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Order
          </Button>
        );
      case 'processing':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled={isUpdating}
            onClick={() => handleUpdateStatus('shipped')}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark Shipped
          </Button>
        );
      case 'shipped':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled={isUpdating}
            onClick={() => handleUpdateStatus('delivered')}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark Delivered
          </Button>
        );
      default:
        return (
          <Button 
            size="sm" 
            variant="outline" 
            disabled={true}
          >
            Complete
          </Button>
        );
    }
  };
  
  return getAvailableActions();
}
