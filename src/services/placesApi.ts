export interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
}

const API_KEY = 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk';
const BASE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

export const searchPlaces = async (input: string): Promise<Place[]> => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input,
        locationBias: {
          circle: {
            center: {
              latitude: 37.7937, // Default center (San Francisco)
              longitude: -122.3965
            },
            radius: 50000.0 // 50km radius
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns suggestions in the "suggestions" array
    if (data.suggestions && data.suggestions.length > 0) {
      // For autocomplete, we need to get place details for each suggestion
      const places = await Promise.all(
        data.suggestions.slice(0, 5).map(async (suggestion: any) => {
          try {
            const placeDetails = await getPlaceDetails(suggestion.placePrediction.placeId);
            return placeDetails;
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
    console.error('Error searching places:', error);
    throw error;
  }
};

const getPlaceDetails = async (placeId: string): Promise<Place> => {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress'
    }
  });

  if (!response.ok) {
    throw new Error(`Place details error: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    displayName: data.displayName,
    formattedAddress: data.formattedAddress
  };
};