
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserRoleDebug } from '@/components/UserRoleDebug';

const Home = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome to ShopGalaxy
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Your one-stop marketplace for all your shopping needs
          </p>
        </div>

        {!isAuthenticated && !loading && (
          <div className="bg-gradient-to-r from-shop-purple-light to-purple-100 p-6 md:p-8 rounded-xl mb-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Get Started Today</h2>
            <p className="mt-2 text-gray-700">Sign up to start shopping or selling on our platform</p>
            <div className="mt-4 space-x-4">
              <Button asChild>
                <Link to="/register">Create Account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
        )}
        
        {isAuthenticated && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Welcome back, {userRole === 'admin' ? 'Admin' : 
                              userRole === 'seller' ? 'Seller' : 
                              userRole === 'delivery' ? 'Delivery Partner' : 
                              'Customer'}!
                </h2>
                <p className="mt-2 text-gray-700">
                  {userRole === 'admin' && 'Manage your store and users from your admin dashboard.'}
                  {userRole === 'seller' && 'Manage your products and orders from your seller dashboard.'}
                  {userRole === 'delivery' && 'View and manage your delivery assignments.'}
                  {(userRole === 'customer' || !userRole) && 'Browse products and make purchases.'}
                </p>
                <div className="mt-4">
                  <Button asChild>
                    {userRole === 'admin' && <Link to="/admin">Go to Admin Dashboard</Link>}
                    {userRole === 'seller' && <Link to="/seller">Go to Seller Dashboard</Link>}
                    {userRole === 'delivery' && <Link to="/delivery">Go to Delivery Dashboard</Link>}
                    {(userRole === 'customer' || !userRole) && <Link to="/account">Go to My Account</Link>}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <UserRoleDebug />
            </div>
          </div>
        )}
        
        {loading && (
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-shop-purple border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Featured categories section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/category/Electronics" className="block group">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-lg font-medium text-gray-800">Electronics</span>
              </div>
            </Link>
            <Link to="/category/Fashion" className="block group">
              <div className="aspect-square bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-lg font-medium text-gray-800">Fashion</span>
              </div>
            </Link>
            <Link to="/category/Home" className="block group">
              <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-lg font-medium text-gray-800">Home</span>
              </div>
            </Link>
            <Link to="/category/Beauty" className="block group">
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-lg font-medium text-gray-800">Beauty</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
