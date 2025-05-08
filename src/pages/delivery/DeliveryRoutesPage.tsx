
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  created_at: string;
  status: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  customer_name?: string;
  stopNumber?: number;
}

// Basic order type from database without processing
interface RawOrder {
  id: string;
  created_at: string;
  status: string;
  user_id: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  [key: string]: any; // Allow for other properties
}

// Customer profile type from database
interface CustomerProfile {
  first_name?: string;
  last_name?: string;
}

export default function DeliveryRoutesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: activeRoutes, isLoading, error } = useQuery({
    queryKey: ['deliveryRoutes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Get active deliveries for this driver
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('delivery_person_id', user.id)
          .eq('status', 'out_for_delivery')
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        // Cast to proper type and ensure it's an array
        const orders = (data || []) as RawOrder[];
        
        if (orders.length === 0) return [];
        
        // Process each order to add customer details
        const ordersWithDetails: Order[] = await Promise.all(
          orders.map(async (order, index) => {
            // Get customer name from profiles table
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', order.user_id)
              .single();
              
            // Create customer name
            const customerProfile = profileData as CustomerProfile | null;
            const customerName = customerProfile ? 
              `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() : 
              'Unknown Customer';
            
            // Return a properly typed Order object
            return {
              id: order.id,
              created_at: order.created_at,
              status: order.status,
              shipping_address: order.shipping_address,
              shipping_city: order.shipping_city,
              shipping_state: order.shipping_state,
              shipping_postal_code: order.shipping_postal_code,
              customer_name: customerName || 'Unknown Customer',
              stopNumber: index + 1
            };
          })
        );
        
        return ordersWithDetails;
      } catch (error) {
        console.error('Error fetching delivery routes:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const openMapsWithAllDestinations = () => {
    if (!activeRoutes || activeRoutes.length === 0) return;
    
    // Create a directions URL with multiple destinations
    const destinations = activeRoutes.map(order => {
      return encodeURIComponent(
        `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`
      );
    });
    
    // Open in Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinations[0]}&waypoints=${destinations.slice(1).join('|')}`, '_blank');
  };

  const openSingleLocation = (address: string, city: string, state: string, postalCode: string) => {
    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state} ${postalCode}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${fullAddress}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Delivery Routes</h1>
          <p className="text-gray-600 mt-1">Plan and navigate your delivery stops</p>
        </div>
        
        {activeRoutes && activeRoutes.length > 0 && (
          <Button 
            onClick={openMapsWithAllDestinations}
            className="mt-4 md:mt-0"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Open Full Route in Maps
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
          <span className="ml-2">Loading your routes...</span>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              There was a problem loading your delivery routes. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      ) : activeRoutes && activeRoutes.length > 0 ? (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Today's Route</CardTitle>
              <CardDescription>
                You have {activeRoutes.length} {activeRoutes.length === 1 ? 'stop' : 'stops'} on your current route
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 text-left">Stop</th>
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left hidden md:table-cell">Address</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRoutes.map((route) => (
                        <tr key={route.id} className="border-b last:border-0">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-shop-purple/10">
                              Stop {route.stopNumber}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{route.customer_name}</div>
                            <div className="text-gray-500 text-xs md:hidden">
                              {route.shipping_city}, {route.shipping_state}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div>{route.shipping_address}</div>
                            <div className="text-gray-500 text-xs">
                              {route.shipping_city}, {route.shipping_state} {route.shipping_postal_code}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSingleLocation(
                                route.shipping_address,
                                route.shipping_city,
                                route.shipping_state,
                                route.shipping_postal_code
                              )}
                            >
                              <MapPin className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Directions</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="hidden md:block">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Map View</CardTitle>
                <CardDescription>
                  Visual overview of your delivery route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg h-[400px] flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 font-medium">Interactive Map</p>
                    <p className="text-gray-500 text-sm mb-4">Click "Open Full Route in Maps" for navigation</p>
                    <Button onClick={openMapsWithAllDestinations}>
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageCheck className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-medium text-xl mb-1">No Active Routes</h3>
            <p className="text-gray-500 text-center mb-4">
              You don't have any active deliveries at the moment.
              Check the Available Orders page to pick up new deliveries.
            </p>
            <Button onClick={() => window.location.href = '/delivery/available'}>
              Find Available Orders
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
