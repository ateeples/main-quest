import { Competitor } from './types';

const METERS_PER_MILE = 1609.34;
const SEARCH_RADIUS_MILES = 5;

export async function searchCompetitors(
  coordinates: [number, number],
  selectedTypes: string[]
): Promise<Competitor[]> {
  if (!window.google?.maps?.places) {
    console.error('Google Places API not available');
    return [];
  }

  // Create a dummy div for the Places service
  const dummyDiv = document.createElement('div');
  const map = new google.maps.Map(dummyDiv, {
    center: { lat: coordinates[1], lng: coordinates[0] },
    zoom: 15,
  });

  const service = new google.maps.places.PlacesService(map);
  const competitors: Competitor[] = [];

  try {
    for (const type of selectedTypes) {
      const request: google.maps.places.PlaceSearchRequest = {
        location: { lat: coordinates[1], lng: coordinates[0] },
        radius: SEARCH_RADIUS_MILES * METERS_PER_MILE,
        type: type as google.maps.places.PlaceType
      };

      const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        });
      });

      for (const place of results) {
        if (place.geometry?.location && place.name) {
          const placeLocation = place.geometry.location;
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(coordinates[1], coordinates[0]),
            placeLocation
          ) / METERS_PER_MILE;

          competitors.push({
            id: place.place_id || `${place.name}-${Date.now()}`,
            name: place.name,
            address: place.vicinity || '',
            type: type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            distance,
            rating: place.rating,
            coordinates: [placeLocation.lng(), placeLocation.lat()]
          });
        }
      }
    }

    return competitors;
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return [];
  }
}