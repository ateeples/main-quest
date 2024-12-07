import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { LocationDisplay } from '@/components/LocationDisplay';
import { SearchHistory } from '@/components/SearchHistory';
import { BusinessTypeSelector } from '@/components/BusinessTypeSelector';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { StorageManager } from '@/lib/storage';
import { LocationData, Competitor } from '@/lib/types';
import { analyzeLocation } from '@/lib/gpt';
import { searchCompetitors } from '@/lib/places';
import { useAPI } from '@/components/APILoadingProvider';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error('Mapbox token is required. Please set VITE_MAPBOX_TOKEN in your environment variables.');
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  const [favorites, setFavorites] = useState<LocationData[]>([]);
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const { toast } = useToast();
  const storage = StorageManager.getInstance();
  const { isLoaded } = useAPI();


  const notifySearchPerformed = () => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'search',
      count: currentSearchCount
    }, '*');
  }
};
  
useEffect(() => {
  const sendHeight = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'setHeight',
        height: document.documentElement.scrollHeight
      }, '*');
    }
  };

  // Send height on mount
  sendHeight();
  
  // Send height on window resize
  window.addEventListener('resize', sendHeight);
  
  // Optional: Send height when content changes
  const observer = new ResizeObserver(sendHeight);
  observer.observe(document.body);
  
  return () => {
    window.removeEventListener('resize', sendHeight);
    observer.disconnect();
  };
}, []);


  
  useEffect(() => {
    setRecentSearches(storage.getRecentSearches());
    setFavorites(storage.getFavorites());
  }, []);

  useEffect(() => {
    const fetchCompetitors = async () => {
      if (location && selectedBusinessTypes.length > 0) {
        setIsLoadingCompetitors(true);
        try {
          const results = await searchCompetitors(
            location.coordinates,
            selectedBusinessTypes
          );
          setCompetitors(results);
        } catch (error) {
          console.error('Error fetching competitors:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch competitors',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingCompetitors(false);
        }
      } else {
        setCompetitors([]);
      }
    };

    fetchCompetitors();
  }, [location?.coordinates, selectedBusinessTypes, toast]);

  const handleSearch = async (address: string) => {
    if (!isLoaded) {
      toast({
        title: 'Error',
        description: 'Google Maps API is not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const encodedAddress = encodeURIComponent(address);
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'us',
        types: 'address',
        limit: '1'
      });

      const response = await fetch(`${geocodingUrl}?${params}`);

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('Address not found in the United States');
      }

      const [longitude, latitude] = data.features[0].center;
      const formattedAddress = data.features[0].place_name;

      if (
        longitude < -167.276413 || longitude > -52.233040 ||
        latitude < 15.436089 || latitude > 72.553992
      ) {
        throw new Error('Location must be within the United States');
      }

      const locationData: LocationData = {
        address: formattedAddress,
        coordinates: [longitude, latitude],
        timestamp: Date.now(),
        selectedBusinessTypes: selectedBusinessTypes
      };

      setLocation(locationData);
      setIsAnalyzing(true);
      
      const analysis = await analyzeLocation(formattedAddress, [longitude, latitude]);
      
      const updatedLocation = {
        ...locationData,
        analysis,
      };

      setLocation(updatedLocation);
      storage.addSearch(updatedLocation);
      setRecentSearches(storage.getRecentSearches());

      if (analysis.error) {
        toast({
          title: 'Analysis Warning',
          description: analysis.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch location data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSelectLocation = (location: LocationData) => {
    setLocation(location);
    setSelectedBusinessTypes(location.selectedBusinessTypes || []);
  };

  const handleToggleFavorite = (address: string) => {
    const isFavorite = storage.toggleFavorite(address);
    setRecentSearches(storage.getRecentSearches());
    setFavorites(storage.getFavorites());

    toast({
      title: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      description: address,
    });
  };

  const handleClearHistory = () => {
    storage.clearHistory();
    setRecentSearches([]);
    toast({
      title: 'History cleared',
      description: 'Your search history has been cleared.',
    });
  };

  const handleClearFavorites = () => {
    storage.clearFavorites();
    setFavorites([]);
    setRecentSearches(storage.getRecentSearches());
    toast({
      title: 'Favorites cleared',
      description: 'Your favorite locations have been cleared.',
    });
  };

  const handleBusinessTypesChange = (types: string[]) => {
    setSelectedBusinessTypes(types);
    if (location) {
      setLocation({
        ...location,
        selectedBusinessTypes: types
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Location Analysi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter a US address to analyze its location and get detailed insights
          </p>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto">
            *Enable location services for easier searching
          </p>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        </div>
        
        {location && (
          <div className="mt-8">
            <LocationDisplay
              location={location}
              isAnalyzing={isAnalyzing}
              onBusinessTypesChange={handleBusinessTypesChange}
              competitors={competitors}
              isLoadingCompetitors={isLoadingCompetitors}
            />
          </div>
        )}

        <div className="mt-8">
          <SearchHistory
            recentSearches={recentSearches}
            favorites={favorites}
            onSelectLocation={handleSelectLocation}
            onToggleFavorite={handleToggleFavorite}
            onClearHistory={handleClearHistory}
            onClearFavorites={handleClearFavorites}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}