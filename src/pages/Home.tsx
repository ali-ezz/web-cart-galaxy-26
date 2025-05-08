
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserRoleDebug } from '@/components/UserRoleDebug';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, userRole, loading, user } = useAuth();

  // Sample product categories with images
  const categories = [
    { 
      name: "Electronics", 
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
      gradient: "from-blue-50 to-blue-100" 
    },
    { 
      name: "Fashion", 
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      gradient: "from-pink-50 to-pink-100" 
    },
    { 
      name: "Home", 
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
      gradient: "from-green-50 to-green-100" 
    },
    { 
      name: "Beauty", 
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      gradient: "from-purple-50 to-purple-100"
    },
  ];

  // If still loading authentication state, show a loading spinner
  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-shop-purple" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but not a customer, show a relevant message and redirect options
  if (isAuthenticated && userRole && userRole !== 'customer') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.name || userRole}!</h2>
        <p className="mb-4">Since you're logged in as a {userRole}, you'll be redirected to your dashboard.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Button asChild variant="outline">
            <Link to={`/${userRole}`}>Go to {userRole} dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/welcome">Go to welcome page</Link>
          </Button>
        </div>
      </div>
    );
  }

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
        
        {isAuthenticated && !loading && userRole === 'customer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Welcome back, {user?.name || 'Customer'}!
                </h2>
                <p className="mt-2 text-gray-700">
                  Browse our latest products and make purchases. Explore the categories below!
                </p>
                <div className="mt-4">
                  <Button asChild>
                    <Link to="/account">Go to My Account</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <UserRoleDebug />
            </div>
          </div>
        )}

        {/* Featured categories section with images */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link key={index} to={`/category/${category.name}`} className="block group">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <CardContent className="p-3">
                        <h3 className="text-lg font-medium text-white">{category.name}</h3>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
