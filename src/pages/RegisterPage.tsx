
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Database } from '@/integrations/supabase/types';
import LoginTroubleshooting from '@/components/LoginTroubleshooting';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

// Define type for roles from database
type UserRole = Database["public"]["Enums"]["user_role"];

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'seller', 'delivery', 'admin'] as const).default("customer")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RoleQuestion {
  question: string;
  type: 'text' | 'textarea';
  required?: boolean;
}

const roleQuestions: Record<string, RoleQuestion[]> = {
  seller: [
    { 
      question: "What products do you plan to sell?", 
      type: "textarea", 
      required: true 
    },
    { 
      question: "Do you have an existing business?", 
      type: "text" 
    },
  ],
  delivery: [
    { 
      question: "What areas can you deliver to?", 
      type: "textarea", 
      required: true 
    },
    { 
      question: "Do you have your own transportation?", 
      type: "text", 
      required: true 
    },
  ],
};

export default function RegisterPage() {
  const { register: registerAuth, isAuthenticated, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});
  const [retryCount, setRetryCount] = useState(0);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [lastRedirectTime, setLastRedirectTime] = useState<number | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "customer"
    }
  });
  
  useEffect(() => {
    console.log("RegisterPage state:", { 
      isAuthenticated, 
      userRole, 
      loading, 
      registrationSuccess 
    });
  }, [isAuthenticated, userRole, loading, registrationSuccess]);
  
  // Initial session check
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Active session found in RegisterPage");
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      } finally {
        setVerifyingSession(false);
      }
    };
    
    verifySession();
  }, []);
  
  // Check if already authenticated and redirect 
  useEffect(() => {
    const now = Date.now();
    
    // Prevent multiple redirects within a short time window
    if (lastRedirectTime && now - lastRedirectTime < 2000) {
      return;
    }
    
    if (!verifyingSession && isAuthenticated) {
      // Set the redirect time to prevent multiple redirects
      setLastRedirectTime(now);
      
      console.log("User already authenticated, preparing to redirect with role:", userRole);
      
      // Add a short delay to ensure role is loaded
      setTimeout(() => {
        if (userRole) {
          console.log(`Redirecting authenticated user to ${userRole} dashboard`);
          
          switch (userRole) {
            case 'admin':
              navigate('/admin', { replace: true });
              break;
            case 'seller':
              navigate('/seller', { replace: true });
              break;
            case 'delivery':
              navigate('/delivery', { replace: true });
              break;
            default:
              navigate('/', { replace: true });
              break;
          }
        } else {
          // If no role detected yet, go to welcome page which handles role detection
          console.log("No role detected, redirecting to welcome page");
          navigate('/welcome', { replace: true });
        }
      }, 500);
    }
  }, [isAuthenticated, userRole, navigate, verifyingSession, lastRedirectTime]);
  
  // Handle successful registration
  useEffect(() => {
    if (registrationSuccess && !loading) {
      console.log("Registration was successful, navigating to auth confirmation");
      navigate('/auth-confirmation');
    }
  }, [registrationSuccess, loading, navigate]);
  
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    form.setValue('role', role);
  };
  
  const handleQuestionChange = (questionIndex: number, value: string) => {
    const questions = roleQuestions[selectedRole];
    if (questions && questions[questionIndex]) {
      setQuestionResponses(prev => ({
        ...prev,
        [questions[questionIndex].question]: value
      }));
    }
  };
  
  const handleRetry = () => {
    setError('');
    setRetryCount(prev => prev + 1);
    form.clearErrors();
  };
  
  const onSubmit = async (data: RegisterFormValues) => {
    if (isRegistering) return; // Prevent duplicate submissions
    
    setIsRegistering(true);
    setError('');
    
    // Validate role-specific questions
    const questions = roleQuestions[selectedRole] || [];
    const requiredQuestions = questions.filter(q => q.required);
    
    for (const q of requiredQuestions) {
      if (!questionResponses[q.question]) {
        setError(`Please answer the required question: ${q.question}`);
        setIsRegistering(false);
        return;
      }
    }
    
    try {
      // Ensure the role is properly typed as UserRole
      const userRole: UserRole = data.role as UserRole;
      
      // Use the auth context to register the user with properly typed role
      const success = await registerAuth(
        data.name, 
        data.email, 
        data.password,
        userRole,
        questionResponses
      );
      
      if (success) {
        console.log("Registration successful");
        setRegistrationSuccess(true);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-4">
                Check your email for a verification link. After confirming your email, you'll be ready to use your account.
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full mt-4"
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
          <p className="mt-2 text-gray-600">
            Join ShopGalaxy to start shopping and track your orders
          </p>
        </div>
        
        <Card className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("connection") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry} 
                    className="mt-2"
                    disabled={isRegistering || loading}
                  >
                    Retry Connection
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {verifyingSession ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-shop-purple" />
              <p className="ml-2">Verifying session...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select 
                        onValueChange={(value: UserRole) => {
                          handleRoleChange(value);
                          field.onChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Role-specific questions */}
                {selectedRole !== 'customer' && roleQuestions[selectedRole] && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium">Additional Information</h3>
                    {roleQuestions[selectedRole].map((q, index) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {q.question}{q.required && <span className="text-red-500">*</span>}
                        </label>
                        {q.type === 'textarea' ? (
                          <Textarea 
                            value={questionResponses[q.question] || ''} 
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <Input 
                            type="text" 
                            value={questionResponses[q.question] || ''} 
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-shop-purple hover:bg-shop-purple-dark py-6"
                  disabled={isRegistering || loading}
                >
                  {isRegistering || loading ? (
                    <> 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                    </>
                  ) : 'Create Account'}
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  <p>
                    By registering, you agree to our{' '}
                    <Link to="/terms" className="text-shop-purple hover:underline">Terms of Service</Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-shop-purple hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              </form>
            </Form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-shop-purple hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          
          {/* Add LoginTroubleshooting component */}
          <div className="flex justify-center mt-4">
            <LoginTroubleshooting />
          </div>
        </Card>
      </div>
    </div>
  );
}
