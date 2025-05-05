
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

// Pages
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import WishlistPage from "./pages/WishlistPage";
import NotFound from "./pages/NotFound";
import AuthConfirmationPage from "./pages/AuthConfirmationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import DeliveryDashboardPage from "./pages/DeliveryDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import WelcomePage from "./pages/WelcomePage";

// Seller Pages
import AddProductPage from "./pages/seller/AddProductPage";
import ProductsPage from "./pages/seller/ProductsPage";
import EditProductPage from "./pages/seller/EditProductPage";
import OrdersPage from "./pages/seller/OrdersPage";

// Admin Pages
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Delivery Pages
import AvailableOrdersPage from "./pages/delivery/AvailableOrdersPage";
import DeliveryAssignmentsPage from "./pages/delivery/DeliveryAssignmentsPage";
import DeliveryRoutesPage from "./pages/delivery/DeliveryRoutesPage";
import DeliverySchedulePage from "./pages/delivery/DeliverySchedulePage";
import DeliveryEarningsPage from "./pages/delivery/DeliveryEarningsPage";
import DeliverySettingsPage from "./pages/delivery/DeliverySettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

function ProtectedRoute({ children, allowedRoles, redirectPath = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-shop-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace state={{ from: window.location.pathname }} />;
  }
  
  // Check role if specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/welcome" replace />;
  }
  
  return <>{children}</>;
}

// Customer-only route - redirects other user types to their dashboard
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { userRole, isAuthenticated, loading } = useAuth();
  
  // Show nothing while loading
  if (loading) {
    return null;
  }
  
  // If user is authenticated and not a customer, redirect to welcome page
  if (isAuthenticated && userRole && userRole !== 'customer') {
    return <Navigate to="/welcome" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <main className="min-h-screen pt-4">
              <Routes>
                {/* Public routes - accessible to everyone */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth-confirmation" element={<AuthConfirmationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/welcome" element={<WelcomePage />} />

                {/* Customer routes - home page is for customers only */}
                <Route path="/" element={
                  <CustomerRoute>
                    <Home />
                  </CustomerRoute>
                } />
                <Route path="/product/:id" element={
                  <CustomerRoute>
                    <ProductPage />
                  </CustomerRoute>
                } />
                <Route path="/category/:category" element={
                  <CustomerRoute>
                    <CategoryPage />
                  </CustomerRoute>
                } />
                <Route path="/search" element={
                  <CustomerRoute>
                    <SearchPage />
                  </CustomerRoute>
                } />
                <Route path="/cart" element={
                  <CustomerRoute>
                    <CartPage />
                  </CustomerRoute>
                } />
                <Route path="/wishlist" element={
                  <CustomerRoute>
                    <WishlistPage />
                  </CustomerRoute>
                } />
                <Route path="/checkout-success" element={
                  <CustomerRoute>
                    <CheckoutSuccessPage />
                  </CustomerRoute>
                } />
                
                {/* Protected routes - require authentication */}
                <Route path="/account/*" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/products" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProductsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/orders" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminOrdersPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/applications" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminApplicationsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                } />
                
                {/* Seller routes */}
                <Route path="/seller" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerDashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/products" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <ProductsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/products/new" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <AddProductPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/products/edit/:id" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <EditProductPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/orders" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <OrdersPage />
                  </ProtectedRoute>
                } />
                
                {/* Delivery routes */}
                <Route path="/delivery" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryDashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/available" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <AvailableOrdersPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/assignments" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryAssignmentsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/routes" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryRoutesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/schedule" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliverySchedulePage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/earnings" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryEarningsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/delivery/settings" element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliverySettingsPage />
                  </ProtectedRoute>
                } />
                
                {/* 404 catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
