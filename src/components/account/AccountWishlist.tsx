import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Loader2, Heart, AlertCircle, Package, ShoppingCart, Trash2 } from 'lucide-react';

interface WishlistItem {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    price: number;
    discounted_price: number | null;
    image_url: string | null;
    stock: number;
  };
}

export default function AccountWishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  const { 
    data: wishlistItems, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Get wishlist items for the user
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('id, product_id')
          .eq('user_id', user.id);
          
        if (wishlistError) throw wishlistError;
        
        if (!wishlistData || wishlistData.length === 0) return [];
        
        // Get product details for each wishlist item
        const itemsWithProductDetails = await Promise.all(
          wishlistData.map(async (item) => {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('id, name, price, discounted_price, image_url, stock')
              .eq('id', item.product_id)
              .single();
              
            // If product not found (might have been deleted), return item as is
            if (productError || !product) {
              return {
                ...item,
                product: null
              };
            }
            
            return {
              ...item,
              product
            };
          })
        );
        
        return itemsWithProductDetails;
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
  
  const handleRemoveFromWishlist = async (itemId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      toast({
        title: "Item Removed",
        description: "The item has been removed from your wishlist.",
      });
      
      // Refresh the wishlist
      refetch();
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddToCart = (product: any) => {
    if (!product) return;
    
    // Fixed: Pass product ID as string instead of an object
    addToCart(product.id);
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  if (isLoading) {
    return (
      <CardContent className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-shop-purple" />
          <p>Loading your wishlist...</p>
        </div>
      </CardContent>
    );
  }
  
  if (error) {
    return (
      <CardContent className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-medium text-red-800 mb-1">Error Loading Wishlist</h3>
          <p className="text-red-600 text-sm">
            There was a problem loading your wishlist. Please try again later.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      </CardContent>
    );
  }
  
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <CardContent className="py-6">
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">Your Wishlist is Empty</h3>
          <p className="text-gray-500 mb-4">
            Save items you're interested in for later.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Continue Shopping
          </Button>
        </div>
      </CardContent>
    );
  }
  
  return (
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 gap-6">
        {wishlistItems?.map((item) => (
          <div 
            key={item.id} 
            className="border rounded-md overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="h-40 sm:h-auto sm:w-40 flex-shrink-0 overflow-hidden">
              {item.product?.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 flex flex-col">
              {item.product ? (
                <>
                  <div className="mb-2">
                    <h3 className="font-medium text-lg">{item.product.name}</h3>
                    <div className="mt-1">
                      {item.product.discounted_price ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">${item.product.discounted_price.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 line-through">${item.product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-lg">${item.product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1"
                      disabled={item.product.stock <= 0}
                      onClick={() => handleAddToCart(item.product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>{item.product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-2">This product is no longer available</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRemoveFromWishlist(item.id)}
                  >
                    Remove from Wishlist
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
