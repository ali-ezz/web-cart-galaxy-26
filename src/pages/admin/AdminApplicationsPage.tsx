
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Truck, 
  Calendar,
  MapPin,
  UserCheck,
  Clock
} from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  user_email: string;
  role: string;
  status: string;
  created_at: string;
  question_responses: Record<string, any>;
}

export default function AdminApplicationsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  const { data: applications, isLoading, error } = useQuery<Application[]>({
    queryKey: ['adminApplications'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'get_role_applications'
        }
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && userRole === 'admin',
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'approve_application',
          application_id: applicationId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      toast({
        title: "Application Approved",
        description: "The user's application has been approved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      });
    }
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'reject_application',
          application_id: applicationId
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      toast({
        title: "Application Rejected",
        description: "The user's application has been rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    }
  });
  
  const handleApprove = (application: Application) => {
    approveApplicationMutation.mutate(application.id);
  };
  
  const handleReject = (application: Application) => {
    rejectApplicationMutation.mutate(application.id);
  };
  
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
  };
  
  const getPendingApplications = () => {
    return applications?.filter(app => app.status === 'pending') || [];
  };
  
  const getApprovedApplications = () => {
    return applications?.filter(app => app.status === 'approved') || [];
  };
  
  const getRejectedApplications = () => {
    return applications?.filter(app => app.status === 'rejected') || [];
  };
  
  if (!user || userRole !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-gray-600 mt-1">Loading applications...</p>
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
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-gray-600 mt-1">Error loading applications</p>
        </div>
        <Card className="p-6">
          <p className="text-red-500">Failed to load applications: {(error as Error).message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Role Applications</h1>
        <p className="text-gray-600 mt-1">Review seller and delivery applications</p>
      </div>
      
      <Tabs defaultValue="pending" className="mb-8">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {getPendingApplications().length > 0 && (
              <Badge variant="secondary" className="ml-2">{getPendingApplications().length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPendingApplications().length > 0 ? (
                  getPendingApplications().map(app => (
                    <TableRow key={app.id}>
                      <TableCell>{app.user_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {app.role === 'seller' ? (
                            <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                          ) : (
                            <Truck className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {app.role.charAt(0).toUpperCase() + app.role.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(app)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            {selectedApplication && (
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Application Details</DialogTitle>
                                  <DialogDescription>
                                    Review the application information below.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Email:</span>
                                    <span className="col-span-3">{selectedApplication.user_email}</span>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Role:</span>
                                    <span className="col-span-3 capitalize">{selectedApplication.role}</span>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-right text-sm font-medium">Applied:</span>
                                    <span className="col-span-3">{new Date(selectedApplication.created_at).toLocaleString()}</span>
                                  </div>
                                  
                                  {selectedApplication.question_responses && Object.entries(selectedApplication.question_responses).map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-4 items-center gap-4">
                                      <span className="text-right text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:</span>
                                      <span className="col-span-3">{value}</span>
                                    </div>
                                  ))}
                                </div>
                                <DialogFooter>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => {
                                      handleReject(selectedApplication);
                                    }}
                                    disabled={rejectApplicationMutation.isPending}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      handleApprove(selectedApplication);
                                    }}
                                    disabled={approveApplicationMutation.isPending}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleReject(app)}
                            disabled={rejectApplicationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApprove(app)}
                            disabled={approveApplicationMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No pending applications
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Approved On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getApprovedApplications().length > 0 ? (
                  getApprovedApplications().map(app => (
                    <TableRow key={app.id}>
                      <TableCell>{app.user_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {app.role === 'seller' ? (
                            <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                          ) : (
                            <Truck className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {app.role.charAt(0).toUpperCase() + app.role.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No approved applications
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Rejected On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getRejectedApplications().length > 0 ? (
                  getRejectedApplications().map(app => (
                    <TableRow key={app.id}>
                      <TableCell>{app.user_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {app.role === 'seller' ? (
                            <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                          ) : (
                            <Truck className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {app.role.charAt(0).toUpperCase() + app.role.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No rejected applications
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
