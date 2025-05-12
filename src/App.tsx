
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/Header';
import Index from '@/pages/Index';
import ProductPage from '@/pages/ProductPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import SellerDashboardPage from '@/pages/SellerDashboardPage';
import DeliveryDashboardPage from '@/pages/DeliveryDashboardPage';
import AccountPage from '@/pages/AccountPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import DeliverySchedulePage from '@/pages/delivery/DeliverySchedulePage';
import DeliveryAssignmentsPage from '@/pages/delivery/DeliveryAssignmentsPage';
import DeliveryRoutesPage from '@/pages/delivery/DeliveryRoutesPage';
import DeliveryEarningsPage from '@/pages/delivery/DeliveryEarningsPage';
import CartPage from '@/pages/CartPage';
import AvailableOrdersPage from '@/pages/delivery/AvailableOrdersPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import WelcomePage from '@/pages/WelcomePage';
import AuthConfirmationPage from '@/pages/AuthConfirmationPage';
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
                  <Route path="/delivery/schedule" element={<DeliverySchedulePage />} />
                  <Route path="/delivery/assignments" element={<DeliveryAssignmentsPage />} />
                  <Route path="/delivery/routes" element={<DeliveryRoutesPage />} />
                  <Route path="/delivery/earnings" element={<DeliveryEarningsPage />} />
                  <Route path="/delivery/available" element={<AvailableOrdersPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/auth-confirmation" element={<AuthConfirmationPage />} />
                  {/* Redirect for invalid routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
            <Toaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
