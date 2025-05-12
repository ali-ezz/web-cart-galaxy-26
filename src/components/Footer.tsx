
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, GitHub } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">ShopGalaxy</h3>
            <p className="text-sm text-gray-600">
              Your one-stop shop for all your shopping needs. Quality products, fast delivery, excellent service.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-500 hover:text-shop-purple">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-shop-purple">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-shop-purple">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-shop-purple">
                <GitHub size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold uppercase mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/category/Electronics" className="text-sm text-gray-600 hover:text-shop-purple">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/category/Clothing" className="text-sm text-gray-600 hover:text-shop-purple">
                  Clothing
                </Link>
              </li>
              <li>
                <Link to="/category/Home" className="text-sm text-gray-600 hover:text-shop-purple">
                  Home & Garden
                </Link>
              </li>
              <li>
                <Link to="/category/Books" className="text-sm text-gray-600 hover:text-shop-purple">
                  Books
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold uppercase mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/account" className="text-sm text-gray-600 hover:text-shop-purple">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-sm text-gray-600 hover:text-shop-purple">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-sm text-gray-600 hover:text-shop-purple">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-gray-600 hover:text-shop-purple">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold uppercase mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-shop-purple">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-shop-purple">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-gray-600 hover:text-shop-purple">
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-gray-600 hover:text-shop-purple">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-600">
            © {currentYear} ShopGalaxy. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-shop-purple">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-gray-500 hover:text-shop-purple">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-xs text-gray-500 hover:text-shop-purple">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
