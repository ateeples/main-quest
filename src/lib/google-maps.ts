import { LoadScriptNext } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const METERS_PER_MILE = 1609.34;

// Enhanced place type groups for better urban detection
const RESIDENTIAL_TYPES = [
  'residential',
  'house',
  'apartment_complex',
  'lodging',
  'real_estate_agency',
  'home_goods_store',
  'school',
  'park',
  'hotel'
];

const ENTERTAINMENT_TYPES = [
  'movie_theater',
  'night_club',
  'casino',
  'stadium',
  'amusement_park',
  'theater'
];

const TOURIST_TYPES = [
  'tourist_attraction',
  'museum',
  'art_gallery',
  'zoo',
  'aquarium',
  'landmark'
];

const BUSINESS_TYPES = [
  'store',
  'restaurant',
  'shopping_mall',
  'supermarket',
  'bank',
  'cafe',
  'office',
  'department_store'
];

const COMMUNITY_TYPES = [
  'school',
  'park',
  'library',
  'church',
  'gym',
  'hospital',
  'university',
  'transit_station',
  'subway_station',
  'train_station'
];

const URBAN_FEATURES = {
  HIGH_RISE_KEYWORDS: ['tower', 'plaza', 'complex', 'center', 'centre', 'building'],
  URBAN_AMENITIES: ['subway_station', 'light_rail_station', 'bus_station', 'parking'],
  DENSE_URBAN_MULTIPLIERS: {
    subwayStation: 2.0,
    highRiseBuilding: 1.8,
    commercialDistrict: 1.5,
    entertainmentVenue: 1.3,
    touristAttraction: 1.4
  }
};

const MAJOR_RETAIL_CHAINS = [
  'apple store',
  'walmart',
  'target',
  'costco',
  'whole foods',
  'nordstrom',
  'macy\'s',
  'best buy',
  'nike',
  'microsoft store'
].map(name => name.toLowerCase());

interface AreaTier {
  type: 'deep-rural' | 'rural' | 'suburban' | 'urban' | 'dense-urban' | 'super-urban';
  baseMultiplier: number;
  residentialFactor: number;
  businessFactor: number;
  communityFactor: number;
  minPopulation: number;
  minDensity: number;
  maxDensity?: number;
}

const AREA_TIERS: AreaTier[] = [
  {
    type: 'deep-rural',
    baseMultiplier: 300,
    residentialFactor: 250,
    businessFactor: 40,
    communityFactor: 100,
    minPopulation: 100,
    minDensity: 0,
    maxDensity: 0.2
  },
  {
    type: 'rural',
    baseMultiplier: 400,
    residentialFactor: 250,
    businessFactor: 40,
    communityFactor: 100,
    minPopulation: 500,
    minDensity: 0.2,
    maxDensity: 0.5
  },
  {
    type: 'suburban',
    baseMultiplier: 500,
    residentialFactor: 250,
    businessFactor: 40,
    communityFactor: 100,
    minPopulation: 2000,
    minDensity: 0.5,
    maxDensity: 1.0
  },
  {
   type: 'urban',
    baseMultiplier: 10000,      // decreased from 30000
    residentialFactor: 1000,    // Increased from 500
    businessFactor: 200,        // Increased from 80
    communityFactor: 300,       // decreased from 400
    minPopulation: 15000,       // decreased from 25000
    minDensity: 1.0,
    maxDensity: 2.0
  },
  {
    type: 'dense-urban',
    baseMultiplier: 80000,     // Increased from 50000
    residentialFactor: 2000,    // Increased from 1000
    businessFactor: 400,        // Increased from 160
    communityFactor: 800,       // Increased from 400
    minPopulation: 100000,      // Increased from 50000
    minDensity: 2.0,
    maxDensity: 4.0
  },
  {
    type: 'super-urban',
    baseMultiplier: 450000,     // Increased from 100000
    residentialFactor: 4000,    // Increased from 2000
    businessFactor: 800,        // Increased from 320
    communityFactor: 1600,      // Increased from 800
    minPopulation: 250000,      // Increased from 100000
    minDensity: 4.0
  }
];

