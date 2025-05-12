import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  ChevronRight,
  BarChart3,
  LogOut
} from 'lucide-react';
import { DatabaseConnectionCheck } from '@/components/DatabaseConnectionCheck';

interface DeliveryStats {
  total_delivered: number;
  in_progress: number;
  recent_deliveries: any[];
}

export default function DeliveryDashboardPage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not delivery role
  useEffect(() => {
    if (userRole !== 'delivery') {
      navigate('/');
    }
  }, [userRole, navigate]);

  // Fetch delivery stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['deliveryStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total_delivered: 0, in_progress: 0, recent_deliveries: [] };
      
      try {
        console.log("Fetching delivery stats for:", user.id);
        const { data, error } = await supabase.functions.invoke('delivery_functions', {
          body: { action: 'get_delivery_stats' }
        });
        
        if (error) throw error;
        return data?.stats as DeliveryStats;
      } catch (err: any) {
        console.error("Error fetching delivery stats:", err);
        toast({
          title: "Error loading stats",
          description: err.message || "Could not load delivery statistics",
          variant: "destructive"
        });
        return { total_delivered: 0, in_progress: 0, recent_deliveries: [] };
      }
    },
    enabled: !!user?.id && userRole === 'delivery',
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const deliveryMenuItems = [
    {
      title: 'Available Orders',
      icon: <Package className="h-5 w-5" />,
      link: '/delivery/available',
      description: 'View and accept new delivery orders'
    },
    {
      title: 'My Assignments',
      icon: <Truck className="h-5 w-5" />,
      link: '/delivery/assignments',
      description: 'Manage your current delivery assignments'
    },
    {
      title: 'Delivery Routes',
      icon: <MapPin className="h-5 w-5" />,
      link: '/delivery/routes',
      description: 'Plan and optimize your delivery routes'
    },
    {
      title: 'Schedule',
      icon: <Clock className="h-5 w-5" />,
      link: '/delivery/schedule',
      description: 'View and manage your delivery schedule'
    },
    {
      title: 'Earnings',
      icon: <BarChart3 className="h-5 w-5" />,
      link: '/delivery/earnings',
      description: 'Track your delivery earnings'
    },
  ];

  if (!user || userRole !== 'delivery') {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your deliveries and track progress</p>
          </div>
          <Button
            variant="outline"
            className="border-shop-purple text-shop-purple hover:bg-shop-purple hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Database Connection Check */}
      <div className="mb-8">
        <DatabaseConnectionCheck />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Deliveries In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {isLoading ? '...' : stats?.in_progress || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">
                {isLoading ? '...' : stats?.total_delivered || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">
                {isLoading ? '...' : (stats?.in_progress || 0) + (stats?.total_delivered || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {deliveryMenuItems.map((item, index) => (
          <Card 
            key={index} 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(item.link)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-blue-50 text-blue-500">
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

      {/* Recent Deliveries */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Deliveries</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading recent deliveries...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <p>Could not load recent deliveries</p>
              </div>
            ) : !stats?.recent_deliveries || stats.recent_deliveries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No recent deliveries found</p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recent_deliveries.map((delivery, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium">Order #{delivery.order_id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(delivery.delivered_at).toLocaleDateString()} at {new Date(delivery.delivered_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/delivery/assignments')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
