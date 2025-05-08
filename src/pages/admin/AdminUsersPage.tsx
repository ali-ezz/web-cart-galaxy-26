
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, UserCheck, UserX, Edit, MoreHorizontal, Shield 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: string;
}

export default function AdminUsersPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/account');
    }
  }, [userRole, navigate]);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      try {
        console.log('Fetching admin users data...');
        const { data: authUsers, error: authError } = await supabase.functions.invoke('admin_functions', {
          body: {
            action: 'get_users'
          }
        });
        
        if (authError) {
          console.error('Error fetching users:', authError);
          setFetchError(authError.message || 'Failed to fetch users data');
          throw authError;
        }
        
        if (!authUsers) {
          console.warn('No users data returned');
          setFetchError('No users data returned from server');
          return [];
        }
        
        console.log(`Successfully fetched ${authUsers.length} users`);
        return authUsers;
      } catch (err: any) {
        console.error('Exception in fetchUsers:', err);
        setFetchError(err.message || 'An unknown error occurred when fetching users');
        throw err;
      }
    },
    enabled: !!user && userRole === 'admin',
    retry: 1,
  });

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`Updating user ${userId} role to ${newRole}...`);
      const { error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'update_user_role',
          user_id: userId,
          role: newRole
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
      
      refetch();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };
  
  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || userRole !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Loading users...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-shop-purple border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Error loading users</p>
        </div>
        <Card className="p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Failed to load users: {fetchError || (error as Error).message}
            </AlertDescription>
          </Alert>
          <div className="mt-2 text-sm text-gray-600">
            <p>This may be due to:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Edge function errors</li>
              <li>Database connection issues</li>
              <li>Authentication problems</li>
            </ul>
          </div>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and roles</p>
      </div>
      
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <Input 
            placeholder="Search by email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user: UserData) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {user.role === 'admin' && <Shield className="h-4 w-4 text-purple-500" />}
                        {user.role === 'seller' && <UserCheck className="h-4 w-4 text-blue-500" />}
                        {user.role === 'delivery' && <User className="h-4 w-4 text-green-500" />}
                        {user.role === 'customer' && <User className="h-4 w-4 text-gray-500" />}
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'banned' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Set as Admin</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, 'seller')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Set as Seller</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, 'delivery')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Set as Delivery</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, 'customer')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Set as Customer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    {users && users.length === 0 ? "No users found" : "No matching users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
