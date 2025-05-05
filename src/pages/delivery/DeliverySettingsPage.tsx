import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  PhoneIcon, 
  MapPin,
  User,
  Bike,
  Car,
  Truck as TruckIcon,
  Save
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeliverySettings {
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  vehicle_type: string;
  vehicle_info: string;
  delivery_radius: string;
  delivery_notes: string;
}

export default function DeliverySettingsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const form = useForm<DeliverySettings>({
    defaultValues: {
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      vehicle_type: 'car',
      vehicle_info: '',
      delivery_radius: '10',
      delivery_notes: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    if (userRole !== 'delivery') {
      navigate('/account');
    }
    
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Extract profile data
          const settings = {
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            postal_code: data.postal_code || '',
            vehicle_type: data.question_responses?.vehicle_type || 'car',
            vehicle_info: data.question_responses?.vehicle_info || '',
            delivery_radius: data.question_responses?.delivery_radius || '10',
            delivery_notes: data.question_responses?.delivery_notes || ''
          };
          
          form.reset(settings);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load delivery settings',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userRole, navigate, user, toast, form]);
  
  const onSubmit = async (data: DeliverySettings) => {
    if (!user?.id) return;
    
    try {
      // Update profile with basic info
      const profileUpdate = {
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        // Keep delivery-specific data in question_responses
        question_responses: {
          vehicle_type: data.vehicle_type,
          vehicle_info: data.vehicle_info,
          delivery_radius: data.delivery_radius,
          delivery_notes: data.delivery_notes
        }
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Settings Updated',
        description: 'Your delivery settings have been saved successfully',
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteAccount = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Account Deleted',
        description: 'Your account has been deleted. You will be redirected to the homepage.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive'
      });
    }
    setIsDeleteDialogOpen(false);
  };
  
  if (!user || userRole !== 'delivery') {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Delivery Settings</h1>
          <p className="text-gray-600 mt-1">Loading your settings...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-shop-purple border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Settings</h1>
        <p className="text-gray-600 mt-1">Configure your delivery account</p>
      </div>
      
      <Card className="p-6 mb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="mb-4">
              <TabsList>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="delivery">Delivery Preferences</TabsTrigger>
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 self-center" />
                            <Input {...field} disabled={!isEditing} placeholder="Enter your phone number" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2 self-center" />
                            <Input {...field} disabled={!isEditing} placeholder="Street address" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} placeholder="State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} placeholder="Postal code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="delivery" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="delivery_radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Radius (miles)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing} 
                            type="number" 
                            placeholder="10" 
                          />
                        </FormControl>
                        <FormDescription>Maximum distance you're willing to travel for deliveries</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="delivery_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            disabled={!isEditing}
                            placeholder="Any additional information about your delivery preferences"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="vehicle" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select 
                          disabled={!isEditing} 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bicycle">
                              <div className="flex items-center">
                                <Bike className="h-4 w-4 mr-2" />
                                <span>Bicycle</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="motorcycle">
                              <div className="flex items-center">
                                <Bike className="h-4 w-4 mr-2" />
                                <span>Motorcycle</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="car">
                              <div className="flex items-center">
                                <Car className="h-4 w-4 mr-2" />
                                <span>Car</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="van">
                              <div className="flex items-center">
                                <TruckIcon className="h-4 w-4 mr-2" />
                                <span>Van</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="truck">
                              <div className="flex items-center">
                                <TruckIcon className="h-4 w-4 mr-2" />
                                <span>Truck</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vehicle_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Details</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing} 
                            placeholder="Year, Make, Model, Color" 
                          />
                        </FormControl>
                        <FormDescription>Information to help customers identify you</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-6">
              {isEditing ? (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Settings
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Delete Account</h3>
            <p className="text-sm text-gray-600">
              Permanently delete your delivery account and all associated data
            </p>
          </div>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Yes, Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
