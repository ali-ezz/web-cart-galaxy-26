
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Route,
  ArrowRight
} from 'lucide-react';

export default function DeliveryRoutesPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (userRole !== 'delivery') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'delivery') {
    return null;
  }

  const handleOptimizeRoutes = () => {
    toast({
      title: "Routes Optimized",
      description: "Your delivery routes have been optimized for efficiency",
    });
  };

  const deliveryRoutes = [
    {
      id: '1',
      name: 'Downtown Route',
      orders: 5,
      estimatedTime: '2 hours',
      distance: '12 miles'
    },
    {
      id: '2',
      name: 'Suburban North',
      orders: 3,
      estimatedTime: '1.5 hours',
      distance: '15 miles'
    },
    {
      id: '3',
      name: 'East Side Deliveries',
      orders: 4,
      estimatedTime: '2.5 hours',
      distance: '18 miles'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Routes</h1>
        <p className="text-gray-600 mt-1">Plan and manage your delivery routes</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-r from-shop-purple-light to-indigo-50">
          <h3 className="text-lg font-medium mb-2">Today's Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Routes:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Distance:</span>
              <span className="font-medium">45 miles</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-medium">6 hours</span>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleOptimizeRoutes} className="w-full">
              <Route className="mr-2 h-4 w-4" />
              Optimize Routes
            </Button>
          </div>
        </Card>
        
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-100 z-0 flex items-center justify-center text-gray-300">
            <MapPin className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-medium mb-4">Route Map</h3>
            <p className="text-gray-600 mb-4">Interactive map view will be displayed here</p>
            <Button variant="outline" className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              Open Map
            </Button>
          </div>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Your Routes</h2>
      
      <div className="space-y-4">
        {deliveryRoutes.map(route => (
          <Card key={route.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-lg">{route.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <span>{route.orders} orders</span>
                  <span className="mx-2">•</span>
                  <span>{route.distance}</span>
                  <span className="mx-2">•</span>
                  <span>{route.estimatedTime}</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button variant="outline" className="flex-1 md:flex-none">
                  View Details
                </Button>
                <Button className="flex-1 md:flex-none">
                  Start Route
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
