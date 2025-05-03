
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { 
  Search, 
  ShoppingCart, 
  User, 
  LogIn, 
  Heart, 
  Menu, 
  X,
  Package,
  Truck,
  Shield
} from 'lucide-react';
import { categories } from '@/lib/data';

export function Header() {
  const { isAuthenticated, user, logout, userRole } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Role-based dashboard link
  const getDashboardLink = () => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'seller':
        return '/seller';
      case 'delivery':
        return '/delivery';
      default:
        return '/account';
    }
  };

  // Role-based dashboard icon
  const getDashboardIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'seller':
        return <Package className="h-5 w-5" />;
      case 'delivery':
        return <Truck className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top bar with logo, search, and icons */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-shop-purple">ShopGalaxy</span>
        </Link>

        {/* Search bar - hide on mobile */}
        <form 
          onSubmit={handleSearch} 
          className="hidden md:flex flex-1 max-w-xl mx-8 relative"
        >
          <Input
            type="text"
            placeholder="Search for products..."
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            className="absolute right-0 top-0"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Cart */}
          <Link to="/cart">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center bg-shop-purple text-white rounded-full">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Wishlist - hide for delivery users */}
          {userRole !== 'delivery' && (
            <Link to="/wishlist" className="hidden sm:block">
              <Button variant="outline" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Auth - show different icon based on role */}
          {isAuthenticated ? (
            <Link to={getDashboardLink()}>
              <Button variant="outline" size="icon">
                {getDashboardIcon()}
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="icon">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Categories navigation - hide for sellers and delivery */}
      {userRole !== 'seller' && userRole !== 'delivery' && (
        <nav className="bg-gray-100 hidden md:block">
          <div className="container mx-auto px-4">
            <ul className="flex flex-wrap">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    to={`/category/${category}`}
                    className="block px-4 py-2 hover:text-shop-purple transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for products..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  className="absolute right-0 top-0"
                  size="icon"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Mobile links */}
            <ul className="space-y-2">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link 
                      to={getDashboardLink()}
                      className="block p-2 hover:bg-gray-50 flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {getDashboardIcon()}
                      <span className="ml-2">
                        {userRole === 'admin' && 'Admin Dashboard'}
                        {userRole === 'seller' && 'Seller Dashboard'}
                        {userRole === 'delivery' && 'Delivery Dashboard'}
                        {(!userRole || userRole === 'customer') && `My Account (${user?.name})`}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left p-2 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      to="/login" 
                      className="block p-2 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="block p-2 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
              
              {/* Only show wishlist for customers and regular users */}
              {(userRole === 'customer' || !userRole) && (
                <li>
                  <Link 
                    to="/wishlist" 
                    className="block p-2 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                </li>
              )}
              
              {/* Only show categories for customers and regular users */}
              {(userRole === 'customer' || !userRole) && (
                <>
                  <li className="border-t border-gray-200 pt-2 mt-2">
                    <span className="block px-2 text-sm font-semibold text-gray-600">Categories</span>
                  </li>
                  {categories.map((category) => (
                    <li key={category}>
                      <Link
                        to={`/category/${category}`}
                        className="block p-2 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
