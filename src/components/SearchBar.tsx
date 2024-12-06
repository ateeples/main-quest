import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlacesAutocomplete } from './search/PlacesAutocomplete';  // Check this path
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
      console.log('Initializing location detection...');
      try {
        const location = await getCurrentLocation();
        if (location) {
          console.log('User location detected:', location);
          setUserLocation(location);
        } else {
          console.log('No location detected');
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    if (isLoaded) {
      console.log('API loaded, getting location...');
      initializeLocation();
    } else {
      console.log('Waiting for API to load...');
    }
  }, [isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with address:', address);

    if (!address.trim()) {
      console.log('Empty address submitted');
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
    console.log('Rendering loading state...');
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="w-full h-10 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="w-full sm:w-24 h-10 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  console.log('Rendering search bar with userLocation:', userLocation);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row gap-2">
        <PlacesAutocomplete
          onSelect={(selectedAddress) => {
            console.log('Address selected:', selectedAddress);
            setAddress(selectedAddress);
          }}
          disabled={isLoading}
          userLocation={userLocation}
          className="w-full"
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-md border-2 border-white border-t-transparent" />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}