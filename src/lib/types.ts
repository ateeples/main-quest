export interface LocationData {
  address: string;
  coordinates: [number, number];
  timestamp: number;
  isFavorite?: boolean;
  analysis?: LocationAnalysis;
  selectedBusinessTypes?: string[];
}

export interface BusinessType {
  id: string;
  label: string;
  places_type: string[];
}

export interface BusinessCategory {
  name: string;
  types: BusinessType[];
}

export interface BusinessTypeHierarchy {
  [key: string]: {
    [key: string]: string[] | {
      [key: string]: string[];
    };
  };
}

export interface LocationDetails {
  name: string;
  address: string;
  coordinates: [number, number];
}

export type AreaType = 'Rural' | 'Suburban' | 'Urban' | 'Error';
export type PopulationRange = string;

export interface AreaTypeRanking {
  value: AreaType;
  description: string;
}

export interface PopulationRanking {
  value: PopulationRange;
  description: string;
}

export interface Rankings {
  areaType: AreaTypeRanking;
  population: PopulationRanking;
}

export interface AnalysisContent {
  demographic_profile: string;
  lifestyle_trends: string;
  relevant_industries: string;
  physical_characteristics: string;
  type_of_center: string;
  nearby_businesses: string;
}

export interface LocationAnalysis {
  location: LocationDetails;
  rankings: Rankings;
  analysis: AnalysisContent;
  error?: string;
}

export interface StorageData {
  recentSearches: LocationData[];
  favorites: LocationData[];
}

export interface Competitor {
  id: string;
  name: string;
  address: string;
  type: string;
  distance: number;
  rating?: number;
  coordinates: [number, number];
}

export function isValidAreaType(value: string): value is AreaType {
  return ['Rural', 'Suburban', 'Urban', 'Error'].includes(value);
}