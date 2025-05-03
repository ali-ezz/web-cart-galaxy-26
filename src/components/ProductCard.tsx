
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  
  const {
    id,
    name,
    price,
    discountedPrice,
    imageUrl,
    rating,
    reviews,
    category
  } = product;

  const discount = discountedPrice ? Math.round((1 - discountedPrice / price) * 100) : 0;

  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative pb-[100%] overflow-hidden">
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {discount}% OFF
          </div>
        )}
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Add to wishlist"
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
        <Link to={`/product/${id}`}>
          <img 
            src={`${imageUrl}?w=300&h=300&auto=format&fit=crop`} 
            alt={name}
            className="absolute w-full h-full object-cover object-center transition-transform group-hover:scale-105"
          />
        </Link>
      </div>
      
      <div className="p-4">
        <Link to={`/category/${category}`} className="text-xs text-gray-500 hover:underline mb-1 block">
          {category}
        </Link>
        
        <Link to={`/product/${id}`} className="block">
          <h3 className="font-medium text-gray-900 mb-1 hover:text-shop-purple transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center mr-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 text-sm font-medium">{rating}</span>
          </div>
          <span className="text-xs text-gray-500">({reviews} reviews)</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {discountedPrice ? (
              <>
                <span className="text-lg font-semibold">${discountedPrice.toFixed(2)}</span>
                <span className="ml-2 text-sm text-gray-500 line-through">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-semibold">${price.toFixed(2)}</span>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="ghost"
            className="p-2 h-auto"
            onClick={() => addToCart(id)}
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
