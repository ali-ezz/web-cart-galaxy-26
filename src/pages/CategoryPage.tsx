
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductsByCategory, categories } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  
  // Get products in this category
  const products = category ? getProductsByCategory(category) : [];
  
  // Check if category exists
  const categoryExists = category && categories.includes(category);

  if (!categoryExists) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="mb-8">The category you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-1">
          <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
          <li><span>&gt;</span></li>
          <li className="text-gray-900 font-medium">{category}</li>
        </ol>
      </nav>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category}</h1>
        <p className="text-gray-600 mt-2">
          Browse our selection of {products.length} products in the {category} category.
        </p>
      </div>
      
      {/* Products grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-medium mb-2">No products found</h2>
          <p className="text-gray-600 mb-6">There are no products available in this category yet.</p>
          <Button asChild>
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
