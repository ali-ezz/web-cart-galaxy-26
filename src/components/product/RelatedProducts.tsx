
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  discounted_price: number | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  category: string;
}

interface RelatedProductsProps {
  category: string;
  currentProductId: string;
}

export default function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  // Fetch related products
  const { data: relatedProducts, isLoading } = useQuery({
    queryKey: ['relatedProducts', category, currentProductId],
    queryFn: async (): Promise<Product[]> => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, discounted_price, image_url, rating, reviews_count, category')
          .eq('category', category)
          .neq('id', currentProductId)
          .limit(4);
          
        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {relatedProducts.map((product) => (
        <Link to={`/product/${product.id}`} key={product.id}>
          <ProductCard
            id={product.id}
            name={product.name}
            category={product.category}
            price={product.price}
            discountedPrice={product.discounted_price}
            imageUrl={product.image_url || '/placeholder.svg'}
            rating={product.rating}
            reviewCount={product.reviews_count}
          />
        </Link>
      ))}
    </div>
  );
}
