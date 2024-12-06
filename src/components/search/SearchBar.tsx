import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlacesAutocomplete } from './PlacesAutocomplete';
import { getCurrentLocation, type Coordinates } from '@/lib/location';
import { useAPI } from '@/components/APILoadingProvider';

interface SearchBarProps {
  onSearch: (address: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const { toast } = useToast();
  const { isLoaded } = useAPI();

  useEffect(() => {
    const initializeLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        console.log('User location detected:', location);
      }
    };

    initializeLocation();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an address',
        variant: 'destructive',
      });
      return;
    }

    onSearch(address.trim());
  };

  if (!isLoaded) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="w-full h-10 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
          <div className="w-full sm:w-24 h-10 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row gap-2">
        <PlacesAutocomplete
          onSelect={setAddress}
          disabled={isLoading}
          userLocation={userLocation}
          className="w-full"
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Searching...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}