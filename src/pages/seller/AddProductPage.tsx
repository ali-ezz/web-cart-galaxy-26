
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
import { useQuery } from '@tanstack/react-query';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AddProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '1',
    category: '',
    image_url: '',
    discounted_price: '',
  });

  // Fetch categories from the database
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData({
      ...productData,
      [name]: value,
    });
  };

  const handleCategoryChange = (value: string) => {
    setProductData({
      ...productData,
      category: value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!productImage) return null;
    
    try {
      setIsUploading(true);
      
      // Create a unique file name
      const fileExt = productImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, productImage);
      
      if (error) throw error;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Image Upload Failed',
        description: error.message || 'Could not upload product image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a product.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Convert numeric strings to numbers
      const numericPrice = parseFloat(productData.price);
      const numericStock = parseInt(productData.stock, 10);
      
      if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error("Price must be a valid positive number");
      }
      
      if (isNaN(numericStock) || numericStock < 0) {
        throw new Error("Stock must be a valid non-negative number");
      }
      
      // Handle optional discounted price
      let numericDiscountedPrice = null;
      if (productData.discounted_price) {
        numericDiscountedPrice = parseFloat(productData.discounted_price);
        if (isNaN(numericDiscountedPrice) || numericDiscountedPrice <= 0) {
          throw new Error("Discounted price must be a valid positive number");
        }
        if (numericDiscountedPrice >= numericPrice) {
          throw new Error("Discounted price must be less than the regular price");
        }
      }
      
      // Upload image if one is selected
      let imageUrl = productData.image_url;
      if (productImage) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }
      
      // Default image if none provided
      if (!imageUrl) {
        imageUrl = "https://via.placeholder.com/300?text=Product+Image";
      }
      
      // Create the product in the database
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          price: numericPrice,
          discounted_price: numericDiscountedPrice,
          stock: numericStock,
          category: productData.category,
          image_url: imageUrl,
          seller_id: user.id,
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Product Added",
        description: "Your product has been successfully added.",
      });
      
      // Navigate to seller products page
      navigate('/seller/products');
      
    } catch (error: any) {
      toast({
        title: "Error Adding Product",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-gray-600 mt-1">Create a new product listing in your store</p>
      </div>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Product Image
            </label>
            <div className="flex items-center justify-center">
              {imagePreview ? (
                <div className="relative w-40 h-40">
                  <img 
                    src={imagePreview} 
                    alt="Product preview" 
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 w-40 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-shop-purple transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Recommended: 800x800px. Max size: 5MB
            </p>
          </div>

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
                  Regular Price ($) *
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
                  Sale Price ($)
                </label>
                <Input
                  id="discounted_price"
                  name="discounted_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productData.discounted_price}
                  onChange={handleInputChange}
                  placeholder="Leave empty if no discount"
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
                Image URL (optional if uploading image)
              </label>
              <Input
                id="image_url"
                name="image_url"
                value={productData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seller/products')}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="min-w-[120px]"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Adding...'}
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
