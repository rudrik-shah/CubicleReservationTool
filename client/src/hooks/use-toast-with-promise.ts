import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function useToastWithPromise() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const toastWithPromise = async <T>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Something went wrong.',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((err: any) => string);
    } = {}
  ): Promise<T | undefined> => {
    setIsLoading(true);
    
    const loadingToast = toast({
      title: loading,
      variant: 'default',
    });
    
    try {
      const data = await promise;
      
      toast({
        id: loadingToast.id,
        title: typeof success === 'function' ? success(data) : success,
        variant: 'default',
      });
      
      setIsLoading(false);
      return data;
    } catch (err: any) {
      toast({
        id: loadingToast.id,
        title: typeof error === 'function' ? error(err) : error,
        description: err.message,
        variant: 'destructive',
      });
      
      setIsLoading(false);
      return undefined;
    }
  };

  return { toastWithPromise, isLoading };
}
