import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/lib/data';
import { useCart } from '@/context/CartContext';

interface WishlistItem {
  id: string;
  product: Product;
}

export default function WishlistPage() {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlistItems();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedItems: WishlistItem[] = data.map((item: any) => ({
          id: item.id,
          product: item.products,
        }));
        setWishlistItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wishlist items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) {
        throw error;
      }

      setWishlistItems(prevItems => prevItems.filter(item => item.id !== wishlistId));
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
    }
  };

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

      {loading ? (
        <div className="text-center py-16">
          <p>Loading wishlist items...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        // Empty wishlist state
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
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard product={item.product} />
                <div className="absolute top-2 right-2 z-10 flex space-x-2">
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8 rounded-full bg-white text-red-500 border border-gray-200 hover:bg-red-50"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Button 
                    onClick={() => addToCart(item.product.id)} 
                    className="w-full bg-shop-purple hover:bg-shop-purple-dark"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
