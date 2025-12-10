import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { CalendarDays, Clock, Building2, FileText, CheckCircle } from 'lucide-react';
import collegeLogo from '@/assets/college-logo.png';


const halls = [
  { id: 'Main Auditorium Hall', name: 'Main Auditorium Hall' },
  { id: 'Vedhanayagam Hall', name: 'Vedhanayagam Hall' },
  { id: 'ECE Seminar Hall', name: 'ECE Seminar Hall' },
  { id: 'SF Seminar Hall', name: 'SF Seminar Hall' },
];

const morningSlots = [
  '8:30 - 9:00', '9:00 - 9:30', '9:30 - 10:00', '10:00 - 10:30',
  '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30',
];

const afternoonSlots = [
  '1:00 - 1:30', '1:30 - 2:00', '2:00 - 2:30', '2:30 - 3:00',
  '3:00 - 3:30', '3:30 - 4:00', '4:00 - 4:30', 'After 4:30',
];

interface Booking {
  id: string;
  hall: string;
  booking_date: string;
  slots: string[];
  purpose: string;
}

export default function HallBooking() {
  const [selectedHall, setSelectedHall] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  // Fetch existing bookings
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await apiService.getBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch availability when hall and date change
  useEffect(() => {
    if (selectedHall && selectedDate) {
      fetchAvailability();
    }
  }, [selectedHall, selectedDate]);

  const fetchAvailability = async () => {
    try {
      const data = await apiService.getAvailability(selectedHall, selectedDate);
      const booked = data.availableSlots
        ?.filter((s: { status: string }) => s.status === 'red')
        .map((s: { slot: string }) => s.slot) || [];
      setBookedSlots(booked);
      setSelectedSlots([]);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setBookedSlots([]);
    }
  };

  const handleSlotClick = (slot: string) => {
    if (bookedSlots.includes(slot)) return;
    
    setSelectedSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  const getSlotClass = (slot: string) => {
    if (bookedSlots.includes(slot)) return 'slot-booked cursor-not-allowed opacity-70';
    if (selectedSlots.includes(slot)) return 'slot-selected';
    return 'slot-available hover:scale-105 cursor-pointer';
  };

  const handleBookNow = async () => {
    if (!selectedHall || !selectedDate || !purpose || selectedSlots.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all fields and select at least one time slot.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiService.createBooking({
        hall: selectedHall,
        date: selectedDate,
        slots: selectedSlots,
        purpose,
      });

      toast({
        title: 'Booking Successful!',
        description: `${selectedHall} booked for ${selectedSlots.length} slot(s).`,
      });

      // Refresh bookings and availability
      await fetchBookings();
      await fetchAvailability();
      
      // Reset form
      setSelectedSlots([]);
      setPurpose('');
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'Failed to create booking.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await apiService.deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      if (selectedHall && selectedDate) {
        await fetchAvailability();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <Card className="glass-card mb-6">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img src={collegeLogo} alt="BIT" className="h-14" />
              <span className="text-2xl font-bold text-primary">BIT</span>
            </div>
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              <CalendarDays className="h-6 w-6" />
              Hall Booking
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Booking Form */}
          <Card className="glass-card">
            <CardContent className="p-6 space-y-6">
              {/* Hall Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Select Hall
                </Label>
                <Select value={selectedHall} onValueChange={setSelectedHall}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a hall" />
                  </SelectTrigger>
                  <SelectContent>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Select Date
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                />
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Purpose
                </Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter the purpose of booking"
                />
              </div>

              {/* Time Slots */}
              {selectedHall && selectedDate && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Select Time Slots
                  </Label>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Morning Session</p>
                    <div className="flex flex-wrap gap-2">
                      {morningSlots.map((slot) => (
                        <Badge
                          key={slot}
                          variant="outline"
                          className={`px-3 py-1.5 transition-all ${getSlotClass(slot)}`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Afternoon Session</p>
                    <div className="flex flex-wrap gap-2">
                      {afternoonSlots.map((slot) => (
                        <Badge
                          key={slot}
                          variant="outline"
                          className={`px-3 py-1.5 transition-all ${getSlotClass(slot)}`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-xs pt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-success" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-destructive" />
                      <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-primary ring-2 ring-accent" />
                      <span>Selected</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBookNow}
                className="w-full"
                size="lg"
                disabled={!selectedHall || !selectedDate || !purpose || selectedSlots.length === 0 || isLoading}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {isLoading ? 'Booking...' : `Book Now (${selectedSlots.length} slots)`}
              </Button>
            </CardContent>
          </Card>

          {/* Your Bookings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Your Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                  <p className="text-sm">Your bookings will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {bookings.map((booking) => {
                    const bookingDate = new Date(booking.booking_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPastBooking = bookingDate < today;
                    
                    return (
                      <div
                        key={booking.id}
                        className="p-4 bg-secondary/50 rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm">{booking.hall}</h4>
                          {!isPastBooking && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.booking_date).toLocaleDateString('en-GB')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {booking.slots.map((slot) => (
                            <Badge key={slot} variant="secondary" className="text-xs">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Purpose: {booking.purpose}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
