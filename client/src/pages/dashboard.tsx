import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Seat, ReservationFormData, Booking } from '@/types';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SeatMap } from '@/components/ui/seat-map';
import { ReservationForm } from '@/components/reservation-form';
import { RecentBookings } from '@/components/recent-bookings';
import { DateSelector } from '@/components/date-selector';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { formatDateToISO, getTodayISO, formatDateToDisplay } from '@/lib/utils/date';

export default function Dashboard() {
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [cecId, setCecId] = useState<string>('');

  // Fetch seats for the selected date
  const { 
    data: seats = [], 
    isLoading: isLoadingSeats,
    isError: isSeatsError,
    refetch: refetchSeats
  } = useQuery({
    queryKey: [`/api/seats?date=${selectedDate}`],
    staleTime: 60000, // 1 minute
  });

  // Fetch user's bookings
  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['/api/bookings', cecId],
    queryFn: async () => {
      if (!cecId) return [];
      try {
        const res = await fetch(`/api/bookings/${cecId}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error('Failed to fetch bookings');
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!cecId,
  });

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedSeatId(null);
  };

  // Handle seat selection
  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatId(seatId);
  };

  // Create reservation mutation
  const { mutate: createReservation, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await apiRequest('POST', '/api/reservations', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Update local state
      setConfirmedBooking(data);
      setCecId(data.cecId || cecId);
      setShowConfirmation(true);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/seats?date=${selectedDate}`] });
      if (cecId) {
        queryClient.invalidateQueries({ queryKey: ['/api/bookings', cecId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Reservation Failed",
        description: error.message || "Could not create reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: ReservationFormData) => {
    createReservation(data);
    setCecId(data.cecId);
  };

  // Refetch data when component mounts
  useEffect(() => {
    refetchSeats();
    if (cecId) {
      refetchBookings();
    }
  }, []);

  // Refetch seats when selectedDate changes
  useEffect(() => {
    refetchSeats();
  }, [selectedDate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`md:block ${isMobileMenuOpen ? 'block' : 'hidden'} md:static fixed inset-0 z-50 bg-white`}>
        <Sidebar cecId={cecId} />
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
          title="Cubicle Reservation" 
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {/* Office Layout Reference Image */}
          <div className="mb-6 flex justify-center">
            <img src="/layout.png" alt="Office Layout Reference" className="max-w-full max-h-72 rounded shadow border" />
          </div>
          
          {/* Seat Reservation Tab */}
          <div className="max-w-4xl mx-auto">
            {/* Date Selection and Filters */}
            <DateSelector 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              isLoading={isLoadingSeats}
            />
            
            {/* Seat Map and Reservation Section */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Seat Map */}
              <div className="col-span-2 bg-white shadow rounded-lg p-4 overflow-auto">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Office Layout</h2>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    Selected date: <span className="font-medium text-gray-800">
                      {formatDateToDisplay(selectedDate)}
                    </span>
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-white border border-gray-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Reserved</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Selected</span>
                    </div>
                  </div>
                </div>
                
                {/* Interactive Seat Map */}
                <SeatMap 
                  seats={seats as Seat[]} 
                  selectedSeatId={selectedSeatId}
                  onSeatSelect={handleSeatSelect}
                  isLoading={isLoadingSeats}
                />
              </div>
              
              {/* Reservation Form */}
              <div className="col-span-1 mt-5 lg:mt-0">
                <ReservationForm 
                  selectedSeatId={selectedSeatId}
                  selectedDate={selectedDate}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isSubmitting}
                  defaultCecId={cecId}
                />
              </div>
            </div>
            
            {/* Recent Bookings */}
            <RecentBookings 
              bookings={bookings as Booking[]} 
              isLoading={isLoadingBookings}
            />
          </div>
        </main>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Reservation Confirmed"
        description={
          confirmedBooking && (
            <p className="text-sm text-gray-500">
              Your cubicle reservation has been confirmed. Seat <span className="font-semibold">{confirmedBooking.seatId}</span> is reserved for you on <span className="font-semibold">{formatDateToDisplay(confirmedBooking.date)}</span>.
            </p>
          )
        }
        actionLabel="Done"
      />
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isSubmitting} />
    </div>
  );
}
