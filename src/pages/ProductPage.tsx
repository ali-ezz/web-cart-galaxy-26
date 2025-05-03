
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProductsByCategory } from '@/lib/data';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus, 
  Check,
  Truck
} from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // Get product details
  const product = id ? getProductById(id) : undefined;
  
  // If product not found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }
  
  // Get related products
  const relatedProducts = getProductsByCategory(product.category)
    .filter(p => p.id !== product.id)
    .slice(0, 4);
  
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  };
  
  const discount = product.discountedPrice 
    ? Math.round((1 - product.discountedPrice / product.price) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li><Link to={`/category/${product.category}`} className="hover:text-shop-purple">{product.category}</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>
      
      {/* Product details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product image */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <img
            src={`${product.imageUrl}?w=600&h=600&auto=format&fit=crop`}
            alt={product.name}
            className="w-full h-auto object-contain"
          />
        </div>
        
        {/* Product info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>
          
          {/* Price */}
          <div className="mb-6">
            {product.discountedPrice ? (
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">${product.discountedPrice.toFixed(2)}</span>
                <span className="ml-3 text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
                <span className="ml-3 bg-red-100 text-red-600 text-sm font-medium px-2 py-0.5 rounded-md">
                  {discount}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-gray-600 mb-8">{product.description}</p>
          
          {/* Availability */}
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <span className="mr-2 text-gray-600">Availability:</span>
              {product.stock > 0 ? (
                <span className="flex items-center text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          </div>
          
          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-gray-600 mb-2">Quantity:</label>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="h-10 w-16 flex items-center justify-center border-y border-gray-300">
                {quantity}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button 
              className="flex-1 bg-shop-purple hover:bg-shop-purple-dark py-6"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            
            <Button variant="outline" className="py-6">
              <Heart className="mr-2 h-5 w-5" />
              Add to Wishlist
            </Button>
          </div>
          
          {/* Shipping info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-start">
              <Truck className="w-5 h-5 text-gray-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Free shipping</h4>
                <p className="text-sm text-gray-600">
                  For orders over $50. Estimated delivery: 3-5 business days.
                </p>
              </div>
            </div>
          </div>
          
          {/* Share */}
          <div className="flex items-center text-gray-600">
            <Share2 className="h-4 w-4 mr-2" />
            <span className="mr-4">Share:</span>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-shop-purple">Facebook</a>
              <a href="#" className="hover:text-shop-purple">Twitter</a>
              <a href="#" className="hover:text-shop-purple">Pinterest</a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
