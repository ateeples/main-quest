import { useState } from 'react';
import { Building2, Star, MapPin, ArrowUpDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Competitor } from '@/lib/types';

interface CompetitorsListProps {
  competitors: Competitor[];
  isLoading: boolean;
  selectedTypes: string[];
}

type SortField = 'distance' | 'rating' | 'name';
type SortDirection = 'asc' | 'desc';

export function CompetitorsList({ 
  competitors, 
  isLoading,
  selectedTypes 
}: CompetitorsListProps) {
  const [sortField, setSortField] = useState<SortField>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCompetitors = [...competitors].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'distance':
        return (a.distance - b.distance) * modifier;
      case 'rating':
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return (ratingB - ratingA) * modifier;
      case 'name':
        return a.name.localeCompare(b.name) * modifier;
      default:
        return 0;
    }
  });

  if (!selectedTypes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Competitors
          </CardTitle>
          <CardDescription>
            Select business types above to view competitors in the area
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Loading Competitors...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Competitors ({competitors.length})
        </CardTitle>
        <CardDescription>
          Showing competitors within 5 miles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('distance')}
            className={sortField === 'distance' ? 'bg-muted' : ''}
          >
            Distance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('rating')}
            className={sortField === 'rating' ? 'bg-muted' : ''}
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('name')}
            className={sortField === 'name' ? 'bg-muted' : ''}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {sortedCompetitors.map((competitor) => (
              <div
                key={competitor.id}
                className="p-4 rounded-lg border bg-card text-card-foreground"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{competitor.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {competitor.type}
                    </p>
                  </div>
                  {competitor.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {competitor.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{competitor.distance.toFixed(1)} mi</span>
                  <span>•</span>
                  <span className="truncate">{competitor.address}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}