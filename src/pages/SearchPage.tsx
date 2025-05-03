
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { searchProducts } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(searchProducts(initialQuery));

  // Update results when URL query changes
  useEffect(() => {
    const newQuery = queryParams.get('q') || '';
    setSearchQuery(newQuery);
    setResults(searchProducts(newQuery));
  }, [location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setResults(searchProducts(searchQuery));
      // Update URL without reloading
      const newUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium">Search Results</li>
        </ol>
      </nav>

      {/* Search form */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>
        <form onSubmit={handleSearch} className="flex max-w-lg">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
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
      </div>

      {/* Results info */}
      <div className="mb-6">
        <p className="text-gray-600">
          {initialQuery ? (
            <>
              Found {results.length} results for <span className="font-semibold">"{initialQuery}"</span>
            </>
          ) : (
            'Enter a search term to find products.'
          )}
        </p>
      </div>

      {/* Results grid */}
      {initialQuery && results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : initialQuery ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-medium mb-2">No products found</h2>
          <p className="text-gray-600 mb-6">Try a different search term or browse our categories.</p>
          <Button asChild>
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
