import { Star, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LocationData } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { RankingBadge } from './RankingBadge';

interface SearchHistoryProps {
  recentSearches?: LocationData[];
  favorites?: LocationData[];
  onSelectLocation: (location: LocationData) => void;
  onToggleFavorite: (address: string) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
}

export function SearchHistory({
  recentSearches = [],
  favorites = [],
  onSelectLocation,
  onToggleFavorite,
  onClearHistory,
  onClearFavorites,
}: SearchHistoryProps) {
  const renderLocation = (location: LocationData) => {
    if (!location?.address) return null;

    return (
      <li
        key={location.address}
        className="flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onSelectLocation(location)}
            className="flex-1 truncate text-left hover:underline"
          >
            <span className="font-medium">{location.address}</span>
            <span className="block text-xs text-muted-foreground">
              {formatDistanceToNow(location.timestamp || Date.now(), { addSuffix: true })}
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(location.address)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <Star
              className={`h-4 w-4 ${
                location.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
              }`}
            />
          </Button>
        </div>

        {location.analysis?.rankings && (
          <div className="flex flex-wrap gap-2">
            <RankingBadge
              type="area"
              label="Area Type"
              value={location.analysis.rankings.areaType?.value}
            />
            <RankingBadge
              type="population"
              label="Population"
              value={location.analysis.rankings.population?.value}
            />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </div>
          </CardTitle>
          {recentSearches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentSearches.length === 0 ? (
            <CardDescription>No recent searches</CardDescription>
          ) : (
            <ul className="space-y-2">
              {recentSearches.map(renderLocation)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </div>
          </CardTitle>
          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFavorites}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <CardDescription>No favorite locations</CardDescription>
          ) : (
            <ul className="space-y-2">
              {favorites.map(renderLocation)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}