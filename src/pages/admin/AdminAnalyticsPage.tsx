
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  ShoppingBag,
  Users,
  Package
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  salesData: {
    day: string;
    amount: number;
    orders: number;
  }[];
  categorySales: {
    name: string;
    value: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    sales: number;
  }[];
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueTrend: number;
    ordersTrend: number;
    customersTrend: number;
    productsTrend: number;
  };
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

export default function AdminAnalyticsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7days');
  
  const { data: analyticsData, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['adminAnalytics', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin_functions', {
        body: {
          action: 'get_analytics',
          timeRange
        }
      });
      
      if (error) throw error;
      return data || {
        salesData: [],
        categorySales: [],
        topProducts: [],
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          revenueTrend: 0,
          ordersTrend: 0,
          customersTrend: 0,
          productsTrend: 0
        }
      };
    },
    enabled: !!user && userRole === 'admin',
  });
  
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };
  
  if (!user || userRole !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">Loading analytics data...</p>
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">Error loading analytics</p>
        </div>
        <Card className="p-6">
          <p className="text-red-500">Failed to load analytics: {(error as Error).message}</p>
        </Card>
      </div>
    );
  }

  const { metrics, salesData, categorySales, topProducts } = analyticsData || {
    metrics: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      revenueTrend: 0,
      ordersTrend: 0,
      customersTrend: 0,
      productsTrend: 0
    },
    salesData: [],
    categorySales: [],
    topProducts: []
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and trends</p>
        </div>
        
        <div className="flex space-x-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 3 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1">${metrics.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className={`p-2 rounded-full ${metrics.revenueTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-5 w-5 ${metrics.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {metrics.revenueTrend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
            )}
            <p className={`text-sm ${metrics.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(metrics.revenueTrend)}% from previous period
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.totalOrders}</h3>
            </div>
            <div className={`p-2 rounded-full ${metrics.ordersTrend >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <ShoppingBag className={`h-5 w-5 ${metrics.ordersTrend >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {metrics.ordersTrend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
            )}
            <p className={`text-sm ${metrics.ordersTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(metrics.ordersTrend)}% from previous period
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.totalCustomers}</h3>
            </div>
            <div className={`p-2 rounded-full ${metrics.customersTrend >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
              <Users className={`h-5 w-5 ${metrics.customersTrend >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {metrics.customersTrend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
            )}
            <p className={`text-sm ${metrics.customersTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(metrics.customersTrend)}% from previous period
            </p>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.totalProducts}</h3>
            </div>
            <div className={`p-2 rounded-full ${metrics.productsTrend >= 0 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Package className={`h-5 w-5 ${metrics.productsTrend >= 0 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {metrics.productsTrend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
            )}
            <p className={`text-sm ${metrics.productsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(metrics.productsTrend)}% from previous period
            </p>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="sales" className="mb-8">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Sales Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="amount" name="Revenue ($)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Sales by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