export async function getPopulationEstimate(
  center: [number, number],
  radiusMiles: number
): Promise<number> {
  if (!GOOGLE_MAPS_API_KEY || !window.google?.maps) {
    console.warn('Google Maps API not loaded');
    return 0;
  }

  console.log('Starting population estimate for:', {
    center,
    radiusMiles,
    apiKey: GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
  });

  try {
    const radiusMeters = radiusMiles * METERS_PER_MILE;
    console.log('Search radius:', { radiusMiles, radiusMeters });

    // Initialize counters
    let residentialCount = 0;
    let businessCount = 0;
    let communityCount = 0;
    let schoolCount = 0;
    let hotelCount = 0;
    let transitHubCount = 0;
    let totalPlacesFound = 0;
    let majorRetailCount = 0;
    let uniqueRetailChains = new Set<string>();
    let hasMultiplePages = false;
    let highRiseCount = 0;
    let subwayStationCount = 0;
    let commercialDensity = 0;
    let entertainmentVenueCount = 0;
    let touristAttractionCount = 0;

    // Create a dummy map div (required for Places service)
    const dummyDiv = document.createElement('div');
    const map = new google.maps.Map(dummyDiv, {
      center: { lat: center[1], lng: center[0] },
      zoom: 15,
    });

    const service = new google.maps.places.PlacesService(map);
    console.log('Places service initialized');

    // Helper function to perform a search for specific types
    const searchPlaces = async (types: string[]): Promise<google.maps.places.PlaceResult[]> => {
      return new Promise((resolve, reject) => {
        service.nearbySearch(
          {
            location: { lat: center[1], lng: center[0] },
            radius: radiusMeters,
            type: types[0]
          },
          (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              if (pagination && pagination.hasNextPage) {
                hasMultiplePages = true;
                console.log('Multiple pages of results detected');
              }
              resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else {
              reject(new Error(`Places service failed: ${status}`));
            }
          }
        );
      });
    };

    // Perform multiple searches for different place types
    console.log('Starting place type searches...');

    const searchTypes = [
      { name: 'residential', types: ['establishment'] },
      { name: 'community', types: ['school', 'park'] },
      { name: 'business', types: ['store', 'restaurant'] },
      { name: 'entertainment', types: ['movie_theater', 'night_club'] },
      { name: 'tourist', types: ['tourist_attraction', 'museum'] }
    ];

    for (const search of searchTypes) {
      console.log(`Searching for ${search.name} places...`);
      try {
        const results = await searchPlaces(search.types);
        console.log(`Found ${results.length} ${search.name} places`);

        for (const place of results) {
          const types = place.types || [];
          const placeName = (place.name || '').toLowerCase();
          
          console.log(`Processing ${search.name} place:`, {
            name: place.name,
            types: types.join(', ')
          });

          if (types.some(type => RESIDENTIAL_TYPES.includes(type))) {
            residentialCount++;
            if (types.includes('lodging') || types.includes('hotel')) {
              hotelCount++;
            }
          }
          if (types.some(type => ENTERTAINMENT_TYPES.includes(type))) {
  entertainmentVenueCount++;
}

if (types.some(type => TOURIST_TYPES.includes(type))) {
  touristAttractionCount++;
}
          if (types.some(type => BUSINESS_TYPES.includes(type))) {
            businessCount++;
          }
          if (types.some(type => COMMUNITY_TYPES.includes(type))) {
            communityCount++;
            if (types.includes('school') || types.includes('university')) {
              schoolCount++;
            }
            if (types.includes('transit_station') || 
                types.includes('subway_station') || 
                types.includes('train_station')) {
              transitHubCount++;
            }
          }

          if (MAJOR_RETAIL_CHAINS.some(chain => placeName.includes(chain))) {
            majorRetailCount++;
            uniqueRetailChains.add(placeName);
            console.log('Major retail chain detected:', place.name);
          }

          totalPlacesFound++;
        }
      } catch (error) {
        console.error(`Error searching for ${search.name} places:`, error);
      }
    }

    console.log('Search results summary:', {
      residential: residentialCount,
  business: businessCount,
  community: communityCount,
  schools: schoolCount,
  hotels: hotelCount,
  transitHubs: transitHubCount,
  subwayStations: subwayStationCount,
  highRiseBuildings: highRiseCount,
  entertainment: entertainmentVenueCount,
  tourist: touristAttractionCount,
  majorRetail: majorRetailCount,
  uniqueRetailChains: uniqueRetailChains.size,
  total: totalPlacesFound,
  hasMultiplePages
    });

    // Calculate area characteristics
    const areaInSqMiles = Math.PI * Math.pow(radiusMiles, 2);
    const totalPlaces = residentialCount + businessCount + communityCount;
    const placeDensity = totalPlaces / areaInSqMiles;
    
    console.log('Area density calculations:', {
      areaInSqMiles: areaInSqMiles.toFixed(2),
      totalPlaces,
      placeDensity: placeDensity.toFixed(2)
    });

    // Check for super-urban conditions
    const isSuperUrban = 
      placeDensity > 4.0 && 
      schoolCount >= 10 && 
      uniqueRetailChains.size >= 3 &&
      hotelCount >= 3 &&
      transitHubCount >= 2;

    console.log('Super-urban check:', {
      isSuperUrban,
      conditions: {
        placeDensity: placeDensity > 4.0,
        schoolCount: schoolCount >= 10,
        retailChains: uniqueRetailChains.size >= 3,
        hotels: hotelCount >= 3,
        transitHubs: transitHubCount >= 2
      }
    });

    // Determine area tier based on total place density
    const areaTier = AREA_TIERS.find(tier => 
      placeDensity >= tier.minDensity && 
      (!tier.maxDensity || placeDensity < tier.maxDensity)
    ) || AREA_TIERS[0];

    console.log('Area classification:', {
      type: areaTier.type,
      placeDensity,
      baseMultiplier: areaTier.baseMultiplier
    });

    // Calculate population components
    let estimatedPopulation = areaTier.baseMultiplier;
    estimatedPopulation += residentialCount * areaTier.residentialFactor;
    estimatedPopulation += businessCount * areaTier.businessFactor;
    estimatedPopulation += communityCount * areaTier.communityFactor;

    console.log('Base population calculation:', {
      base: areaTier.baseMultiplier,
      residential: residentialCount * areaTier.residentialFactor,
      business: businessCount * areaTier.businessFactor,
      community: communityCount * areaTier.communityFactor,
      initial: estimatedPopulation
    });

    // Apply urban-specific adjustments
    const adjustments: Record<string, number> = {};

    // Hotel multiplier for urban areas
    if (hotelCount >= 3 && ['urban', 'dense-urban', 'super-urban'].includes(areaTier.type)) {
      const hotelMultiplier = 1.5;
      adjustments.hotels = hotelMultiplier;
      estimatedPopulation *= hotelMultiplier;
      console.log('Applied hotel multiplier:', estimatedPopulation);
    }

    // Transit hub multiplier for urban areas
    if (transitHubCount >= 2 && ['urban', 'dense-urban', 'super-urban'].includes(areaTier.type)) {
      const transitMultiplier = 1.5;
      adjustments.transit = transitMultiplier;
      estimatedPopulation *= transitMultiplier;
      console.log('Applied transit multiplier:', estimatedPopulation);
    }
// High-rise multiplier
    if (highRiseCount > 0) {
      const highRiseMultiplier = Math.min(
        URBAN_FEATURES.DENSE_URBAN_MULTIPLIERS.highRiseBuilding * 
        (1 + (highRiseCount * 0.1)),
        3.0
      );
      adjustments.highRise = highRiseMultiplier;
      estimatedPopulation *= highRiseMultiplier;
      console.log('Applied high-rise multiplier:', estimatedPopulation);
    }

    // Commercial density multiplier
    if (commercialDensity > 50) {
      const commercialMultiplier = URBAN_FEATURES.DENSE_URBAN_MULTIPLIERS.commercialDistrict;
      adjustments.commercial = commercialMultiplier;
      estimatedPopulation *= commercialMultiplier;
      console.log('Applied commercial density multiplier:', estimatedPopulation);
    }

    // Entertainment venue multiplier
    if (entertainmentVenueCount > 5) {
      const entertainmentMultiplier = URBAN_FEATURES.DENSE_URBAN_MULTIPLIERS.entertainmentVenue;
      adjustments.entertainment = entertainmentMultiplier;
      estimatedPopulation *= entertainmentMultiplier;
      console.log('Applied entertainment venue multiplier:', estimatedPopulation);
    }

    // Tourist attraction multiplier
    if (touristAttractionCount > 5) {
      const touristMultiplier = URBAN_FEATURES.DENSE_URBAN_MULTIPLIERS.touristAttraction;
      adjustments.tourist = touristMultiplier;
      estimatedPopulation *= touristMultiplier;
      console.log('Applied tourist attraction multiplier:', estimatedPopulation);
    }
    
    // Major retail chains multiplier
    if (uniqueRetailChains.size >= 3) {
      const retailMultiplier = 1 + (0.5 * uniqueRetailChains.size);
      adjustments.retail = retailMultiplier;
      estimatedPopulation *= retailMultiplier;
      console.log('Applied retail multiplier:', estimatedPopulation);
    }

    // School concentration multiplier
    if (schoolCount >= 10) {
      const schoolMultiplier = 2.0;
      adjustments.schools = schoolMultiplier;
      estimatedPopulation *= schoolMultiplier;
      console.log('Applied school multiplier:', estimatedPopulation);
    }

    // Super-urban multiplier
    if (isSuperUrban) {
      const superUrbanMultiplier = 3.5;
      adjustments.superUrban = superUrbanMultiplier;
      estimatedPopulation *= superUrbanMultiplier;
      console.log('Applied super-urban multiplier:', estimatedPopulation);
    }

    // Apply minimum threshold
    estimatedPopulation = Math.max(
      Math.round(estimatedPopulation),
      areaTier.minPopulation
    );

    console.log('Final population calculation:', {
      rawEstimate: estimatedPopulation,
      areaType: areaTier.type,
      minimumThreshold: areaTier.minPopulation,
      finalPopulation: estimatedPopulation,
      adjustments,
      metrics: {
        schoolCount,
        hotelCount,
        transitHubCount,
        uniqueRetailChains: uniqueRetailChains.size,
        totalPlaces: totalPlacesFound,
        hasMultiplePages
      }
    });

    return estimatedPopulation;
  } catch (error) {
    console.error('Error estimating population:', error);
    return 0;
  }
}