
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white py-6 border-t mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-shop-purple">UniMarket</span>
            </Link>
            <p className="text-sm text-gray-500 mt-1">Everything you need, all in one place</p>
          </div>
          
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-shop-purple">Privacy</Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-shop-purple">Terms</Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-shop-purple">Contact</Link>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} UniMarket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
