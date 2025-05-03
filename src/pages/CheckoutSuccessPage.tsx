
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, Home, Truck } from 'lucide-react';

export default function CheckoutSuccessPage() {
  // Generate a random order number
  const orderNumber = `OR${Math.floor(100000 + Math.random() * 900000)}`;
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="grid grid-cols-2 gap-y-3">
              <div className="text-gray-600">Order Number:</div>
              <div className="text-gray-900 font-medium">{orderNumber}</div>
              
              <div className="text-gray-600">Order Date:</div>
              <div className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</div>
              
              <div className="text-gray-600">Payment Method:</div>
              <div className="text-gray-900 font-medium">Credit Card</div>
              
              <div className="text-gray-600">Shipping:</div>
              <div className="text-gray-900 font-medium">Free Shipping</div>
            </div>
          </div>
          
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Order Placed</p>
              </div>
              
              <div className="w-10 h-0.5 bg-gray-300"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mb-2">
                  <Truck className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-xs text-gray-600">Processing</p>
              </div>
              
              <div className="w-10 h-0.5 bg-gray-300"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mb-2">
                  <Home className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-xs text-gray-600">Delivered</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-700">
              We've sent a confirmation email to your registered email address with the order details.
            </p>
            
            <p className="text-gray-700">
              You can track your order status in the "My Orders" section of your account.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 border-shop-purple text-shop-purple hover:bg-shop-purple hover:text-white"
            asChild
          >
            <Link to="/account/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </Button>
          
          <Button
            className="flex-1 bg-shop-purple hover:bg-shop-purple-dark"
            asChild
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
