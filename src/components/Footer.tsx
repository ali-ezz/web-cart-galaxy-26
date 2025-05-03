
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="bg-gray-100 pt-12 pb-6 mt-12">
      <div className="container mx-auto px-4">
        {/* Newsletter */}
        <div className="bg-shop-purple-light rounded-lg p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold text-shop-purple">Subscribe to our newsletter</h3>
              <p className="text-gray-600">Get the latest updates, deals and exclusive offers.</p>
            </div>
            <div className="w-full md:w-auto flex-1 md:max-w-md flex gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-white"
              />
              <Button className="bg-shop-purple hover:bg-shop-purple-dark">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full mr-4">
              <Truck className="h-6 w-6 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Free Shipping</h4>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Secure Payments</h4>
              <p className="text-sm text-gray-600">Protected & safe checkout</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full mr-4">
              <ShieldCheck className="h-6 w-6 text-shop-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Money-Back Guarantee</h4>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-t border-gray-200">
          <div>
            <h4 className="font-semibold text-lg mb-4">ShopGalaxy</h4>
            <p className="text-gray-600 mb-4">
              Your one-stop destination for all your shopping needs, offering quality products at competitive prices.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-shop-purple">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/category/Electronics" className="text-gray-600 hover:text-shop-purple">Electronics</Link></li>
              <li><Link to="/category/Clothing" className="text-gray-600 hover:text-shop-purple">Clothing</Link></li>
              <li><Link to="/category/Kitchen" className="text-gray-600 hover:text-shop-purple">Kitchen</Link></li>
              <li><Link to="/category/Accessories" className="text-gray-600 hover:text-shop-purple">Accessories</Link></li>
              <li><Link to="/category/Food & Drinks" className="text-gray-600 hover:text-shop-purple">Food & Drinks</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-600 hover:text-shop-purple">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-shop-purple">FAQs</Link></li>
              <li><Link to="/shipping" className="text-gray-600 hover:text-shop-purple">Shipping & Delivery</Link></li>
              <li><Link to="/returns" className="text-gray-600 hover:text-shop-purple">Returns & Refunds</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-shop-purple">Terms & Conditions</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">My Account</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-600 hover:text-shop-purple">Sign In</Link></li>
              <li><Link to="/register" className="text-gray-600 hover:text-shop-purple">Create Account</Link></li>
              <li><Link to="/orders" className="text-gray-600 hover:text-shop-purple">Order History</Link></li>
              <li><Link to="/wishlist" className="text-gray-600 hover:text-shop-purple">Wishlist</Link></li>
              <li><Link to="/account" className="text-gray-600 hover:text-shop-purple">Account Settings</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} ShopGalaxy. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link to="/privacy" className="text-gray-600 hover:text-shop-purple text-sm">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-600 hover:text-shop-purple text-sm">Terms of Service</Link>
              <Link to="/cookies" className="text-gray-600 hover:text-shop-purple text-sm">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
