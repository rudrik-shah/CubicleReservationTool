import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReservationFormData } from '@/types';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateToDisplay } from '@/lib/utils/date';

interface ReservationFormProps {
  selectedSeatId: string | null;
  selectedDate: string;
  onSubmit: (data: ReservationFormData) => void;
  isSubmitting: boolean;
  defaultCecId?: string;
}

// Form validation schema
const formSchema = z.object({
  cecId: z.string().min(2).max(20),
  notes: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the terms",
  }),
});

export function ReservationForm({ 
  selectedSeatId, 
  selectedDate, 
  onSubmit, 
  isSubmitting,
  defaultCecId = "" 
}: ReservationFormProps) {
  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cecId: defaultCecId,
      notes: "",
      terms: false,
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedSeatId) return;
    
    const formData: ReservationFormData = {
      cecId: values.cecId,
      seatId: selectedSeatId,
      date: selectedDate,
      notes: values.notes,
    };
    
    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 lg:h-full flex flex-col">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Make a Reservation</h2>
      
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Selected Seat:</span>
          <span className="text-sm font-bold text-primary">
            {selectedSeatId || "None selected"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-gray-500">Date:</span>
          <span className="text-sm text-gray-900">{formatDateToDisplay(selectedDate)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-gray-500">Status:</span>
          {selectedSeatId ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">Selected</span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Pending Selection</span>
          )}
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
          <FormField
            control={form.control}
            name="cecId"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel htmlFor="cec-id">CEC ID</FormLabel>
                <FormControl>
                  <Input
                    id="cec-id"
                    placeholder="Enter your alphabetic ID"
                    {...field}
                    required
                  />
                </FormControl>
                <FormDescription>
                  Your unique company ID for booking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel htmlFor="notes">Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements?"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="terms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="terms" className="font-medium text-gray-700">
                      I acknowledge that:
                    </FormLabel>
                    <FormDescription>
                      This reservation will automatically expire at the end of the day.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-auto pt-5">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedSeatId}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Reservation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
