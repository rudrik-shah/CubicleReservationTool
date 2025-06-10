import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { RecentBookings } from '@/components/recent-bookings';
import { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cecIdSchema } from '@shared/schema';

const formSchema = z.object({
  cecId: z.string().min(2).max(20),
});

export default function MyBookings() {
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cecId, setCecId] = useState<string>(() => {
    // Try to get CEC ID from local storage
    return localStorage.getItem('cubicleBookCecId') || '';
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cecId: cecId || '',
    },
  });

  // Fetch user's bookings
  const {
    data: bookings = [],
    isLoading,
    refetch,
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

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setCecId(values.cecId);
    localStorage.setItem('cubicleBookCecId', values.cecId);
    refetch();
    
    toast({
      title: "CEC ID Updated",
      description: "Your bookings are being fetched.",
    });
  };

  useEffect(() => {
    // If cecId changes, update the form value
    form.setValue('cecId', cecId);
  }, [cecId, form]);

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
          title="My Bookings" 
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            {/* CEC ID Input */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">View Your Bookings</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-grow">
                    <FormField
                      control={form.control}
                      name="cecId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="cec-id">Your CEC ID</FormLabel>
                          <FormControl>
                            <Input
                              id="cec-id"
                              placeholder="Enter your alphabetic ID"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter your company ID to view your bookings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="md:mb-[23px]">
                    View Bookings
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Bookings List */}
            <RecentBookings 
              bookings={bookings as Booking[]} 
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
