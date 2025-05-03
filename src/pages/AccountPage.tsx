
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Package, 
  Heart, 
  Settings, 
  LogOut,
  ShoppingBag,
  CreditCard,
  MapPin
} from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const accountMenuItems = [
    {
      title: 'Personal Information',
      icon: <User className="h-5 w-5" />,
      link: '/account/profile',
      description: 'Update your personal details and password'
    },
    {
      title: 'My Orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      link: '/account/orders',
      description: 'Track, return, or buy products again'
    },
    {
      title: 'Addresses',
      icon: <MapPin className="h-5 w-5" />,
      link: '/account/addresses',
      description: 'Manage your shipping addresses'
    },
    {
      title: 'Payment Methods',
      icon: <CreditCard className="h-5 w-5" />,
      link: '/account/payment',
      description: 'Manage your payment methods'
    },
    {
      title: 'Wishlist',
      icon: <Heart className="h-5 w-5" />,
      link: '/wishlist',
      description: 'Products you have saved for later'
    },
    {
      title: 'Account Settings',
      icon: <Settings className="h-5 w-5" />,
      link: '/account/settings',
      description: 'Notifications and account settings'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium">My Account</li>
        </ol>
      </nav>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="bg-shop-purple-light p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {user.name}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 md:p-8">
          {accountMenuItems.map((item, index) => (
            <Link
              to={item.link}
              key={index}
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-shop-purple hover:shadow-sm transition-all"
            >
              <div className="p-2 rounded-md bg-shop-purple-light text-shop-purple mr-4">
                {item.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders preview */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/account/orders" className="text-sm text-shop-purple hover:underline">
              View All
            </Link>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600">You haven't placed any orders yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
