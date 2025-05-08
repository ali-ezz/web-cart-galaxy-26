
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Eagerly loaded components (core functionality)
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WelcomePage from "./pages/WelcomePage";
import AuthConfirmationPage from "./pages/AuthConfirmationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Index from "./pages/Index";

// Lazily loaded components (per-role functionality)
const Home = lazy(() => import("./pages/Home"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const CheckoutSuccessPage = lazy(() => import("./pages/CheckoutSuccessPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminApplicationsPage = lazy(() => import("./pages/admin/AdminApplicationsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

// Seller pages
const SellerDashboardPage = lazy(() => import("./pages/SellerDashboardPage"));
const AddProductPage = lazy(() => import("./pages/seller/AddProductPage"));
const ProductsPage = lazy(() => import("./pages/seller/ProductsPage"));
const EditProductPage = lazy(() => import("./pages/seller/EditProductPage"));
const OrdersPage = lazy(() => import("./pages/seller/OrdersPage"));
const SalesPage = lazy(() => import("./pages/seller/SalesPage"));
const AnalyticsPage = lazy(() => import("./pages/seller/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/seller/SettingsPage"));

// Delivery pages
const DeliveryDashboardPage = lazy(() => import("./pages/DeliveryDashboardPage"));
const AvailableOrdersPage = lazy(() => import("./pages/delivery/AvailableOrdersPage"));
const DeliveryAssignmentsPage = lazy(() => import("./pages/delivery/DeliveryAssignmentsPage"));
const DeliveryRoutesPage = lazy(() => import("./pages/delivery/DeliveryRoutesPage"));
const DeliverySchedulePage = lazy(() => import("./pages/delivery/DeliverySchedulePage"));
const DeliveryEarningsPage = lazy(() => import("./pages/delivery/DeliveryEarningsPage"));
const DeliverySettingsPage = lazy(() => import("./pages/delivery/DeliverySettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// Loading Fallback Component
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
    </div>
  );
}

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
    return <LoadingFallback />;
  }
  
  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace state={{ from: window.location.pathname }} />;
  }
  
  // Check role if specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    console.log(`Access denied: User role ${userRole} not in allowed roles:`, allowedRoles);
    return <Navigate to="/welcome" replace />;
  }
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
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

                {/* Root route - use Index component which handles proper routing */}
                <Route path="/" element={<Index />} />
                
                {/* Customer routes with improved accessibility */}
                <Route path="/home" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Home />
                  </Suspense>
                } />
                <Route path="/product/:id" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductPage />
                  </Suspense>
                } />
                <Route path="/category/:category" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CategoryPage />
                  </Suspense>
                } />
                <Route path="/search" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <SearchPage />
                  </Suspense>
                } />
                <Route path="/cart" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CartPage />
                  </Suspense>
                } />
                <Route path="/wishlist" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <WishlistPage />
                  </Suspense>
                } />
                <Route path="/checkout-success" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CheckoutSuccessPage />
                  </Suspense>
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
                
                <Route path="/seller/sales" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SalesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/analytics" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/seller/settings" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SettingsPage />
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
            {/* Footer removed as requested */}
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
