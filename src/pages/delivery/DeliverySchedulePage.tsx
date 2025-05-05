
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock,
  Save,
  CheckCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DeliverySchedulePage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availabilityByDay, setAvailabilityByDay] = useState({
    monday: { morning: true, afternoon: true, evening: false },
    tuesday: { morning: true, afternoon: true, evening: false },
    wednesday: { morning: true, afternoon: true, evening: false },
    thursday: { morning: true, afternoon: true, evening: false },
    friday: { morning: true, afternoon: true, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  });
  
  React.useEffect(() => {
    if (userRole !== 'delivery') {
      navigate('/account');
    }
  }, [userRole, navigate]);
  
  if (!user || userRole !== 'delivery') {
    return null;
  }

  const handleSaveSchedule = () => {
    toast({
      title: "Schedule Saved",
      description: "Your availability has been updated successfully",
    });
  };

  const handleToggleAvailability = (day: string, time: string) => {
    setAvailabilityByDay(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [time]: !prev[day as keyof typeof prev][time as keyof typeof prev[keyof typeof prev]]
      }
    }));
  };

  const weeklySchedule = [
    { day: 'Monday', date: '2025-05-06', shifts: [{ time: '9:00 AM - 1:00 PM', orders: 5 }] },
    { day: 'Tuesday', date: '2025-05-07', shifts: [{ time: '9:00 AM - 1:00 PM', orders: 3 }] },
    { day: 'Wednesday', date: '2025-05-08', shifts: [{ time: '2:00 PM - 6:00 PM', orders: 4 }] },
    { day: 'Thursday', date: '2025-05-09', shifts: [{ time: '9:00 AM - 1:00 PM', orders: 2 }] },
    { day: 'Friday', date: '2025-05-10', shifts: [{ time: '9:00 AM - 1:00 PM', orders: 6 }] },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Schedule</h1>
        <p className="text-gray-600 mt-1">Manage your availability and schedule</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Calendar</h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">This Week's Schedule</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklySchedule.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{day.day}</TableCell>
                    <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                    <TableCell>{day.shifts.map(shift => shift.time).join(', ')}</TableCell>
                    <TableCell>{day.shifts.reduce((acc, shift) => acc + shift.orders, 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Export Schedule
              </Button>
            </div>
          </Card>
        </div>
        
        <div>
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Set Your Availability</h2>
              <Select defaultValue="recurring">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Schedule Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Recurring Weekly</SelectItem>
                  <SelectItem value="custom">Custom Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              {Object.entries(availabilityByDay).map(([day, times]) => (
                <div key={day} className="border rounded p-4">
                  <h3 className="font-medium capitalize mb-2">{day}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div 
                      className={`p-2 rounded cursor-pointer flex items-center justify-center ${
                        times.morning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={() => handleToggleAvailability(day, 'morning')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Morning</span>
                      {times.morning && <CheckCircle className="h-4 w-4 ml-1 text-green-600" />}
                    </div>
                    <div 
                      className={`p-2 rounded cursor-pointer flex items-center justify-center ${
                        times.afternoon ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={() => handleToggleAvailability(day, 'afternoon')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Afternoon</span>
                      {times.afternoon && <CheckCircle className="h-4 w-4 ml-1 text-green-600" />}
                    </div>
                    <div 
                      className={`p-2 rounded cursor-pointer flex items-center justify-center ${
                        times.evening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={() => handleToggleAvailability(day, 'evening')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Evening</span>
                      {times.evening && <CheckCircle className="h-4 w-4 ml-1 text-green-600" />}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button onClick={handleSaveSchedule} className="w-full mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Time Off Requests</h2>
            <div className="space-y-4">
              <p className="text-gray-600">Submit requests for time off or vacation days</p>
              <Select defaultValue="">
                <SelectTrigger>
                  <SelectValue placeholder="Request Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select Date
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select Date
                  </Button>
                </div>
              </div>
              
              <Button className="w-full mt-2">Submit Request</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
