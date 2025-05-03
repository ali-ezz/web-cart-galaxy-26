
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-6">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your Wishlist</h1>
          <p className="text-gray-600 mb-8">
            Create an account or sign in to save products and access your wishlist from any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium">My Wishlist</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

      {/* Empty wishlist state */}
      <div className="text-center py-16 bg-white rounded-lg shadow-sm">
        <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gray-100">
          <Heart className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Browse our shop and add products to your wishlist.
          Items in your wishlist will be saved for future reference.
        </p>
        <Button asChild>
          <Link to="/">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Start Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
