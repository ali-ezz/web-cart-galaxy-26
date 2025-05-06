
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  CreditCard,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="bg-white pt-12 pb-6 mt-12 border-t">
      <div className="container mx-auto px-4">
        {/* Newsletter */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Subscribe to our newsletter</h3>
            <p className="text-gray-600 mt-1">Get exclusive offers and latest product updates</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email address"
              className="flex-1"
            />
            <Button className="bg-shop-purple hover:bg-shop-purple-dark">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="bg-gray-50 p-3 rounded-full mr-4">
              <Truck className="h-5 w-5 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Fast Shipping</h4>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gray-50 p-3 rounded-full mr-4">
              <CreditCard className="h-5 w-5 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Secure Payments</h4>
              <p className="text-sm text-gray-600">Protected checkout</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gray-50 p-3 rounded-full mr-4">
              <ShieldCheck className="h-5 w-5 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Satisfaction Guarantee</h4>
              <p className="text-sm text-gray-600">30-day returns</p>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-shop-purple">UniCart</span>
              </Link>
              <p className="text-sm text-gray-500 mt-1">Everything you need, all in one place</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Instagram size={18} />
              </a>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} UniCart. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link to="/privacy" className="text-xs text-gray-500 hover:text-shop-purple">Privacy</Link>
              <Link to="/terms" className="text-xs text-gray-500 hover:text-shop-purple">Terms</Link>
              <Link to="/contact" className="text-xs text-gray-500 hover:text-shop-purple">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
