import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  PackageCheck, 
  MapPin,
  Clock,
  Calendar,
  Settings, 
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DeliverySummary {
  availableOrders: number;
  assignedOrders: number;
  completedOrders: number;
  totalEarnings: number;
  status: 'online' | 'offline';
}

// Types for responses from the edge functions
interface AvailableOrdersResponse {
  orders: any[];
}

interface DeliveryStatsResponse {
  assignedCount: number;
  completedCount: number;
  totalEarnings: number;
}

// Type for profile response
interface ProfileResponse {
  question_responses?: {
    deliveryStatus?: string;
    [key: string]: any;
  } | null;
}

export default function DeliveryDashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  
  // Fetch delivery dashboard summary
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['deliverySummary', user?.id],
    queryFn: async (): Promise<DeliverySummary> => {
      if (!user?.id) {
        return { 
          availableOrders: 0, 
          assignedOrders: 0, 
          completedOrders: 0, 
          totalEarnings: 0,
          status: 'offline'
        };
      }
      
      // Get available orders count
      const { data: availableOrdersData, error: availableError } = await supabase.functions.invoke<AvailableOrdersResponse>('delivery_functions', {
        body: {
          action: 'get_available_orders'
        }
      });
      
      if (availableError) throw availableError;
      
      const availableOrders = availableOrdersData?.orders?.length || 0;
      
      // Get delivery stats
      const { data: deliveryStats, error: deliveryError } = await supabase.functions.invoke<DeliveryStatsResponse>('delivery_functions', {
        body: {
          action: 'get_delivery_stats',
          delivery_id: user.id
        }
      });
      
      if (deliveryError) throw deliveryError;
      
      // Get current status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('question_responses')
        .eq('id', user.id)
        .single();
      
      const profileData = profile as ProfileResponse;
      let status: 'online' | 'offline' = 'offline';
      
      if (!profileError && profileData?.question_responses) {
        status = profileData.question_responses.deliveryStatus === 'online' ? 'online' : 'offline';
      }
      
      return {
        availableOrders,
        assignedOrders: deliveryStats?.assignedCount || 0,
        completedOrders: deliveryStats?.completedCount || 0,
        totalEarnings: deliveryStats?.totalEarnings || 0,
        status
      };
    },
    enabled: !!user?.id && userRole === 'delivery',
  });
  
  // Effect to update state from query data
  useEffect(() => {
    if (summary) {
      setIsOnline(summary.status === 'online');
    }
  }, [summary]);
  
  // Mutation for changing online status
  const statusMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          question_responses: { deliveryStatus: newStatus ? 'online' : 'offline' }
        })
        .eq('id', user.id);
        
      if (error) throw error;
      return { status: newStatus ? 'online' : 'offline' };
    },
    onSuccess: (data) => {
      setIsOnline(data.status === 'online');
      queryClient.invalidateQueries({ queryKey: ['deliverySummary'] });
      toast({
        title: `Status Updated`,
        description: `You are now ${data.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    // Redirect if not delivery
    if (userRole !== 'delivery') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'delivery') {
    return null; // Don't render anything while redirecting
  }

  const handleGoOnline = () => {
    statusMutation.mutate(!isOnline);
  };

  const deliveryMenuItems = [
    {
      title: 'Available Orders',
      icon: <Package className="h-5 w-5" />,
      link: '/delivery/available',
      description: 'View orders available for delivery'
    },
    {
      title: 'My Assignments',
      icon: <PackageCheck className="h-5 w-5" />,
      link: '/delivery/assignments',
      description: 'View your current delivery assignments'
    },
    {
      title: 'Delivery Routes',
      icon: <MapPin className="h-5 w-5" />,
      link: '/delivery/routes',
      description: 'Plan and manage your delivery routes'
    },
    {
      title: 'Schedule',
      icon: <Calendar className="h-5 w-5" />,
      link: '/delivery/schedule',
      description: 'Manage your availability and schedule'
    },
    {
      title: 'Earnings',
      icon: <DollarSign className="h-5 w-5" />,
      link: '/delivery/earnings',
      description: 'View your earnings and payment history'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      link: '/delivery/settings',
      description: 'Configure your delivery account'
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your deliveries and schedule</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-medium mb-1">Available for Delivery</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-lg font-medium mb-1">Current Assignments</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50">
            <h3 className="text-lg font-medium mb-1">Total Completed</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveryMenuItems.map((item, index) => (
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
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Current Status</h3>
                  <p className={isOnline ? 'text-green-500 font-medium' : 'text-gray-500 font-medium'}>
                    {isOnline ? 'Online - Ready for Deliveries' : 'Off-duty'}
                  </p>
                </div>
              </div>
              <Button 
                variant={isOnline ? "outline" : "default"}
                className={isOnline ? "border-red-500 text-red-500 hover:bg-red-50" : ""}
                onClick={handleGoOnline}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </div>
                ) : isOnline ? (
                  "Go Offline"
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Go Online
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                {isOnline 
                  ? "You're online and ready to accept delivery requests. View available orders or check your current assignments."
                  : "Update your availability to start receiving delivery assignments."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/delivery/schedule')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Schedule
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate('/delivery/available')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  View Available Orders
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your deliveries and schedule</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-medium mb-1">Available for Delivery</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-lg font-medium mb-1">Current Assignments</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50">
            <h3 className="text-lg font-medium mb-1">Total Completed</h3>
            <p className="text-3xl font-bold">...</p>
            <p className="text-sm text-gray-500 mt-2">
              ...
            </p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveryMenuItems.map((item, index) => (
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
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Current Status</h3>
                  <p className={isOnline ? 'text-green-500 font-medium' : 'text-gray-500 font-medium'}>
                    {isOnline ? 'Online - Ready for Deliveries' : 'Off-duty'}
                  </p>
                </div>
              </div>
              <Button 
                variant={isOnline ? "outline" : "default"}
                className={isOnline ? "border-red-500 text-red-500 hover:bg-red-50" : ""}
                onClick={handleGoOnline}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </div>
                ) : isOnline ? (
                  "Go Offline"
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Go Online
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                {isOnline 
                  ? "You're online and ready to accept delivery requests. View available orders or check your current assignments."
                  : "Update your availability to start receiving delivery assignments."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/delivery/schedule')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Schedule
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate('/delivery/available')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  View Available Orders
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your deliveries and schedule</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-medium mb-1">Available for Delivery</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : summary?.availableOrders}</p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.availableOrders ? 
              `${summary.availableOrders} order${summary.availableOrders !== 1 ? 's' : ''} waiting` : 
              'No orders available'}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="text-lg font-medium mb-1">Current Assignments</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : summary?.assignedOrders}</p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.assignedOrders ? 
              `${summary.assignedOrders} delivery in progress` : 
              'No deliveries in progress'}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50">
          <h3 className="text-lg font-medium mb-1">Total Completed</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : summary?.completedOrders}</p>
          <p className="text-sm text-gray-500 mt-2">
            {summary?.completedOrders ? 
              `${summary.completedOrders} successful ${summary.completedOrders !== 1 ? 'deliveries' : 'delivery'}` : 
              'Start delivering to build your record'}
          </p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliveryMenuItems.map((item, index) => (
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
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-500'}`}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Current Status</h3>
                <p className={isOnline ? 'text-green-500 font-medium' : 'text-gray-500 font-medium'}>
                  {isOnline ? 'Online - Ready for Deliveries' : 'Off-duty'}
                </p>
              </div>
            </div>
            <Button 
              variant={isOnline ? "outline" : "default"}
              className={isOnline ? "border-red-500 text-red-500 hover:bg-red-50" : ""}
              onClick={handleGoOnline}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </div>
              ) : isOnline ? (
                "Go Offline"
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Go Online
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">
              {isOnline 
                ? "You're online and ready to accept delivery requests. View available orders or check your current assignments."
                : "Update your availability to start receiving delivery assignments."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/delivery/schedule')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Update Schedule
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate('/delivery/available')}
              >
                <Package className="mr-2 h-4 w-4" />
                View Available Orders
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
