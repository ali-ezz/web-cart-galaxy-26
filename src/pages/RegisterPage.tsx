
import React, { useState } from 'react';
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
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});
  
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
  
  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError('');
    
    // Validate role-specific questions
    const questions = roleQuestions[selectedRole] || [];
    const requiredQuestions = questions.filter(q => q.required);
    
    for (const q of requiredQuestions) {
      if (!questionResponses[q.question]) {
        setError(`Please answer the required question: ${q.question}`);
        setLoading(false);
        return;
      }
    }
    
    try {
      // Use the auth context to register the user with properly typed role
      const success = await registerAuth(
        data.name, 
        data.email, 
        data.password,
        data.role,
        questionResponses
      );
      
      if (success) {
        navigate('/auth-confirmation');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-600">
              {error}
            </div>
          )}
          
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
                      onValueChange={(value) => {
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
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
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
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-shop-purple hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
