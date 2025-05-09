
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ProductDetail from '@/components/product/ProductDetail';
import RelatedProducts from '@/components/product/RelatedProducts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discounted_price: number | null;
  stock: number;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  reviews?: Review[];
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<Product | null> => {
      try {
        if (!id) return null;
        
        // Fetch product details
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (!data) return null;
        
        // Fetch reviews with user profiles
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('product_id', id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (reviewsError) throw reviewsError;
        
        // Process reviews to format user names
        const processedReviews = reviewsData?.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          user: {
            name: review.profiles ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() : 'Anonymous',
            avatar_url: review.profiles ? review.profiles.avatar_url : null,
          }
        }));
        
        return {
          ...data,
          reviews: processedReviews || [],
        };
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },
    enabled: !!id,
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-shop-purple" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Sorry, we couldn't find the product you're looking for.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{product.name} | Your Shop</title>
        <meta name="description" content={product.description || `Buy ${product.name} at our store`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm text-gray-500">
          <ol className="flex items-center space-x-1">
            <li><Link to="/" className="hover:text-shop-purple">Home</Link></li>
            <li><span>&gt;</span></li>
            <li>
              <Link to={`/category/${product.category}`} className="hover:text-shop-purple">
                {product.category}
              </Link>
            </li>
            <li><span>&gt;</span></li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>
        
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Products</Link>
          </Button>
        </div>
        
        <ProductDetail product={product} />
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <RelatedProducts category={product.category} currentProductId={product.id} />
        </div>
      </div>
    </HelmetProvider>
  );
}
