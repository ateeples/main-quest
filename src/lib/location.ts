import { toast } from '@/hooks/use-toast';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  console.log('Starting location detection...');

  if ('geolocation' in navigator) {
    try {
      console.log('Requesting geolocation permission...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Geolocation successful:', pos.coords);
            resolve(pos);
          },
          (err) => {
            console.log('Geolocation error:', err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      // Only show success toast after we actually get the position
      toast({
        title: "Location Detected",
        description: "Using your location to improve search results",
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

    } catch (error) {
      console.log('Geolocation error caught:', error);
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast({
              title: "Location Access Denied",
              description: "Falling back to IP-based location detection",
              variant: "destructive"
            });
            break;
          case error.TIMEOUT:
            toast({
              title: "Location Detection Timeout",
              description: "Falling back to IP-based location detection",
              variant: "destructive"
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toast({
              title: "Location Unavailable",
              description: "Falling back to IP-based location detection",
              variant: "destructive"
            });
            break;
        }
      }
    }
  } else {
    console.log('Geolocation not supported, using IP lookup');
  }

  // IP-based location fallback
  try {
    console.log('Attempting IP-based location lookup...');
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`IP lookup failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('IP location data:', data);

    if (data.latitude && data.longitude) {
      toast({
        title: "Location Detected",
        description: "Using approximate location from IP address",
      });
      
      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    }
  } catch (error) {
    console.error('IP-based location lookup failed:', error);
    toast({
      title: "Location Detection Failed",
      description: "Using default US-wide search",
      variant: "destructive"
    });
  }

  return null;
}