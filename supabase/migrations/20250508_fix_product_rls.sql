
-- Enable Row Level Security on products if not already enabled
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Allow sellers to view any product
CREATE POLICY "Sellers can view any product" 
ON public.products
FOR SELECT 
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'seller'
  OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

-- Allow sellers to insert their own products
CREATE POLICY "Sellers can insert their own products" 
ON public.products
FOR INSERT 
WITH CHECK (
  auth.uid() = seller_id AND
  ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'seller' OR
   (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin')
);

-- Allow sellers to update their own products
CREATE POLICY "Sellers can update their own products" 
ON public.products
FOR UPDATE 
USING (
  auth.uid() = seller_id AND
  ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'seller' OR
   (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin')
);

-- Allow sellers to delete their own products
CREATE POLICY "Sellers can delete their own products" 
ON public.products
FOR DELETE 
USING (
  auth.uid() = seller_id AND
  ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'seller' OR
   (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin')
);

-- Allow customers to view all products
CREATE POLICY "Customers can view all products"
ON public.products
FOR SELECT
USING (true);
