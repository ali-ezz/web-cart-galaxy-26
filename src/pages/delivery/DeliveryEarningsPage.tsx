
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Calendar, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryEarning {
  id: string;
  date: string;
  order_id: string;
  amount: number;
  status: string;
}

export default function DeliveryEarningsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("current");
  
  const getCurrentPeriod = () => {
    if (period === "current") {
      return {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
        label: format(new Date(), 'MMMM yyyy')
      };
    } else if (period === "previous") {
      const previousMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth),
        label: format(previousMonth, 'MMMM yyyy')
      };
    } else {
      const twoMonthsAgo = subMonths(new Date(), 2);
      return {
        start: startOfMonth(twoMonthsAgo),
        end: endOfMonth(twoMonthsAgo),
        label: format(twoMonthsAgo, 'MMMM yyyy')
      };
    }
  };
  
  const selectedPeriod = getCurrentPeriod();
  
  // Mock data for earnings - in a real app this would come from your API
  const { data: earnings, isLoading, error } = useQuery({
    queryKey: ['deliveryEarnings', user?.id, period],
    queryFn: async () => {
      try {
        // This would be a real API call in a production app
        // For this demo, we'll return mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data
        const numberOfDays = 30;
        const mockEarnings: DeliveryEarning[] = Array.from({ length: 15 }, (_, i) => {
          const day = Math.floor(Math.random() * numberOfDays) + 1;
          const date = new Date(2025, 4, day);
          return {
            id: `earn-${i}`,
            date: format(date, 'yyyy-MM-dd'),
            order_id: `ord-${Math.floor(Math.random() * 10000)}`,
            amount: Math.round(Math.random() * 30) + 10,
            status: Math.random() > 0.1 ? 'paid' : 'pending'
          };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return mockEarnings;
      } catch (err: any) {
        console.error("Error fetching earnings:", err);
        throw new Error(err.message || "Failed to load earnings data");
      }
    },
    enabled: !!user?.id,
  });
  
  // Calculate summary statistics
  const calculateSummary = () => {
    if (!earnings || earnings.length === 0) {
      return { total: 0, count: 0, average: 0 };
    }
    
    const total = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const count = earnings.length;
    const average = total / count;
    
    return { total, count, average: parseFloat(average.toFixed(2)) };
  };
  
  const summary = calculateSummary();
  
  // Prepare chart data - aggregate by date
  const prepareChartData = () => {
    if (!earnings || earnings.length === 0) return [];
    
    const dateMap: { [key: string]: number } = {};
    earnings.forEach(earning => {
      if (dateMap[earning.date]) {
        dateMap[earning.date] += earning.amount;
      } else {
        dateMap[earning.date] = earning.amount;
      }
    });
    
    return Object.entries(dateMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const chartData = prepareChartData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-gray-600 mt-1">View your delivery earnings</p>
        </div>
        <div className="w-48">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="previous">Last Month</SelectItem>
              <SelectItem value="twoMonthsAgo">Two Months Ago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Period Banner */}
      <Card className="mb-8 bg-blue-50 border-blue-100">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            <span className="font-medium">Viewing earnings for: {selectedPeriod.label}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">
                ${summary.total.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {summary.count}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Per Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">
                ${summary.average.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Earnings Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="h-72 flex items-center justify-center text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Error loading chart data</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500">
              <p>No earnings data available for this period</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Earnings']} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Earnings Details */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading earnings data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Error loading earnings. Please try again.</p>
              <Button 
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : !earnings || earnings.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No earnings found</h3>
              <p className="text-gray-500 mb-4">
                You don't have any earnings recorded for this period.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      {format(new Date(earning.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {earning.order_id}
                    </TableCell>
                    <TableCell>
                      ${earning.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        earning.status === 'paid' ? 
                        'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {earning.status.toUpperCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
