
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp,
  Calendar,
  FileText,
  Download,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DeliveryEarningsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (userRole !== 'delivery') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'delivery') {
    return null;
  }

  const earningsData = [
    { name: 'Mon', earnings: 85 },
    { name: 'Tue', earnings: 110 },
    { name: 'Wed', earnings: 95 },
    { name: 'Thu', earnings: 125 },
    { name: 'Fri', earnings: 150 },
    { name: 'Sat', earnings: 180 },
    { name: 'Sun', earnings: 95 },
  ];
  
  const paymentHistory = [
    { id: '1', date: '2025-05-01', amount: 640.50, status: 'paid', deliveries: 32 },
    { id: '2', date: '2025-04-16', amount: 580.25, status: 'paid', deliveries: 28 },
    { id: '3', date: '2025-04-01', amount: 720.75, status: 'paid', deliveries: 36 },
    { id: '4', date: '2025-03-16', amount: 510.00, status: 'paid', deliveries: 25 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-gray-600 mt-1">Track your earnings and payment history</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 md:col-span-1">
          <h3 className="text-lg font-medium mb-4">Current Pay Period</h3>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-600">May 1 - May 15, 2025</p>
              <p className="text-2xl font-bold mt-1">$840.50</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deliveries Completed:</span>
              <span className="font-medium">42</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Pay:</span>
              <span className="font-medium">$630.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tips:</span>
              <span className="font-medium">$210.50</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bonuses:</span>
              <span className="font-medium">$0.00</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last period</span>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        </Card>
        
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Weekly Earnings</h3>
            <Select defaultValue="thisWeek">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={earningsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Earnings']}
                />
                <Legend />
                <Bar dataKey="earnings" name="Daily Earnings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-medium mb-4">Payment History</h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Deliveries</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.deliveries}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Direct Deposit</p>
                <p className="text-sm text-gray-600">Bank of America ****1234</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Payment Schedule</h4>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Frequency:</span>
              <span>Bi-weekly</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Next Payment:</span>
              <span>May 16, 2025</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Processing Time:</span>
              <span>1-2 business days</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" className="w-full">
              Update Payment Details
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
