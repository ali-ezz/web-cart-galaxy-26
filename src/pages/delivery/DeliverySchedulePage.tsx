
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Save,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TimeSlot, DeliverySlot, fetchWeeklySchedule, saveWeeklySchedule, fetchDeliverySlots } from "@/utils/deliveryUtils";

export default function DeliverySchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Weekly schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([]);
  
  // Delivery slots state
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  
  // Fetch weekly schedule and delivery slots on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setIsDataLoading(true);
      try {
        // Fetch weekly schedule
        const schedule = await fetchWeeklySchedule(user.id);
        setWeeklySchedule(schedule);
        
        // Fetch delivery slots for the current week
        const slots = await fetchDeliverySlots(
          user.id,
          currentWeekStart,
          addDays(currentWeekStart, 13) // Two weeks of data
        );
        setDeliverySlots(slots);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, currentWeekStart, toast]);
  
  // Toggle availability for a time slot
  const toggleAvailability = (slotId: string) => {
    setWeeklySchedule(prev => 
      prev.map(slot => 
        slot.id === slotId ? { ...slot, available: !slot.available } : slot
      )
    );
  };
  
  // Generate an array of days for the current week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(currentWeekStart, i);
  });
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };
  
  // Save the weekly schedule
  const saveSchedule = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your schedule.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await saveWeeklySchedule(user.id, weeklySchedule);
      
      if (success) {
        toast({
          title: "Schedule Saved",
          description: "Your availability schedule has been updated successfully.",
        });
      } else {
        throw new Error("Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Save Failed",
        description: "There was a problem saving your schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Refresh the delivery slots
  const refreshDeliverySlots = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const slots = await fetchDeliverySlots(
        user.id,
        currentWeekStart,
        addDays(currentWeekStart, 13)
      );
      setDeliverySlots(slots);
      
      toast({
        title: "Data Refreshed",
        description: "Your delivery schedule has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh delivery data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get delivery slots for a specific date
  const getSlotsForDate = (date: Date) => {
    return deliverySlots.filter(slot => isSameDay(slot.date, date));
  };
  
  // Get the day's slots for the weekly schedule view
  const getDaySlotsForWeekly = (dayNumber: number) => {
    return weeklySchedule.filter(slot => slot.day === dayNumber);
  };
  
  // Format day name for display
  const formatDayName = (date: Date) => {
    return format(date, 'EEE');
  };

  // Show loading state if data is still loading
  if (isDataLoading && !weeklySchedule.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center my-20">
          <Loader2 className="h-12 w-12 animate-spin text-shop-purple mb-4" />
          <h2 className="text-xl font-semibold">Loading Schedule</h2>
          <p className="text-gray-500 mt-2">Please wait while we load your delivery schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Delivery Schedule</h1>
        <p className="text-gray-600 mt-1">Manage your delivery availability and view scheduled deliveries</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Availability Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Availability</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousWeek}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToNextWeek}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center">
                    <p className="text-sm font-medium">{formatDayName(day)}</p>
                    <p className={cn(
                      "text-xs rounded-full w-6 h-6 flex items-center justify-center mx-auto mt-1",
                      isSameDay(day, today) && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                {/* Monday to Sunday slots */}
                {weekDays.map((day, dayIndex) => {
                  const dayNumber = day.getDay(); // 0 for Sunday, 1 for Monday, etc.
                  const daySlots = getDaySlotsForWeekly(dayNumber);
                  
                  return (
                    <div key={dayIndex} className="border-t pt-4 first:border-0 first:pt-0">
                      <p className="text-sm font-medium mb-3">{format(day, 'EEEE')}</p>
                      
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No time slots defined</p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map((slot) => (
                            <div key={slot.id} className="flex items-center space-x-3">
                              <Checkbox 
                                id={`slot-${slot.id}`} 
                                checked={slot.available}
                                onCheckedChange={() => toggleAvailability(slot.id)}
                              />
                              <Label htmlFor={`slot-${slot.id}`} className="flex justify-between items-center w-full text-sm">
                                <span>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <Badge variant={slot.available ? "default" : "outline"}>
                                  {slot.available ? "Available" : "Unavailable"}
                                </Badge>
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={saveSchedule} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Schedule
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Daily Schedule Section */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Daily Schedule</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={refreshDeliverySlots}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : getSlotsForDate(selectedDate).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No delivery slots for this day</p>
                  </div>
                ) : (
                  getSlotsForDate(selectedDate).map((slot) => (
                    <div key={slot.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm font-medium">{slot.time}</span>
                        </div>
                        <Badge 
                          variant={
                            slot.status === 'booked' ? "default" : 
                            slot.status === 'completed' ? "secondary" : 
                            slot.status === 'available' ? "outline" : 
                            "secondary"
                          }
                          className={
                            slot.status === 'unavailable' ? "bg-gray-200 text-gray-700" : ""
                          }
                        >
                          {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                        </Badge>
                      </div>
                      {slot.orderId && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Order: {slot.orderId}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Select a day in the weekly calendar to view your scheduled deliveries.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mt-6">
                {weekDays.map((day, index) => (
                  <Button
                    key={index}
                    variant={isSameDay(day, selectedDate) ? "default" : "outline"}
                    className="p-0 h-10 w-full"
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs">{formatDayName(day)}</span>
                      <span className={cn(
                        "text-xs",
                        isSameDay(day, today) && !isSameDay(day, selectedDate) && "text-primary font-bold"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
