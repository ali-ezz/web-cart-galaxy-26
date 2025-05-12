
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/Header';
import { AuthRedirect } from '@/components/AuthRedirect';
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

// Create a client for React Query with improved settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
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
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Index />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  
                  {/* Auth routes */}
                  <Route path="/login" element={
                    <AuthRedirect>
                      <LoginPage />
                    </AuthRedirect>
                  } />
                  <Route path="/register" element={
                    <AuthRedirect>
                      <RegisterPage />
                    </AuthRedirect>
                  } />
                  <Route path="/auth-confirmation" element={<AuthConfirmationPage />} />
                  <Route path="/welcome" element={
                    <AuthRedirect requireAuth={true}>
                      <WelcomePage />
                    </AuthRedirect>
                  } />
                  
                  {/* Customer routes */}
                  <Route path="/cart" element={
                    <AuthRedirect requireAuth={true}>
                      <CartPage />
                    </AuthRedirect>
                  } />
                  <Route path="/account" element={
                    <AuthRedirect requireAuth={true}>
                      <AccountPage />
                    </AuthRedirect>
                  } />
                  
                  {/* Role-specific routes */}
                  <Route path="/admin" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </AuthRedirect>
                  } />
                  <Route path="/admin/products" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['admin']}>
                      <AdminProductsPage />
                    </AuthRedirect>
                  } />
                  <Route path="/seller" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['seller']}>
                      <SellerDashboardPage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <DeliveryDashboardPage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery/schedule" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <DeliverySchedulePage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery/assignments" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <DeliveryAssignmentsPage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery/routes" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <DeliveryRoutesPage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery/earnings" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <DeliveryEarningsPage />
                    </AuthRedirect>
                  } />
                  <Route path="/delivery/available" element={
                    <AuthRedirect requireAuth={true} allowedRoles={['delivery']}>
                      <AvailableOrdersPage />
                    </AuthRedirect>
                  } />
                  
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
