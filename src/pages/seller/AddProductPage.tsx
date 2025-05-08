import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, { 
    message: 'Price must be a positive number' 
  }),
  discountedPrice: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Discounted price must be a positive number or empty'
  }).optional(),
  stock: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Stock must be a non-negative number'
  }),
  category: z.string().min(1, { message: 'Please select a category' }),
});

type FormData = z.infer<typeof formSchema>;

export default function AddProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      discountedPrice: '',
      stock: '1',
      category: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "The image must be less than 5MB in size.",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file.",
        });
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!image) return null;
    
    try {
      setIsUploading(true);
      const fileExt = image.name.split('.').pop();
      const filePath = `${productId}/${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get the public URL for the uploaded image
      const imageUrl = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path).data.publicUrl;
      
      setIsUploading(false);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was a problem uploading the image.",
      });
      setIsUploading(false);
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to add a product.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert string values to appropriate types and ensure seller_id is explicitly set
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        discounted_price: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
        stock: parseInt(data.stock),
        category: data.category,
        seller_id: user.id, // Explicitly set seller_id to the current user's ID
      };
      
      console.log("Adding product with seller_id:", user.id);
      
      // Insert the product into the database
      const { data: product, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error("Product insert error:", error);
        throw error;
      }

      // If there's an image, upload it
      let imageUrl = null;
      if (image && product) {
        imageUrl = await uploadImage(product.id);
        
        if (imageUrl) {
          // Update the product with the image URL
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', product.id);
          
          if (updateError) {
            console.error('Error updating product with image URL:', updateError);
          }
        }
      }

      toast({
        title: "Product added",
        description: "Your product has been successfully added.",
      });
      
      navigate('/seller/products');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        variant: "destructive",
        title: "Failed to add product",
        description: error.message || "There was a problem adding your product.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Product</CardTitle>
          <CardDescription>Fill in the details to add a new product to your store</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="0"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discounted Price ($) (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01" 
                            min="0"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank if not on sale
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="home">Home & Kitchen</SelectItem>
                          <SelectItem value="books">Books</SelectItem>
                          <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                          <SelectItem value="sports">Sports & Outdoors</SelectItem>
                          <SelectItem value="toys">Toys & Games</SelectItem>
                          <SelectItem value="grocery">Grocery & Gourmet Food</SelectItem>
                          <SelectItem value="health">Health & Household</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Product Image</FormLabel>
                  {imagePreview ? (
                    <div className="relative w-full h-48 mt-2 rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-full h-full object-cover" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label 
                          htmlFor="image-upload" 
                          className="text-sm font-medium text-shop-purple cursor-pointer hover:text-shop-purple-dark"
                        >
                          Upload an image
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isUploading}
              >
                {(isSubmitting || isUploading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Uploading Image...' : 'Adding Product...'}
                  </>
                ) : 'Add Product'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => navigate('/seller/products')}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
