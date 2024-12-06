import {
  Users,
  TrendingUp,
  Building2,
  MapPin,
  Store,
  Building,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationAnalysis as LocationAnalysisType } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RankingBadge } from './RankingBadge';
import { Separator } from '@/components/ui/separator';

interface LocationAnalysisProps {
  analysis?: LocationAnalysisType | null;
  isLoading?: boolean;
}

export function LocationAnalysis({
  analysis,
  isLoading = false,
}: LocationAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing Location...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
              <div className="h-16 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  if (analysis.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{analysis.error}</AlertDescription>
      </Alert>
    );
  }

  const {
    rankings = { areaType: { value: 'Unknown' }, population: { value: 'Unknown' } },
    analysis: details = {
      demographic_profile: '',
      lifestyle_trends: '',
      relevant_industries: '',
      physical_characteristics: '',
      type_of_center: '',
      nearby_businesses: '',
    },
    location = { name: '', address: '' },
  } = analysis;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span>Location Analysis</span>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <RankingBadge
              type="area"
              label="Area Type"
              value={rankings.areaType?.value}
            />
            <RankingBadge
              type="population"
              label="Est. Population"
              value={rankings.population?.value}
            />
          </div>
        </CardTitle>
        <CardDescription>
          Analysis for {location.name || location.address || 'Selected Location'}
        </CardDescription>
      </CardHeader>

      <ScrollArea className="md:h-[580px]">
        <CardContent className="space-y-6 px-6">
          <div className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <Users className="h-5 w-5" />
                Demographic Profile
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.demographic_profile || 'No data available'}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <TrendingUp className="h-5 w-5" />
                Lifestyle & Cultural Trends
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.lifestyle_trends || 'No data available'}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <Building2 className="h-5 w-5" />
                Relevant Industries
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.relevant_industries || 'No data available'}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="h-5 w-5" />
                Physical Characteristics
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.physical_characteristics || 'No data available'}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <Store className="h-5 w-5" />
                Type of Center
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.type_of_center || 'No data available'}
              </p>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                <Building className="h-5 w-5" />
                Nearby Businesses
              </h4>
              <p className="text-sm text-muted-foreground">
                {details.nearby_businesses || 'No data available'}
              </p>
            </div>
          </div>
        </CardContent>
      </ScrollArea>

      <CardFooter>
        <p className="text-xs text-muted-foreground italic w-full text-center mt-4">
          Created by Generative AI - some details may be inaccurate
        </p>
      </CardFooter>
    </Card>
  );
}