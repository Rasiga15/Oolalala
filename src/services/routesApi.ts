const API_KEY = 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk';

export interface RouteLeg {
  distanceMeters: number;
  duration: string;
}

export interface Route {
  routes: Array<{
    legs: RouteLeg[];
    distanceMeters: number;
    duration: string;
    polyline: {
      encodedPolyline: string;
    };
    travelAdvisory?: {
      tollInfo?: {
        estimatedPrice?: Array<{
          currencyCode: string;
          units: string;
        }>;
      };
    };
  }>;
}

export const computeRoutes = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  intermediates: Array<{ lat: number; lng: number }> = [],
  avoidTolls: boolean = false
): Promise<Route> => {
  try {
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
          },
        },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true,
      routeModifiers: {
        avoidTolls,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: 'en',
      units: 'METRIC',
    };

    if (intermediates.length > 0) {
      (requestBody as any).intermediates = intermediates.map(intermediate => ({
        location: {
          latLng: {
            latitude: intermediate.lat,
            longitude: intermediate.lng,
          },
        },
      }));
    }

    const response = await fetch(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs,routes.travelAdvisory',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Routes API error response:', errorText);
      throw new Error(`Routes API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error computing routes:', error);
    throw error;
  }
};