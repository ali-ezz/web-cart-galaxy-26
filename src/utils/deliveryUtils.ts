
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export interface TimeSlot {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DeliverySlot {
  id: string;
  date: Date;
  time: string;
  orderId: string | null;
  status: "available" | "booked" | "completed" | "unavailable";
}

// Fetch weekly schedule from the delivery_schedules table
export const fetchWeeklySchedule = async (userId: string): Promise<TimeSlot[]> => {
  try {
    // Query the delivery_schedules table
    const { data, error } = await supabase
      .from('delivery_schedules')
      .select('*')
      .eq('delivery_person_id', userId);
    
    if (error) {
      console.error("Error fetching weekly schedule:", error);
      return getDefaultWeeklySchedule();
    }
    
    if (!data || data.length === 0) {
      return getDefaultWeeklySchedule();
    }
    
    // Convert database format to TimeSlot format
    return data.map(item => ({
      id: item.id,
      day: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      available: item.available
    }));
  } catch (error) {
    console.error("Error fetching weekly schedule:", error);
    return getDefaultWeeklySchedule();
  }
};

// Save weekly schedule for a delivery person
export const saveWeeklySchedule = async (userId: string, schedule: TimeSlot[]): Promise<boolean> => {
  try {
    // First, delete existing entries
    const { error: deleteError } = await supabase
      .from('delivery_schedules')
      .delete()
      .eq('delivery_person_id', userId);
      
    if (deleteError) {
      console.error("Error deleting existing schedules:", deleteError);
      return false;
    }
    
    // Then, insert new entries
    const newEntries = schedule.map(slot => ({
      delivery_person_id: userId,
      day_of_week: slot.day,
      start_time: slot.startTime,
      end_time: slot.endTime,
      available: slot.available
    }));
    
    const { error: insertError } = await supabase
      .from('delivery_schedules')
      .insert(newEntries);
      
    if (insertError) {
      console.error("Error inserting new schedules:", insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving weekly schedule:", error);
    return false;
  }
};

// Fetch delivery slots for a specific date range
export const fetchDeliverySlots = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<DeliverySlot[]> => {
  try {
    // Format dates for the query
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    // Get delivery assignments for this person
    const { data: assignments, error: assignmentsError } = await supabase
      .from('delivery_assignments')
      .select('*, orders:order_id(*)')
      .eq('delivery_person_id', userId)
      .gte('created_at', formattedStartDate)
      .lte('created_at', formattedEndDate);
    
    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }
    
    // Get the user's schedule
    const schedule = await fetchWeeklySchedule(userId);
    
    // Generate all possible slots based on schedule
    const slots: DeliverySlot[] = [];
    
    for (let d = 0; d <= 13; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get slots for this day from schedule
      const daySlots = schedule.filter(slot => slot.day === dayOfWeek);
      
      if (daySlots.length > 0) {
        daySlots.forEach(slot => {
          if (slot.available) {
            // Create morning and afternoon slots
            const morningSlot: DeliverySlot = {
              id: `slot-${d}-${slot.id}-morning`,
              date: new Date(currentDate),
              time: `${slot.startTime} - ${getMiddleTime(slot.startTime, slot.endTime)}`,
              orderId: null,
              status: 'available'
            };
            
            const afternoonSlot: DeliverySlot = {
              id: `slot-${d}-${slot.id}-afternoon`,
              date: new Date(currentDate),
              time: `${getMiddleTime(slot.startTime, slot.endTime)} - ${slot.endTime}`,
              orderId: null,
              status: 'available'
            };
            
            slots.push(morningSlot, afternoonSlot);
          }
        });
      }
    }
    
    // Update slots with actual assignments
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        const assignmentDate = assignment.assigned_at ? new Date(assignment.assigned_at) : new Date();
        
        // Find matching slot for this assignment
        const matchingSlotIndex = slots.findIndex(slot => 
          isSameDay(slot.date, assignmentDate) && 
          assignment.assigned_at && timeInSlot(assignment.assigned_at, slot.time)
        );
        
        if (matchingSlotIndex >= 0) {
          slots[matchingSlotIndex].orderId = assignment.order_id;
          slots[matchingSlotIndex].status = assignment.status === 'delivered' 
            ? 'completed' 
            : 'booked';
        }
      });
    }
    
    return slots;
  } catch (error) {
    console.error("Error fetching delivery slots:", error);
    return [];
  }
};

// Default weekly schedule
const getDefaultWeeklySchedule = (): TimeSlot[] => [
  { id: '1-1', day: 1, startTime: '09:00', endTime: '17:00', available: true },
  { id: '1-2', day: 1, startTime: '18:00', endTime: '22:00', available: false },
  { id: '2-1', day: 2, startTime: '09:00', endTime: '17:00', available: true },
  { id: '2-2', day: 2, startTime: '18:00', endTime: '22:00', available: false },
  { id: '3-1', day: 3, startTime: '09:00', endTime: '17:00', available: true },
  { id: '3-2', day: 3, startTime: '18:00', endTime: '22:00', available: false },
  { id: '4-1', day: 4, startTime: '09:00', endTime: '17:00', available: true },
  { id: '4-2', day: 4, startTime: '18:00', endTime: '22:00', available: false },
  { id: '5-1', day: 5, startTime: '09:00', endTime: '17:00', available: true },
  { id: '5-2', day: 5, startTime: '18:00', endTime: '22:00', available: true },
  { id: '6-1', day: 6, startTime: '10:00', endTime: '18:00', available: true },
  { id: '7-1', day: 0, startTime: '10:00', endTime: '16:00', available: false },
];

// Helper function to get the middle time between start and end
const getMiddleTime = (startTime: string, endTime: string): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  const middleMinutes = Math.floor((startMinutes + endMinutes) / 2);
  const middleHour = Math.floor(middleMinutes / 60);
  const middleMinute = middleMinutes % 60;
  
  return `${middleHour.toString().padStart(2, '0')}:${middleMinute.toString().padStart(2, '0')}`;
};

// Check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Check if a timestamp falls within a time range string "XX:XX - YY:YY"
const timeInSlot = (timestamp: string, timeRange: string): boolean => {
  try {
    const [start, end] = timeRange.split(' - ');
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return timeStr >= start && timeStr <= end;
  } catch (error) {
    console.error("Error in timeInSlot:", error);
    return false;
  }
};
