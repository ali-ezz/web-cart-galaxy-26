
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  PackageCheck, 
  MapPin,
  Clock,
  Calendar,
  Settings, 
  DollarSign
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not delivery
    if (userRole !== 'delivery') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'delivery') {
    return null; // Don't render anything while redirecting
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your deliveries and schedule</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-medium mb-1">Available for Delivery</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500 mt-2">No orders available</p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="text-lg font-medium mb-1">Today's Deliveries</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500 mt-2">No scheduled deliveries today</p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50">
          <h3 className="text-lg font-medium mb-1">Total Completed</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500 mt-2">Start delivering to build your record</p>
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
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Current Status</h3>
                <p className="text-green-500 font-medium">Off-duty</p>
              </div>
            </div>
            <Button>
              Go Online
            </Button>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">Update your availability to start receiving delivery assignments.</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/delivery/schedule')}>
              <Calendar className="mr-2 h-4 w-4" />
              Update Schedule
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
