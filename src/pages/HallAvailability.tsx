import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { CalendarCheck, Clock } from 'lucide-react';
import collegeLogo from '@/assets/college-logo.png';

const halls = [
  { name: 'Main Auditorium Hall' },
  { name: 'Vedhanayagam Hall' },
  { name: 'ECE Seminar Hall' },
  { name: 'SF Seminar Hall' },
];

const slots = [
  '8:30 - 9:00', '9:00 - 9:30', '9:30 - 10:00', '10:00 - 10:30',
  '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30',
  '1:00 - 1:30', '1:30 - 2:00', '2:00 - 2:30', '2:30 - 3:00',
  '3:00 - 3:30', '3:30 - 4:00', '4:00 - 4:30', 'After 4:30',
];

interface SlotAvailability {
  hall: string;
  availableSlots: { slot: string; status: 'green' | 'red' }[];
}

export default function HallAvailability() {
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<SlotAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchAllAvailability = async () => {
      setIsLoading(true);
      try {
        const availabilityPromises = halls.map(async (hall) => {
          try {
            const data = await apiService.getAvailability(hall.name, selectedDate);
            const bookedSlots = data.bookedSlots || [];
            return {
              hall: hall.name,
              availableSlots: slots.map(s => ({ 
                slot: s, 
                status: bookedSlots.includes(s) ? 'red' as const : 'green' as const 
              })),
            };
          } catch {
            return {
              hall: hall.name,
              availableSlots: slots.map(s => ({ slot: s, status: 'green' as const })),
            };
          }
        });

        const results = await Promise.all(availabilityPromises);
        setAvailability(results);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAvailability();
  }, [selectedDate]);

  const getSlotStatus = (hallName: string, slot: string): 'green' | 'red' => {
    const hallData = availability.find((h) => h.hall === hallName);
    const slotData = hallData?.availableSlots.find((s) => s.slot === slot);
    return slotData?.status || 'green';
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <Card className="glass-card mb-6">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img src={collegeLogo} alt="BIT" className="h-14" />
              <span className="text-2xl font-bold text-primary">BIT</span>
            </div>
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              <CalendarCheck className="h-6 w-6" />
              Hall Availability
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Date Picker */}
        <Card className="glass-card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Select Date to Check Availability
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="max-w-xs"
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive" />
                  <span>Booked</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Table */}
        {selectedDate && (
        <Card className="glass-card overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">
                  Loading availability...
                </div>
              ) : (
                <div className="overflow-x-auto bg-background rounded-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="p-3 text-left font-semibold border-r border-primary-foreground/20 sticky left-0 bg-primary z-20 min-w-[180px]">
                          Hall Name
                        </th>
                        {slots.map((slot) => (
                          <th
                            key={slot}
                            className="p-2 text-center text-xs font-medium whitespace-nowrap border-r border-primary-foreground/20 last:border-r-0"
                          >
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {halls.map((hall, idx) => (
                        <tr
                          key={hall.name}
                          className={`${idx % 2 === 0 ? 'bg-secondary' : 'bg-secondary/50'} hover:bg-secondary/70 transition-colors`}
                        >
                          <td className={`p-3 font-medium text-sm border-r border-border sticky left-0 z-20 min-w-[180px] ${idx % 2 === 0 ? 'bg-secondary' : 'bg-secondary/50'}`}>
                            {hall.name}
                          </td>
                          {slots.map((slot) => {
                            const status = getSlotStatus(hall.name, slot);
                            return (
                              <td key={slot} className={`p-1 text-center border-r border-border last:border-r-0 ${idx % 2 === 0 ? 'bg-secondary' : 'bg-secondary/50'}`}>
                                <div
                                  className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                    status === 'green'
                                      ? 'bg-success/20 text-success hover:bg-success/30'
                                      : 'bg-destructive/20 text-destructive'
                                  }`}
                                >
                                  {status === 'green' ? '✓' : '✕'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedDate && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CalendarCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Date</h3>
              <p className="text-sm">Choose a date above to view hall availability</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
