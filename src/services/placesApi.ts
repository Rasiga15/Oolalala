// placesApi.ts
const API_KEY = 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk';

export interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Autocomplete API with location bias
export const autocompletePlaces = async (input: string, locationBias?: { lat: number, lng: number, radius?: number }): Promise<Place[]> => {
  try {
    const requestBody: any = {
      input,
      includedRegionCodes: ['IN'],
      languageCode: 'en'
    };

    // Add location bias if provided
    if (locationBias) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: locationBias.lat,
            longitude: locationBias.lng
          },
          radius: locationBias.radius || 50000.0 // Default 50km
        }
      };
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'suggestions.placePrediction'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Autocomplete API error:', errorText);
      throw new Error(`Autocomplete API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      // Fetch details for each suggestion
      const places = await Promise.all(
        data.suggestions.slice(0, 5).map(async (suggestion: any) => {
          try {
            if (suggestion.placePrediction?.placeId) {
              return await getPlaceDetails(suggestion.placePrediction.placeId);
            }
            return null;
          } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
          }
        })
      );
      
      return places.filter((place): place is Place => place !== null);
    }
    
    return [];
  } catch (error) {
    console.error('Error in autocompletePlaces:', error);
    throw error;
  }
};

// Get current location using browser geolocation
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Error getting location: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

// Reverse geocoding API
export const reverseGeocode = async (lat: number, lng: number): Promise<Place[]> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}&result_type=street_address|route|neighborhood|locality`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocode error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 5).map((result: any) => ({
        id: result.place_id,
        displayName: {
          text: result.formatted_address
        },
        formattedAddress: result.formatted_address,
        location: {
          latitude: lat,
          longitude: lng
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in reverseGeocode:', error);
    throw error;
  }
};

// Check if location is within a city radius
export const isLocationWithinCity = async (
  location: { lat: number; lng: number },
  cityLocation: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<boolean> => {
  const R = 6371; // Earth's radius in km
  const dLat = (location.lat - cityLocation.lat) * Math.PI / 180;
  const dLng = (location.lng - cityLocation.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(cityLocation.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= radiusKm;
};

// Search Text API for intermediate cities
export const searchTextPlaces = async (input: string): Promise<Place[]> => {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify({
        textQuery: input,
        languageCode: 'en',
        regionCode: 'IN',
        rankPreference: 'DISTANCE'
      }),
    });

    if (!response.ok) {
      throw new Error(`Search Text API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      return data.places.slice(0, 5).map((place: any) => ({
        id: place.id,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        location: place.location
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in searchTextPlaces:', error);
    throw error;
  }
};

const getPlaceDetails = async (placeId: string): Promise<Place> => {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
    }
  });

  if (!response.ok) {
    throw new Error(`Place details error: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    displayName: data.displayName,
    formattedAddress: data.formattedAddress,
    location: data.location
  };
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Check if a stop is between origin and destination
export const isStopBetweenRoute = (
  stop: { lat: number; lng: number },
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  maxDeviationKm: number = 100
): { isValid: boolean; message: string; distanceFromRoute: number } => {
  
  // Calculate direct distance from origin to destination
  const totalDistance = calculateDistance(origin, destination);
  
  // Calculate distances from stop to origin and destination
  const distanceToOrigin = calculateDistance(stop, origin);
  const distanceToDestination = calculateDistance(stop, destination);
  
  // Check if stop is roughly on the route (using triangle inequality)
  const routeDistance = distanceToOrigin + distanceToDestination;
  const deviation = routeDistance - totalDistance;
  
  // If deviation is small, stop is approximately on the route
  const isOnRoute = deviation <= maxDeviationKm;
  
  return {
    isValid: isOnRoute,
    message: isOnRoute 
      ? 'Stop is within the route' 
      : `Stop is ${deviation.toFixed(1)}km away from the route. Please select a stop between ${origin.lat.toFixed(4)},${origin.lng.toFixed(4)} and ${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`,
    distanceFromRoute: deviation
  };
};