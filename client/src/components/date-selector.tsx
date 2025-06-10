import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import { formatDateToISO, getTodayISO, getTomorrowISO, formatDateToDisplay } from '@/lib/utils/date';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading?: boolean;
}

export function DateSelector({ selectedDate, onDateChange, isLoading = false }: DateSelectorProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value);
  };

  const handleTodayBooking = () => {
    onDateChange(getTodayISO());
  };

  const handleTomorrowBooking = () => {
    onDateChange(getTomorrowISO());
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <label htmlFor="date-selection" className="block text-sm font-medium text-gray-700">
            Reservation Date
          </label>
          <input
            type="date"
            id="date-selection"
            className="mt-1 block w-full sm:w-64 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border p-2"
            value={selectedDate}
            onChange={handleDateChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            onClick={handleTodayBooking}
            disabled={isLoading}
            className="inline-flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button
            variant="secondary"
            onClick={handleTomorrowBooking}
            disabled={isLoading}
            className="inline-flex items-center"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Tomorrow
          </Button>
        </div>
      </div>
    </div>
  );
}
