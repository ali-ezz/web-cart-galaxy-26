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

const queryClient = new QueryClient();

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

function ProtectedRoute({ children, allowedRoles, redirectPath = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  // Show nothing while loading
  if (loading) {
    return null;
  }
  
  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Check role if specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/account" replace />;
  }
  
  return <>{children}</>;
}

// Role-specific dashboard selector
function DashboardRedirect() {
  const { userRole } = useAuth();
  
  switch(userRole) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'seller':
      return <Navigate to="/seller" replace />;
    case 'delivery':
      return <Navigate to="/delivery" replace />;
    default:
      return <Navigate to="/account" replace />;
  }
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
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth-confirmation" element={<AuthConfirmationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Protected routes */}
                <Route path="/account/*" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                
                {/* Role-based dashboard redirect */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardRedirect />
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
                
                <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
