
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface ProductData {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  stock: number;
  category: string;
  image_url: string | null;
  seller_id?: string;
}

// Complete product interface with all database fields
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  stock: number;
  category: string;
  image_url: string | null;
  seller_id: string;
  created_at: string;
  updated_at: string;
  rating: number | null;
  reviews_count: number | null;
}

export default function EditProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState<ProductData>({
    name: '',
    description: '',
    price: 0,
    discounted_price: null,
    stock: 0,
    category: '',
    image_url: '',
  });

  // Fetch product data
  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Check if the current user is the seller
      if (!data.seller_id) {
        throw new Error("This product doesn't have an assigned seller");
      }
      
      if (data.seller_id !== user?.id) {
        throw new Error("You don't have permission to edit this product");
      }
      
      return data as Product;
    },
    enabled: !!id && !!user?.id,
    retry: false,
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Set product data when it's loaded
  useEffect(() => {
    if (product) {
      setProductData({
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        price: product.price,
        discounted_price: product.discounted_price,
        stock: product.stock,
        category: product.category || '',
        image_url: product.image_url || '',
        seller_id: product.seller_id,
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric inputs to numbers
    if (name === 'price' || name === 'discounted_price' || name === 'stock') {
      setProductData({
        ...productData,
        [name]: value === '' ? (name === 'discounted_price' ? null : 0) : Number(value),
      });
    } else {
      setProductData({
        ...productData,
        [name]: value,
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    setProductData({
      ...productData,
      category: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update a product.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Input validation
      if (!productData.name || productData.name.trim() === '') {
        throw new Error("Product name is required");
      }
      
      if (productData.price <= 0) {
        throw new Error("Price must be a positive number");
      }
      
      if (productData.discounted_price !== null && productData.discounted_price <= 0) {
        throw new Error("Discounted price must be a positive number");
      }
      
      if (productData.stock < 0) {
        throw new Error("Stock cannot be negative");
      }
      
      // Update product - make sure to convert the numeric values to the appropriate types
      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          discounted_price: productData.discounted_price,
          stock: productData.stock,
          category: productData.category,
          image_url: productData.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Product Updated",
        description: "Your product has been successfully updated.",
      });
      
      // Navigate back to seller products page
      navigate('/seller/products');
      
    } catch (error: any) {
      toast({
        title: "Error Updating Product",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching product data
  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product data...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (productError instanceof Error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{productError.message}</p>
          <Button onClick={() => navigate('/seller/products')}>
            Back to Products
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update your product listing</p>
      </div>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Product Name *
              </label>
              <Input
                id="name"
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={productData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-1">
                  Price ($) *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="discounted_price" className="block text-sm font-medium mb-1">
                  Discounted Price ($) <span className="text-gray-500">(Optional)</span>
                </label>
                <Input
                  id="discounted_price"
                  name="discounted_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productData.discounted_price || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium mb-1">
                  Stock Quantity *
                </label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={productData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <Select 
                  value={productData.category} 
                  onValueChange={handleCategoryChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>No categories found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium mb-1">
                Image URL
              </label>
              <Input
                id="image_url"
                name="image_url"
                value={productData.image_url || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              {productData.image_url && (
                <div className="mt-2 p-2 border rounded">
                  <p className="text-sm mb-1">Image Preview:</p>
                  <img 
                    src={productData.image_url} 
                    alt="Product preview" 
                    className="w-28 h-28 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seller/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
