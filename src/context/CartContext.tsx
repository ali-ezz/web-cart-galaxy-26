
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  discounted_price: number | null;
  image_url: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart from local storage on initial load
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
        setCartCount(parsedCart.reduce((total: number, item: CartItem) => total + item.quantity, 0));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('cart');
    }
    
    // Update cart count
    setCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
  }, [cartItems]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    setIsLoading(true);
    try {
      // Fetch product details
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, price, discounted_price, image_url, stock')
        .eq('id', productId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!product) {
        toast({
          title: "Product not found",
          description: "The product you're trying to add to cart doesn't exist.",
          variant: "destructive",
        });
        return;
      }
      
      // Check stock
      if (product.stock <= 0) {
        toast({
          title: "Out of stock",
          description: "Sorry, this product is currently out of stock.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if product already in cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Ensure we don't exceed available stock
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
        
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.product_id === productId 
              ? { ...item, quantity: newQuantity } 
              : item
          )
        );
        
        if (newQuantity === product.stock) {
          toast({
            title: "Maximum stock reached",
            description: `You've added all available stock for this item (${product.stock}).`,
          });
        }
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `cart-${Date.now()}`,
          product_id: product.id,
          quantity: Math.min(quantity, product.stock),
          name: product.name,
          price: product.price,
          discounted_price: product.discounted_price,
          image_url: product.image_url
        };
        
        setCartItems(prevItems => [...prevItems, newItem]);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "There was a problem adding this product to your cart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart.",
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    try {
      // Check product stock before updating
      const { data: product, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      
      if (!product) {
        toast({
          title: "Product not found",
          description: "The product you're trying to update doesn't exist anymore.",
          variant: "destructive",
        });
        removeFromCart(productId);
        return;
      }
      
      // Ensure quantity doesn't exceed stock
      const safeQuantity = Math.min(quantity, product.stock);
      
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.product_id === productId 
            ? { ...item, quantity: safeQuantity } 
            : item
        )
      );
      
      if (safeQuantity !== quantity) {
        toast({
          title: "Quantity adjusted",
          description: `Maximum available stock for this item is ${product.stock}.`,
        });
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your cart.",
        variant: "destructive",
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
