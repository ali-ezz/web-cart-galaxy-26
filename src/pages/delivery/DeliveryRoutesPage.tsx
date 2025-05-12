
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
  MapPin,
  Route,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeliveryAssignment {
  id: string;
  order_id: string;
  assigned_at: string;
  status: string;
  order: {
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
  };
}

interface RouteStop {
  id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  sequence: number;
}

export default function DeliveryRoutesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [optimizedRoute, setOptimizedRoute] = useState<RouteStop[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Fetch delivery assignments with improved error handling
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ['deliveryAssignments', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        console.log('Fetching delivery assignments for user:', user.id);
        
        const { data, error } = await supabase.functions.invoke('delivery_functions', {
          body: {
            action: 'get_delivery_assignments'
          }
        });
        
        if (error) {
          console.error('Error invoking get_delivery_assignments function:', error);
          setLoadError(`Failed to load assignments: ${error.message || 'Unknown error'}`);
          throw error;
        }
        
        if (!data?.assignments) {
          console.warn('No assignments returned from API');
          return [];
        }
        
        // Filter only in-progress assignments
        const filteredAssignments = data.assignments.filter(
          (a: any) => a.status === 'assigned' || a.status === 'in_transit'
        );
        
        console.log(`Found ${filteredAssignments.length} active assignments`);
        return filteredAssignments || [];
        
      } catch (err: any) {
        console.error("Error fetching assignments:", err);
        setLoadError(err.message || "Failed to load delivery assignments");
        throw new Error(err.message || "Failed to load delivery assignments");
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000),
    staleTime: 60000, // 1 minute
  });

  // Format address for display
  const formatAddress = (assignment: DeliveryAssignment) => {
    const order = assignment.order;
    return `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`;
  };
  
  // Retry data loading if it failed
  const handleRetryLoad = () => {
    setLoadError(null);
    refetch();
  };
  
  // Mock function to optimize routes (in a real app, this would use an actual routing algorithm or API)
  const optimizeRoute = () => {
    setIsOptimizing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (assignments && assignments.length > 0) {
        // Create a copy and sort it randomly to simulate optimization
        // In a real app, you would use an actual routing algorithm here
        const routeStops: RouteStop[] = assignments.map((assignment: DeliveryAssignment, index: number) => ({
          id: assignment.id,
          address: assignment.order.shipping_address,
          city: assignment.order.shipping_city,
          state: assignment.order.shipping_state,
          postal_code: assignment.order.shipping_postal_code,
          sequence: index + 1
        }));
        
        // Randomly shuffle to simulate optimization
        const shuffled = [...routeStops].sort(() => Math.random() - 0.5);
        
        // Update sequence numbers
        shuffled.forEach((stop, index) => {
          stop.sequence = index + 1;
        });
        
        setOptimizedRoute(shuffled);
        toast({
          title: "Route Optimized",
          description: `Route optimized for ${assignments.length} deliveries`,
        });
      } else {
        toast({
          title: "Cannot Optimize Route",
          description: "No active deliveries found to optimize",
          variant: "destructive"
        });
      }
      
      setIsOptimizing(false);
    }, 1500);
  };
  
  // Move route stop up in sequence
  const moveStopUp = (index: number) => {
    if (index <= 0) return;
    
    const newRoute = [...optimizedRoute];
    const temp = newRoute[index - 1].sequence;
    newRoute[index - 1].sequence = newRoute[index].sequence;
    newRoute[index].sequence = temp;
    
    // Swap the items
    [newRoute[index - 1], newRoute[index]] = [newRoute[index], newRoute[index - 1]];
    
    setOptimizedRoute(newRoute);
  };
  
  // Move route stop down in sequence
  const moveStopDown = (index: number) => {
    if (index >= optimizedRoute.length - 1) return;
    
    const newRoute = [...optimizedRoute];
    const temp = newRoute[index + 1].sequence;
    newRoute[index + 1].sequence = newRoute[index].sequence;
    newRoute[index].sequence = temp;
    
    // Swap the items
    [newRoute[index + 1], newRoute[index]] = [newRoute[index], newRoute[index + 1]];
    
    setOptimizedRoute(newRoute);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Routes</h1>
        <p className="text-gray-600 mt-1">Plan and optimize your delivery routes</p>
      </div>
      
      <Tabs defaultValue="active" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active Deliveries</TabsTrigger>
          <TabsTrigger value="optimized">Optimized Route</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Active Deliveries</CardTitle>
                <Button 
                  onClick={optimizeRoute} 
                  disabled={isLoading || isOptimizing || !assignments || assignments.length === 0}
                >
                  {isOptimizing ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Route className="mr-2 h-4 w-4" />
                      Optimize Route
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading deliveries...</p>
                </div>
              ) : error || loadError ? (
                <div className="p-8 text-center text-red-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Error loading deliveries: {loadError || 'Failed to fetch data'}</p>
                  <Button 
                    variant="outline"
                    className="mt-4"
                    onClick={handleRetryLoad}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="p-8 text-center">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No active deliveries</h3>
                  <p className="text-gray-500 mb-4">
                    You don't have any active deliveries to plan a route for.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/delivery/available'}
                  >
                    View Available Orders
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment: DeliveryAssignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {formatAddress(assignment)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'in_transit' ? 
                            'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.status === 'in_transit' ? 'IN TRANSIT' : 'ASSIGNED'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimized">
          <Card>
            <CardHeader>
              <CardTitle>Optimized Route</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizedRoute.length === 0 ? (
                <div className="p-8 text-center">
                  <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No optimized route</h3>
                  <p className="text-gray-500 mb-4">
                    Click the "Optimize Route" button in the Active Deliveries tab to generate an optimized route.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizedRoute.map((stop, index) => (
                      <TableRow key={stop.id}>
                        <TableCell className="font-medium">
                          {stop.sequence}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {`${stop.address}, ${stop.city}, ${stop.state} ${stop.postal_code}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={index === 0}
                              onClick={() => moveStopUp(index)}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={index === optimizedRoute.length - 1}
                              onClick={() => moveStopDown(index)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
