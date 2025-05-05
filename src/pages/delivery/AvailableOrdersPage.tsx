import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Clock,
  MapPin,
  AlertCircle,
  Truck
} from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  total: number;
  status: string;
  delivery_status: string;
}

export default function AvailableOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch available orders (orders that are not assigned to any delivery person)
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['availableOrders'],
    queryFn: async () => {
      // Use RPC function to get available orders
      const { data: availableOrders, error } = await supabase
        .rpc('get_available_orders');
      
      if (error) throw error;
      return availableOrders as Order[];
    },
    enabled: !!user?.id,
  });

  // Mutation for accepting an order
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Use RPC function to accept an order
      const { data, error } = await supabase
        .rpc('accept_delivery_order', { 
          order_id: orderId,
          delivery_person_id: user!.id
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      
      toast({
        title: 'Order Accepted',
        description: 'You have successfully accepted the delivery order.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept the order',
        variant: 'destructive',
      });
    }
  });

  const handleAcceptOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to accept this delivery order?')) {
      acceptOrderMutation.mutate(orderId);
    }
  };

  // Format address for display
  const formatAddress = (order: Order) => {
    return `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Orders</h1>
        <p className="text-gray-600 mt-1">Orders available for delivery</p>
      </div>
      
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Error loading orders. Please try again.</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No orders available</h3>
            <p className="text-gray-500 mb-4">
              There are currently no orders available for delivery.
            </p>
            <Button onClick={() => navigate('/delivery')}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[200px]" title={formatAddress(order)}>
                          {formatAddress(order)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={acceptOrderMutation.isPending}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
