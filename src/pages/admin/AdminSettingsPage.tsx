
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

interface StoreSettings {
  store_name: string;
  contact_email: string;
  support_phone: string;
  address: string;
  shipping_policy: string;
  return_policy: string;
  terms_conditions: string;
  privacy_policy: string;
  maintenance_mode: boolean;
  enable_seller_applications: boolean;
  enable_delivery_applications: boolean;
}

export default function AdminSettingsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const { data: settings, isLoading, error, refetch } = useQuery<StoreSettings>({
    queryKey: ['storeSettings'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'get_store_settings'
        }
      });
      
      if (error) throw error;
      return data || {
        store_name: 'E-Commerce Store',
        contact_email: '',
        support_phone: '',
        address: '',
        shipping_policy: '',
        return_policy: '',
        terms_conditions: '',
        privacy_policy: '',
        maintenance_mode: false,
        enable_seller_applications: true,
        enable_delivery_applications: true
      };
    },
    enabled: !!user && userRole === 'admin',
  });
  
  const form = useForm<StoreSettings>({
    defaultValues: {
      store_name: '',
      contact_email: '',
      support_phone: '',
      address: '',
      shipping_policy: '',
      return_policy: '',
      terms_conditions: '',
      privacy_policy: '',
      maintenance_mode: false,
      enable_seller_applications: true,
      enable_delivery_applications: true
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: StoreSettings) => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'update_store_settings',
          settings: updatedSettings
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Store settings have been successfully updated",
      });
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: StoreSettings) => {
    updateSettingsMutation.mutate(data);
  };
  
  if (!user || userRole !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Store Settings</h1>
          <p className="text-gray-600 mt-1">Loading settings...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-shop-purple border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Store Settings</h1>
          <p className="text-gray-600 mt-1">Error loading settings</p>
        </div>
        <Card className="p-6">
          <p className="text-red-500">Failed to load settings: {(error as Error).message}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-gray-600 mt-1">Configure store settings and policies</p>
      </div>
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="general" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="store_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormDescription>
                          The name of your online store
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} type="email" />
                        </FormControl>
                        <FormDescription>
                          Public email address for customer inquiries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="support_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Phone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormDescription>
                          Customer support phone number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormDescription>
                          Physical address of your business
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="policies">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="shipping_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Policy</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="return_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Policy</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="terms_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="privacy_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy Policy</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} rows={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="applications">
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="enable_seller_applications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Seller Applications</FormLabel>
                            <FormDescription>
                              Allow users to apply to become sellers on your platform
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="enable_delivery_applications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Delivery Applications</FormLabel>
                            <FormDescription>
                              Allow users to apply to become delivery personnel
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="maintenance">
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="maintenance_mode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 border-yellow-200 bg-yellow-50">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                              <FormLabel className="text-base font-semibold">Maintenance Mode</FormLabel>
                            </div>
                            <FormDescription>
                              When enabled, the store will be unavailable to regular users and display a maintenance message
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 flex justify-end">
              {isEditing ? (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      form.reset(settings);
                    }}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateSettingsMutation.isPending || !form.formState.isDirty}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Settings
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
