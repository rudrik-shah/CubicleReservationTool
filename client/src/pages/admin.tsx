import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { DateSelector } from '@/components/date-selector';
import { getTodayISO, formatDateToDisplay, formatDateShort } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking, Seat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  
  // Fetch seats for the selected date
  const { 
    data: seats = [], 
    isLoading: isLoadingSeats
  } = useQuery({
    queryKey: [`/api/seats?date=${selectedDate}`],
  });
  
  // Calculate stats
  const totalSeats = (seats as Seat[]).length;
  const reservedSeats = (seats as Seat[]).filter((seat: Seat) => seat.status === 'reserved').length;
  const availableSeats = totalSeats - reservedSeats;
  const occupancyRate = totalSeats > 0 ? Math.round((reservedSeats / totalSeats) * 100) : 0;

  // Fetch all bookings for the date
  const {
    data: activeBookings = [],
    isLoading: isLoadingBookings
  } = useQuery({
    queryKey: [`/api/bookings?date=${selectedDate}&status=active`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/bookings?date=${selectedDate}&status=active`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to fetch bookings');
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`md:block ${isMobileMenuOpen ? 'block' : 'hidden'} md:static fixed inset-0 z-50 bg-white`}>
        <Sidebar />
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Admin Dashboard" 
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            {/* Date Selection */}
            <DateSelector 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              isLoading={isLoadingSeats || isLoadingBookings}
            />
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Seats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSeats}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Reserved Seats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reservedSeats}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Available Seats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{availableSeats}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Occupancy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupancyRate}%</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Active Reservations */}
            <Card>
              <CardHeader>
                <CardTitle>Active Reservations for {formatDateToDisplay(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 text-primary rounded-full border-2 border-t-transparent"></div>
                  </div>
                ) : activeBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No reservations for this date.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat ID</TableHead>
                        <TableHead>CEC ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reservation Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(activeBookings as any[]).map((booking) => (
                        <TableRow key={booking.seatId}>
                          <TableCell className="font-medium">{booking.seatId}</TableCell>
                          <TableCell>{booking.cecId}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(booking.createdAt).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
