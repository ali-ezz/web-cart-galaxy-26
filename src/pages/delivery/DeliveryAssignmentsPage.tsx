
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Order {
  id: string;
  created_at: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  total: number;
  status: string;
}

interface DeliveryAssignment {
  id: string;
  order_id: string;
  delivery_person_id: string;
  assigned_at: string;
  status: string;
  delivered_at: string | null;
  notes: string | null;
  order: Order;
}

export default function DeliveryAssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  // Fetch delivery assignments for the current user
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['myAssignments'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('delivery_person_id', user.id)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data as DeliveryAssignment[];
    },
    enabled: !!user?.id,
  });

  // Mutation for updating delivery status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: string, notes: string }) => {
      const updates: any = { status };
      
      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }
      
      if (notes) {
        updates.notes = notes;
      }
      
      // Update the delivery assignment
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // If delivered, update the order status as well
      if (status === 'delivered') {
        await supabase
          .from('orders')
          .update({ 
            delivery_status: 'delivered',
            status: 'completed'
          })
          .eq('id', data.order_id);
      } else {
        // For other statuses, update only the delivery_status
        await supabase
          .from('orders')
          .update({ delivery_status: status })
          .eq('id', data.order_id);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      
      toast({
        title: 'Status Updated',
        description: 'Delivery status has been successfully updated.',
      });
      
      setUpdateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  });

  const handleOpenUpdateDialog = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setUpdateStatus(assignment.status);
    setNotes(assignment.notes || '');
    setUpdateDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedAssignment || !updateStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedAssignment.id,
      status: updateStatus,
      notes,
    });
  };

  // Format address for display
  const formatAddress = (order: Order) => {
    return `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'in_transit':
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'delivered':
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case 'failed':
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Delivery Assignments</h1>
        <p className="text-gray-600 mt-1">Manage your current delivery tasks</p>
      </div>
      
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Error loading assignments. Please try again.</p>
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="p-8 text-center">
            <PackageCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No active assignments</h3>
            <p className="text-gray-500 mb-4">
              You don't have any active delivery assignments.
            </p>
            <Button onClick={() => window.location.href = '/delivery/available'}>
              View Available Orders
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.order_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[200px]" title={formatAddress(assignment.order)}>
                          {formatAddress(assignment.order)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>${assignment.order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={getStatusBadge(assignment.status)}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline"
                        onClick={() => handleOpenUpdateDialog(assignment)}
                        disabled={assignment.status === 'delivered'}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
      
      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              Change the status of this delivery and add any relevant notes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any details about this delivery..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending || !updateStatus}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
