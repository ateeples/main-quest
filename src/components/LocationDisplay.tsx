import { MapPin, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map } from './Map';
import { LocationAnalysis } from './LocationAnalysis';
import { LocationData, Competitor } from '@/lib/types';
import { CompetitorsList } from './CompetitorsList';
import { BusinessTypeSelector } from './BusinessTypeSelector';

interface LocationDisplayProps {
  location: LocationData | null; // Remove optional since we check for null
  isAnalyzing: boolean; // Remove optional since we provide default
  onBusinessTypesChange: (types: string[]) => void; // Remove optional to fix TypeScript error
  competitors: Competitor[]; // Remove optional since we provide default
  isLoadingCompetitors: boolean; // Remove optional since we provide default
}

export function LocationDisplay({ 
  location, 
  isAnalyzing = false,
  onBusinessTypesChange,
  competitors = [],
  isLoadingCompetitors = false
}: LocationDisplayProps) {
  if (!location) {
    return null;
  }

  const handleGoogleMapsClick = () => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(
        location.address
      )}`,
      '_blank'
    );
  };

  const handleBusinessTypesChange = (types: string[]) => {
    if (onBusinessTypesChange) {
      onBusinessTypesChange(types);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map and Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="truncate">{location.address}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Map 
                  address={location.address} 
                  coordinates={location.coordinates}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleMapsClick}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:h-auto">
          <LocationAnalysis
            analysis={location.analysis}
            isLoading={isAnalyzing}
          />
        </div>
      </div>

      {/* Business Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Business Types to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessTypeSelector 
            onSelectionChange={handleBusinessTypesChange}
            initialSelection={location.selectedBusinessTypes || []}
          />
        </CardContent>
      </Card>

      {/* Competitors List */}
      <CompetitorsList
        competitors={competitors}
        isLoading={isLoadingCompetitors}
        selectedTypes={location.selectedBusinessTypes || []}
      />
    </div>
  );
}