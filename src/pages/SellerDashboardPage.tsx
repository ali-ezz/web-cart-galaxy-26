
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  DollarSign, 
  BarChart3,
  Settings,
  Plus,
  ShoppingBag,
  Star
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if not seller
    if (userRole !== 'seller') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'seller') {
    return null; // Don't render anything while redirecting
  }

  const sellerMenuItems = [
    {
      title: 'My Products',
      icon: <Package className="h-5 w-5" />,
      link: '/seller/products',
      description: 'Manage your product listings'
    },
    {
      title: 'Add New Product',
      icon: <Plus className="h-5 w-5" />,
      link: '/seller/products/new',
      description: 'Create a new product listing'
    },
    {
      title: 'Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      link: '/seller/orders',
      description: 'View and manage customer orders'
    },
    {
      title: 'Sales',
      icon: <DollarSign className="h-5 w-5" />,
      link: '/seller/sales',
      description: 'View your earnings and payouts'
    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      link: '/seller/analytics',
      description: 'Track product performance and customer trends'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      link: '/seller/settings',
      description: 'Configure your seller account'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your products and sales</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-lg font-medium mb-1">Total Sales</h3>
          <p className="text-3xl font-bold">$0.00</p>
          <p className="text-sm text-gray-500 mt-2">No sales yet</p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-green-50 to-teal-50">
          <h3 className="text-lg font-medium mb-1">Active Products</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500 mt-2">Add products to start selling</p>
        </Card>
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50">
          <h3 className="text-lg font-medium mb-1">Pending Orders</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-gray-500 mt-2">No orders yet</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellerMenuItems.map((item, index) => (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tips for Sellers</h2>
          <Button variant="link">View All</Button>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Take high-quality photos of your products from multiple angles</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Write detailed descriptions highlighting key features</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Price competitively by researching similar products</p>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-amber-400" />
              <p className="text-gray-700">Respond quickly to customer inquiries</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
