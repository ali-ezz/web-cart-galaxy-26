import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Index from '@/pages/Index';
import ProductPage from '@/pages/ProductPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import SellerDashboardPage from '@/pages/SellerDashboardPage';
import DeliveryDashboardPage from '@/pages/DeliveryDashboardPage';
import AccountPage from '@/pages/AccountPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
// Add other imports as needed

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Index />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/seller" element={<SellerDashboardPage />} />
                  <Route path="/delivery" element={<DeliveryDashboardPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  {/* Add other routes as needed */}
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
