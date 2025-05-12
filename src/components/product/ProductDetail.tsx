
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus, Heart, ShoppingCart, Star, CheckCircle, AlertCircle } from 'lucide-react';

// Define the type for the product prop
interface ProductDetailProps {
  product: {
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
    reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      created_at: string;
      user: {
        name: string;
        avatar_url: string | null;
      };
    }>;
  };
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleIncreaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast({
        title: "Maximum quantity reached",
        description: `Sorry, only ${product.stock} items available in stock.`,
        variant: "destructive",
      });
    }
  };
  
  const handleAddToCart = () => {
    addToCart(product.id);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };
  
  const handleAddToWishlist = () => {
    toast({
      title: "Added to wishlist",
      description: `${product.name} has been added to your wishlist`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Image */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <img 
          src={product.image_url || '/placeholder.svg'} 
          alt={product.name}
          className="w-full h-auto object-contain aspect-square"
        />
      </div>
      
      {/* Product Info */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
        
        <div className="flex items-center mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={`w-4 h-4 ${star <= product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {product.rating.toFixed(1)} ({product.reviews_count} reviews)
          </span>
        </div>
        
        <div className="mt-4">
          {product.discounted_price ? (
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">${product.discounted_price.toFixed(2)}</span>
              <span className="ml-2 text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {Math.round((1 - product.discounted_price / product.price) * 100)}% OFF
              </span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
          )}
        </div>
        
        <div className="mt-4">
          <div className="flex items-center">
            {product.stock > 0 ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Out of Stock
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="mt-2 text-gray-600">{product.description}</p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          {product.stock > 0 && (
            <div className="flex items-center mb-4">
              <span className="mr-4 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button 
                  onClick={handleDecreaseQuantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 border-l border-r border-gray-300">{quantity}</span>
                <button 
                  onClick={handleIncreaseQuantity}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex items-center justify-center"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAddToWishlist}
              className="flex items-center justify-center"
              size="lg"
            >
              <Heart className="w-4 h-4 mr-2" />
              Add to Wishlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
