
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const timeSlots = [
  { id: 'morning', name: 'Morning', hours: '8:00 AM - 12:00 PM' },
  { id: 'afternoon', name: 'Afternoon', hours: '12:00 PM - 4:00 PM' },
  { id: 'evening', name: 'Evening', hours: '4:00 PM - 8:00 PM' }
];

export default function DeliverySchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'week' | 'calendar'>('week');
  const [saving, setSaving] = useState(false);
  
  // Mock schedule data - in a real app, this would come from a database
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    Monday: { morning: true, afternoon: true, evening: false },
    Tuesday: { morning: true, afternoon: true, evening: false },
    Wednesday: { morning: true, afternoon: true, evening: false },
    Thursday: { morning: true, afternoon: true, evening: true },
    Friday: { morning: true, afternoon: true, evening: false },
    Saturday: { morning: false, afternoon: false, evening: false },
    Sunday: { morning: false, afternoon: false, evening: false },
  });

  const toggleAvailability = (day: string, slot: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [slot]: !prev[day as keyof typeof prev][slot as keyof typeof prev[keyof typeof prev]]
      }
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    
    try {
      // In a real app, you would save this to the database
      // await supabase.from('delivery_schedules').upsert({
      //   user_id: user?.id,
      //   schedule: weeklyAvailability,
      //   updated_at: new Date().toISOString()
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Schedule Updated",
        description: "Your availability has been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update your schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Delivery Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your availability and working hours</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Select value={view} onValueChange={(v) => setView(v as 'week' | 'calendar')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly View</SelectItem>
              <SelectItem value="calendar">Calendar View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {view === 'week' ? (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>Set your regular working hours for each day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {daysOfWeek.map((day) => (
                <div key={day} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">{day}</h3>
                    <Badge variant={
                      Object.values(weeklyAvailability[day as keyof typeof weeklyAvailability]).some(Boolean) 
                        ? 'default' 
                        : 'outline'
                    }>
                      {Object.values(weeklyAvailability[day as keyof typeof weeklyAvailability]).some(Boolean) 
                        ? 'Available' 
                        : 'Unavailable'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {timeSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center space-x-4 border rounded-md p-3">
                        <div className="flex-grow">
                          <p className="font-medium">{slot.name}</p>
                          <p className="text-sm text-gray-500">{slot.hours}</p>
                        </div>
                        <Switch
                          id={`${day}-${slot.id}`}
                          checked={weeklyAvailability[day as keyof typeof weeklyAvailability][slot.id as keyof typeof weeklyAvailability[keyof typeof weeklyAvailability]]}
                          onCheckedChange={() => toggleAvailability(day, slot.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveSchedule}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Set your availability for specific dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-grow">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
              
              {date && (
                <div className="w-full md:w-1/2 border rounded-md p-4">
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="mr-2 h-5 w-5 text-shop-purple" />
                    <h3 className="font-medium">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {timeSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{slot.name}</p>
                            <p className="text-sm text-gray-500">{slot.hours}</p>
                          </div>
                        </div>
                        
                        <Switch
                          id={`date-${date.toISOString()}-${slot.id}`}
                          checked={weeklyAvailability[date.toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof weeklyAvailability][slot.id as keyof typeof weeklyAvailability[keyof typeof weeklyAvailability]]}
                          onCheckedChange={() => toggleAvailability(date.toLocaleDateString('en-US', { weekday: 'long' }), slot.id)}
                        />
                      </div>
                    ))}
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={saveSchedule}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Availability'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
