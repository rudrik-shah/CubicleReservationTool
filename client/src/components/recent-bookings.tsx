import { useState } from 'react';
import { Booking } from '@/types';
import { formatDateShort } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading: boolean;
}

export function RecentBookings({ bookings, isLoading }: RecentBookingsProps) {
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancelBooking = async (bookingId: number) => {
    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await apiRequest('PATCH', `/api/bookings/${bookingId}/cancel`, {});
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-6 bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Your Recent Bookings</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 text-primary rounded-full border-2 border-t-transparent"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seat</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateShort(booking.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.seatId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-0 h-auto"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? (
                          <div className="animate-spin h-4 w-4 rounded-full border-2 border-t-transparent border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
