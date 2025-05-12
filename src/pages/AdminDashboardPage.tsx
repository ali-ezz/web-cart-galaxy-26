
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  Settings, 
  ShoppingBag, 
  BarChart3,
  UserPlus,
  FileCheck,
  LogOut
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not admin
    if (userRole !== 'admin') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'admin') {
    return null; // Don't render anything while redirecting
  }
  
  const adminMenuItems = [
    {
      title: 'User Management',
      icon: <Users className="h-5 w-5" />,
      link: '/admin/users',
      description: 'Manage customer and seller accounts'
    },
    {
      title: 'Product Management',
      icon: <Package className="h-5 w-5" />,
      link: '/admin/products',
      description: 'Add, edit, and remove products'
    },
    {
      title: 'Order Management',
      icon: <ShoppingBag className="h-5 w-5" />,
      link: '/admin/orders',
      description: 'View and manage customer orders'
    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      link: '/admin/analytics',
      description: 'View sales reports and customer analytics'
    },
    {
      title: 'Seller Applications',
      icon: <UserPlus className="h-5 w-5" />,
      link: '/admin/applications',
      description: 'Review seller and delivery applications'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      link: '/admin/settings',
      description: 'Configure store settings and policies'
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your store and users</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminMenuItems.map((item, index) => (
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
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center space-x-3">
                <FileCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">New seller application received</p>
                  <p className="text-sm text-gray-500">John Smith applied to become a seller</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">New order placed</p>
                  <p className="text-sm text-gray-500">Order #12345 - $129.99</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">New user registered</p>
                  <p className="text-sm text-gray-500">Jane Doe created a new account</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
          
          <div className="mt-6">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
