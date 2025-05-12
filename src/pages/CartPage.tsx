
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CartPage() {
  const { 
    cartItems, 
    cartCount, 
    removeFromCart,
    updateQuantity,
    clearCart 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Calculate cart total from cartItems
  const cartTotal = cartItems.reduce((total, item) => {
    const itemPrice = item.discounted_price || item.price;
    return total + (itemPrice * item.quantity);
  }, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login or register to proceed to checkout.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // In a real implementation, this would redirect to a checkout page
    toast({
      title: "Checkout initiated",
      description: "Processing your order...",
    });
    // Clear cart after simulated checkout
    clearCart();
    navigate('/checkout-success');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium">Shopping Cart</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>

      {cartCount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row">
                    {/* Product image */}
                    <div className="w-full sm:w-32 h-32 flex-shrink-0 mb-4 sm:mb-0">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>

                    {/* Product details */}
                    <div className="flex-1 sm:ml-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Link to={`/product/${item.product_id}`} className="hover:text-shop-purple">
                              {item.name}
                            </Link>
                          </h3>
                        </div>
                        <div className="mt-2 sm:mt-0 font-medium text-gray-900">
                          ${((item.discounted_price || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="h-8 w-12 flex items-center justify-center border-y border-gray-300">
                            {item.quantity}
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Remove button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart actions */}
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link to="/">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
                
                <Button
                  variant="ghost"
                  className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={clearCart}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {cartTotal >= 50 ? 'Free' : '$4.99'}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold">
                    ${(cartTotal + (cartTotal >= 50 ? 0 : 4.99)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <Button
                className="w-full mt-6 bg-shop-purple hover:bg-shop-purple-dark"
                onClick={handleCheckout}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Proceed to Checkout
              </Button>
              
              <div className="mt-6 text-sm text-gray-500">
                <p className="mb-2">
                  Free shipping on orders over $50.
                </p>
                <p>
                  Need help? <Link to="/contact" className="text-shop-purple hover:underline">Contact us</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet. 
            Start shopping to fill it with great products!
          </p>
          <Button asChild>
            <Link to="/">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Start Shopping
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
