
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import {
  ShoppingCart,
  Heart,
  Star,
  Check,
  Truck,
  Package,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discounted_price: number | null;
  stock: number;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  reviews?: Review[];
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    try {
      // Create a cart item object from the product data
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        discountedPrice: product.discounted_price,
        imageUrl: product.image_url || '/placeholder.svg',
        category: product.category,
        stock: product.stock,
        quantity: 1,
      };
      
      // Add the cart item to the cart context
      addToCart(cartItem);
      
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your wishlist.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    setIsAddingToWishlist(true);
    
    try {
      // Check if the product is already in the wishlist
      const { data: existingItem, error: checkError } = await supabase
        .from('wishlists')
        .select('id')
        .match({ 
          product_id: product.id,
          user_id: user?.id
        })
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingItem) {
        // Remove from wishlist if already there
        const { error: removeError } = await supabase
          .from('wishlists')
          .delete()
          .eq('id', existingItem.id);
        
        if (removeError) throw removeError;
        
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        // Add to wishlist
        const { error: addError } = await supabase
          .from('wishlists')
          .insert({ 
            product_id: product.id,
            user_id: user?.id 
          });
        
        if (addError) throw addError;
        
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setIsAddingToWishlist(false);
    }
  };
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };
  
  const discountPercentage = product.discounted_price
    ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
    : 0;
  
  const inStock = product.stock > 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
        {product.discounted_price && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500">-{discountPercentage}%</Badge>
          </div>
        )}
        
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <Badge variant="outline" className="mb-2">
            {product.category}
          </Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center mt-2 space-x-1">
            {renderStars(product.rating)}
            <span className="ml-2 text-sm text-gray-600">
              ({product.reviews_count} {product.reviews_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex items-baseline space-x-2">
            {product.discounted_price ? (
              <>
                <p className="text-3xl font-bold text-shop-purple">
                  ${product.discounted_price.toFixed(2)}
                </p>
                <p className="text-lg text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-shop-purple">
                ${product.price.toFixed(2)}
              </p>
            )}
          </div>
          
          <div className="mt-2 flex items-center space-x-2">
            {inStock ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">In Stock</span>
                <span className="text-sm text-gray-600">({product.stock} available)</span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full bg-red-500" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            className="flex-1"
            onClick={handleAddToCart}
            disabled={!inStock || isAddingToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Add to Cart
          </Button>
          
          <Button
            variant="outline"
            onClick={handleAddToWishlist}
            disabled={isAddingToWishlist}
          >
            {isAddingToWishlist ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <p className="font-medium">Free Shipping</p>
              <p className="text-sm text-gray-600">For orders over $50</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Package className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <p className="font-medium">Easy Returns</p>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-4">
            <div className="prose prose-sm max-w-none">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description available</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            {review.user.avatar_url ? (
                              <img 
                                src={review.user.avatar_url} 
                                alt={review.user.name} 
                                className="h-10 w-10 rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {review.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{review.user.name}</p>
                            <div className="flex items-center mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-3">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No reviews yet</p>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Write a Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
