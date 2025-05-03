
import React from 'react';
import { Link } from 'react-router-dom';
import { products, categories } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  // Get featured products (products with discounts)
  const featuredProducts = products.filter(product => product.discountedPrice);
  
  // Get best sellers (highest rated products)
  const bestSellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  
  // Get newest arrivals (for demo purposes, use the last 4 products)
  const newArrivals = products.slice(-4);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-shop-purple-light to-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Shop the Latest Trends
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                Discover amazing products at unbeatable prices. Quality you can trust, delivered to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-shop-purple hover:bg-shop-purple-dark text-white px-8 py-6"
                  asChild
                >
                  <Link to="/category/Electronics">
                    Shop Now
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  className="border-shop-purple text-shop-purple hover:bg-shop-purple hover:text-white px-8 py-6"
                  asChild
                >
                  <Link to="/categories">
                    Browse Categories
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop" 
                alt="Online Shopping"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/categories" className="text-shop-purple flex items-center gap-1 hover:underline">
              View all categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link 
                to={`/category/${category}`}
                key={category} 
                className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-xl text-gray-800 font-medium group-hover:text-shop-purple transition-colors">
                    {category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Deals</h2>
            <Link to="/deals" className="text-shop-purple flex items-center gap-1 hover:underline">
              View all deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
            <Link to="/best-sellers" className="text-shop-purple flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <Link to="/new-arrivals" className="text-shop-purple flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promotion banner */}
      <section className="py-12 bg-shop-purple-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-shop-purple">Free Shipping on Orders Over $50</h2>
            <p className="text-gray-700 mb-6">
              Limited time offer. Shop now and enjoy free shipping on all eligible orders.
            </p>
            <Button 
              className="bg-shop-purple hover:bg-shop-purple-dark text-white px-8 py-6"
              asChild
            >
              <Link to="/category/Electronics">
                Shop Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
