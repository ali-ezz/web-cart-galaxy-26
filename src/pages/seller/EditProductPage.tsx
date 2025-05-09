
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductForm from '@/components/seller/ProductForm';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-500">Error: Missing Product ID</h1>
        <p className="mt-2">No product ID was provided in the URL.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm productId={id} mode="edit" />
    </div>
  );
}
