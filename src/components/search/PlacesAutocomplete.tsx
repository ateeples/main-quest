import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Coordinates } from '@/lib/location';

interface PlacesAutocompleteProps {
  onSelect: (address: string) => void;
  disabled?: boolean;
  userLocation?: Coordinates | null;
  className?: string;
}

interface Suggestion {
  description: string;
  placeId: string;
}

export function PlacesAutocomplete({
  onSelect,
  disabled = false,
  userLocation,
  className
}: PlacesAutocompleteProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    console.log('Places component mounted, checking for Google Maps...');
    if (window.google?.maps?.places) {
      console.log('Google Maps Places available, initializing service');
      autocompleteService.current = new google.maps.places.AutocompleteService();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    } else {
      console.error('Google Maps Places not available');
    }
  }, []);

  const fetchSuggestions = async (input: string) => {
    console.log('Fetching suggestions for:', input);
    console.log('User location available:', !!userLocation);
    
    if (!autocompleteService.current || !input) {
      console.error('Autocomplete service not initialized');
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        sessionToken: sessionToken.current,
        componentRestrictions: { country: 'us' },
        types: ['address']
      };

      // Add location bias if user location is available
      if (userLocation) {
        request.locationBias = {
          center: new google.maps.LatLng(userLocation.latitude, userLocation.longitude),
          radius: 50000 // 50km radius
        };
      }

      const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
        (resolve, reject) => {
          autocompleteService.current?.getPlacePredictions(
            request,
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]); // Handle no results gracefully
              } else {
                console.error('Places API status:', status);
                reject(status);
              }
            }
          );
        }
      );

      setSuggestions(
        predictions.map((prediction) => ({
          description: prediction.description,
          placeId: prediction.place_id,
        }))
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (input.length >= 3) {
        fetchSuggestions(input);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input]);

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Enter location address..."
        disabled={disabled}
        className={cn("pl-4 pr-10 rounded-md", className)}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.placeId}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                setInput(suggestion.description);
                onSelect(suggestion.description);
                setShowSuggestions(false);
                // Reset session token after selection
                sessionToken.current = new google.maps.places.AutocompleteSessionToken();
              }}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}