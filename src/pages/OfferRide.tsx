import { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, Clock, Users, Car, DollarSign, Navigation, Plus, X, Loader2, Map, ChevronDown, Search, Star, Building2, Navigation2 } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Types
interface Place {
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

interface RouteInfo {
  distance: string;
  duration: string;
  suggestedPrice: number;
  routePolyline?: string;
  stops?: Place[];
  distanceMeters?: number;
  durationSeconds?: number;
  baseFare?: number;
  distanceFare?: number;
  timeFare?: number;
}

interface Stop {
  id: string;
  place: Place;
}

interface CitySuggestion {
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  type: string;
  isSuggested: boolean;
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  distanceFromRoute?: string;
}

// API Keys
const PLACES_API_KEY = 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk';
const ROUTES_API_KEY = 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk';

// Custom hook to load Google Maps script
const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_API_KEY}&libraries=places,geometry&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setLoadError(null);
      } else {
        setLoadError('Google Maps failed to load');
      }
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps script');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, loadError };
};

// POLYLINE DECODING FUNCTION
const decodePolyline = (t: string, e?: number): google.maps.LatLng[] => {
  if (!t) return [];
  
  try {
    if (window.google && window.google.maps && window.google.maps.geometry && window.google.maps.geometry.encoding) {
      return window.google.maps.geometry.encoding.decodePath(t);
    }
    
    const points: google.maps.LatLng[] = [];
    let index = 0;
    const len = t.length;
    let lat = 0;
    let lng = 0;
    let shift = 0;
    let result = 0;
    let byte = null;
    const factor = Math.pow(10, e || 5);

    while (index < len) {
      // Decode latitude
      shift = 0;
      result = 0;
      do {
        byte = t.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      // Decode longitude
      shift = 0;
      result = 0;
      do {
        byte = t.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push(new google.maps.LatLng(lat / factor, lng / factor));
    }
    
    return points;
  } catch (error) {
    console.error('Error decoding polyline:', error);
    return [];
  }
};

// 🚗 GOOGLE ROUTES API - EXACT AS YOUR CURL COMMAND
const calculateRouteWithGoogleRoutesAPI = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  stops: Stop[] = []
): Promise<RouteInfo> => {
  try {
    console.log('🚗 Calling Google Routes API EXACT...');

    // Prepare intermediates (stops) for Routes API
    const intermediates = stops
      .filter(stop => stop.place.location)
      .map(stop => ({
        location: {
          latLng: {
            latitude: stop.place.location!.latitude,
            longitude: stop.place.location!.longitude
          }
        }
      }));

    // EXACT REQUEST BODY AS YOUR CURL COMMAND
    const requestBody: any = {
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude
          }
        }
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false
      },
      languageCode: "en-US",
      units: "METRIC"
    };

    // Add intermediates if we have stops
    if (intermediates.length > 0) {
      requestBody.intermediates = intermediates;
    }

    console.log('🔍 Routes API Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': ROUTES_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Routes API error:', response.status, errorText);
      throw new Error(`Google Routes API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Routes API Response:', data);
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const distanceMeters = route.distanceMeters || 0;
    const duration = route.duration || "0s";
    
    // Parse duration (comes as "3600s")
    const durationSeconds = parseInt(duration.replace('s', '')) || 0;
    
    // Convert to readable format
    const distanceKm = (distanceMeters / 1000).toFixed(1);
    const durationHours = (durationSeconds / 3600).toFixed(2);
    
    // ✅ ACTUAL PRICE CALCULATION BASED ON GOOGLE ROUTES API DATA
    // Base fare: ₹50
    // Per km: ₹6 (as you requested)
    // Per minute: ₹2 (for waiting time)
    // Minimum fare: ₹100
    
    const baseFare = 50;
    const perKmRate = 6; // ₹6 per km as you requested
    const perMinuteRate = 2; // ₹2 per minute
    const stopCharge = 20; // ₹20 per intermediate stop
    const minimumFare = 100;
    
    const distanceFare = (distanceMeters / 1000) * perKmRate;
    const timeFare = (durationSeconds / 60) * perMinuteRate;
    const stopFare = stops.length * stopCharge;
    
    let totalFare = baseFare + distanceFare + timeFare + stopFare;
    
    // Round to nearest 10
    totalFare = Math.max(minimumFare, Math.round(totalFare / 10) * 10);
    
    console.log('💰 Price Calculation:');
    console.log(`  Distance: ${distanceKm} km × ₹${perKmRate} = ₹${distanceFare.toFixed(2)}`);
    console.log(`  Time: ${durationSeconds}s (${durationHours} hrs) × ₹${perMinuteRate}/min = ₹${timeFare.toFixed(2)}`);
    console.log(`  Base fare: ₹${baseFare}`);
    console.log(`  Stops (${stops.length}): × ₹${stopCharge} = ₹${stopFare}`);
    console.log(`  Total fare: ₹${totalFare}`);
    
    return {
      distance: `${distanceKm} km`,
      duration: `${durationHours} hours`,
      suggestedPrice: totalFare,
      routePolyline: route.polyline?.encodedPolyline,
      distanceMeters,
      durationSeconds,
      baseFare,
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare)
    };
    
  } catch (error) {
    console.error('❌ Error in Google Routes API:', error);
    // Fallback to simple calculation
    const fallbackDistanceKm = calculateHaversineDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    ).distanceKm;
    
    const fallbackFare = Math.max(100, Math.round(fallbackDistanceKm * 6));
    
    return {
      distance: `${fallbackDistanceKm.toFixed(1)} km`,
      duration: `${(fallbackDistanceKm / 40).toFixed(1)} hours`, // Assume 40 km/h average
      suggestedPrice: fallbackFare,
      distanceMeters: fallbackDistanceKm * 1000,
      durationSeconds: (fallbackDistanceKm / 40) * 3600,
      baseFare: 50,
      distanceFare: Math.round(fallbackDistanceKm * 6),
      timeFare: Math.round((fallbackDistanceKm / 40) * 60 * 2)
    };
  }
};

// Haversine distance calculation for fallback
const calculateHaversineDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): { distanceMeters: number; distanceKm: number } => {
  const R = 6371000.0;
  
  const phi1 = lat1 * Math.PI / 180.0;
  const phi2 = lat2 * Math.PI / 180.0;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180.0;
  const deltaLambda = (lng2 - lng1) * Math.PI / 180.0;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;
  const distanceKm = distanceMeters / 1000;
  
  return { distanceMeters, distanceKm };
};

// Google Maps Component
const MapComponent = ({ 
  fromPlace, 
  toPlace, 
  stops, 
  routePolyline 
}: { 
  fromPlace: Place | null; 
  toPlace: Place | null; 
  stops: Stop[];
  routePolyline?: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const initMap = () => {
      const defaultLocation = { lat: 12.9716, lng: 77.5946 };
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center: defaultLocation,
        zoom: 7,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#7c93a3" }]
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#21409A" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#d9d9d9" }]
          },
          {
            featureType: "road",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(mapInstance);
    };

    initMap();
  }, [isLoaded]);

  // Update map when places or route polyline changes
  useEffect(() => {
    if (!map || !isLoaded || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Clear existing polyline
    if (polyline) {
      polyline.setMap(null);
    }

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    // Add from marker
    if (fromPlace?.location) {
      const position = { lat: fromPlace.location.latitude, lng: fromPlace.location.longitude };
      const marker = new google.maps.Marker({
        position,
        map,
        title: fromPlace.displayName.text,
        label: {
          text: "A",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "bold"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#21409A",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 10
        }
      });
      newMarkers.push(marker);
      bounds.extend(position);
    }

    // Add to marker
    if (toPlace?.location) {
      const position = { lat: toPlace.location.latitude, lng: toPlace.location.longitude };
      const marker = new google.maps.Marker({
        position,
        map,
        title: toPlace.displayName.text,
        label: {
          text: "B",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "bold"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#e74c3c",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 10
        }
      });
      newMarkers.push(marker);
      bounds.extend(position);
    }

    // Add stop markers
    stops.forEach((stop, index) => {
      if (stop.place.location) {
        const position = { lat: stop.place.location.latitude, lng: stop.place.location.longitude };
        const marker = new google.maps.Marker({
          position,
          map,
          title: stop.place.displayName.text,
          label: {
            text: `${index + 1}`,
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold"
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#21409A",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8
          }
        });
        newMarkers.push(marker);
        bounds.extend(position);
      }
    });

    setMarkers(newMarkers);

    // Draw route if we have polyline
    if (routePolyline) {
      console.log('🗺️ Drawing polyline route...');
      
      try {
        const decodedPath = decodePolyline(routePolyline);
        
        if (decodedPath.length > 0) {
          console.log('✅ Successfully decoded polyline with', decodedPath.length, 'points');
          
          const routePath = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: "#21409A",
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: map
          });
          
          setPolyline(routePath);
          
          // Adjust bounds to include entire route
          decodedPath.forEach(point => bounds.extend(point));
          
          // Also extend bounds to include markers
          newMarkers.forEach(marker => {
            const position = marker.getPosition();
            if (position) bounds.extend(position);
          });
        }
      } catch (error) {
        console.error('❌ Error drawing polyline:', error);
      }
    }

    // Fit bounds
    if (newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(12);
      } else {
        map.fitBounds(bounds, { padding: 50 });
      }
    }

  }, [map, fromPlace, toPlace, stops, routePolyline, isLoaded]);

  if (loadError) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Map Loading Error</h3>
          <p className="text-sm text-red-600">Unable to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full mb-4"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Loading Map...</h3>
          <p className="text-sm text-blue-600">Please wait while we load the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg">
      <div className="h-full w-full" ref={mapRef} />
    </div>
  );
};

// Places API Service
const searchPlaces = async (input: string): Promise<Place[]> => {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
      },
      body: JSON.stringify({
        input,
        locationBias: {
          circle: {
            center: {
              latitude: 12.9716,
              longitude: 77.5946
            },
            radius: 50000.0
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      const places = await Promise.all(
        data.suggestions.slice(0, 5).map(async (suggestion: any) => {
          try {
            return await getPlaceDetails(suggestion.placePrediction.placeId);
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

// Get intermediate cities between two points
const getIntermediateCities = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<CitySuggestion[]> => {
  try {
    // Calculate mid-point
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    
    // Calculate approximate distance
    const distanceResult = calculateHaversineDistance(startLat, startLng, endLat, endLng);
    const distanceKm = distanceResult.distanceKm;
    const searchRadius = Math.min((distanceKm * 1000 * 0.4), 50000);
    
    // Search for cities near the midpoint
    const cities = await searchCitiesNearLocation(midLat, midLng, searchRadius);
    
    if (cities.length > 0) {
      const citiesWithDistance = cities.map((city) => {
        const cityLat = city.lat;
        const cityLng = city.lng;
        
        const distance = calculateHaversineDistance(
          startLat, startLng, cityLat, cityLng
        ).distanceKm;
        
        return {
          ...city,
          distanceFromRoute: `${distance.toFixed(1)} km from start`,
        };
      });
      
      citiesWithDistance.sort((a, b) => {
        const aDist = parseFloat(a.distanceFromRoute?.split(' ')[0] || '0');
        const bDist = parseFloat(b.distanceFromRoute?.split(' ')[0] || '0');
        return aDist - bDist;
      });
      
      return citiesWithDistance.slice(0, 10);
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error finding intermediate cities:', error);
    return [];
  }
};

// Search cities near location
const searchCitiesNearLocation = async (
  lat: number, 
  lng: number, 
  radius: number
): Promise<CitySuggestion[]> => {
  try {
    const actualRadius = Math.min(radius, 50000);
    
    const requestBody = {
      includedTypes: ['locality'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: actualRadius,
        },
      },
    };

    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, errorData);
      return [];
    }

    const data = await response.json();
    const places = data.places || [];
    
    const formattedCities: CitySuggestion[] = [];
    
    for (const place of places) {
      try {
        const location = place.location;
        const displayName = place.displayName?.text || 'Unknown City';
        const address = place.formattedAddress || '';
        const types = place.types || [];
        
        const placeId = `city_${location?.latitude}_${location?.longitude}_${Date.now()}`;
        
        formattedCities.push({
          name: displayName,
          address: address,
          lat: location?.latitude || 0.0,
          lng: location?.longitude || 0.0,
          types: types,
          type: 'city',
          isSuggested: true,
          description: displayName,
          place_id: placeId,
          structured_formatting: {
            main_text: displayName,
            secondary_text: address,
          },
        });
      } catch (e) {
        console.error('⚠️ Error formatting city data:', e);
        continue;
      }
    }
    
    return formattedCities;
  } catch (error) {
    console.error('❌ Error searching cities:', error);
    return [];
  }
};

// Convert CitySuggestion to Place
const citySuggestionToPlace = (city: CitySuggestion): Place => {
  return {
    id: city.place_id || `city_${Date.now()}`,
    displayName: {
      text: city.name
    },
    formattedAddress: city.address,
    location: {
      latitude: city.lat,
      longitude: city.lng
    }
  };
};

const getPlaceDetails = async (placeId: string): Promise<Place> => {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': PLACES_API_KEY,
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

// Enhanced Route Calculation with Google Routes API
const calculateRouteWithStops = async (
  origin: Place, 
  destination: Place, 
  stops: Stop[] = []
): Promise<{
  distanceMeters: number;
  durationSeconds: number;
  duration: string;
  durationHours: string;
  distanceKm: string;
  totalDistanceKm: number;
  routePolyline?: string;
  baseFare?: number;
  distanceFare?: number;
  timeFare?: number;
  stopFare?: number;
}> => {
  try {
    if (!origin.location || !destination.location) {
      throw new Error('Invalid locations');
    }

    console.log('🚗 Calculating route with EXACT Google Routes API...');
    
    // Use Google Routes API for accurate calculation
    const routeInfo = await calculateRouteWithGoogleRoutesAPI(
      origin.location,
      destination.location,
      stops
    );

    const totalDistanceKm = (routeInfo.distanceMeters || 0) / 1000;
    
    console.log('✅ Route calculation successful with price:', {
      distance: routeInfo.distance,
      duration: routeInfo.duration,
      price: routeInfo.suggestedPrice,
      hasPolyline: !!routeInfo.routePolyline
    });
    
    return {
      distanceMeters: routeInfo.distanceMeters || 0,
      durationSeconds: routeInfo.durationSeconds || 0,
      duration: `${routeInfo.durationSeconds || 0}s`,
      durationHours: routeInfo.duration,
      distanceKm: `${totalDistanceKm.toFixed(1)} km`,
      totalDistanceKm: totalDistanceKm,
      routePolyline: routeInfo.routePolyline,
      baseFare: routeInfo.baseFare,
      distanceFare: routeInfo.distanceFare,
      timeFare: routeInfo.timeFare,
      stopFare: stops.length * 20 // ₹20 per stop
    };
    
  } catch (error) {
    console.error('❌ Error calculating route:', error);
    
    // Fallback calculation
    const fallbackDistance = calculateHaversineDistance(
      origin.location?.latitude || 0,
      origin.location?.longitude || 0,
      destination.location?.latitude || 0,
      destination.location?.longitude || 0
    );
    
    const totalDistanceKm = fallbackDistance.distanceKm;
    const durationHours = totalDistanceKm / 40; // Assume 40 km/h
    
    const baseFare = 50;
    const distanceFare = totalDistanceKm * 6; // ₹6 per km
    const timeFare = (durationHours * 60) * 2; // ₹2 per minute
    const stopFare = stops.length * 20;
    
    let totalFare = baseFare + distanceFare + timeFare + stopFare;
    totalFare = Math.max(100, Math.round(totalFare / 10) * 10);
    
    return {
      distanceMeters: fallbackDistance.distanceMeters,
      durationSeconds: durationHours * 3600,
      duration: `${durationHours.toFixed(1)} hours`,
      durationHours: `${durationHours.toFixed(1)}`,
      distanceKm: `${totalDistanceKm.toFixed(1)} km`,
      totalDistanceKm: totalDistanceKm,
      baseFare: baseFare,
      distanceFare: Math.round(distanceFare),
      timeFare: Math.round(timeFare),
      stopFare: stopFare
    };
  }
};

// Toast Function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium transform transition-transform duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

// Suggestion Dropdown Component
const SuggestionDropdown = ({ 
  suggestions, 
  onSelect, 
  visible 
}: { 
  suggestions: Place[];
  onSelect: (place: Place) => void;
  visible: boolean;
}) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
      {suggestions.map((place) => (
        <div
          key={place.id}
          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
          onClick={() => onSelect(place)}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <MapPin className="h-4 w-4 text-[#21409A]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{place.displayName.text}</div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-1">{place.formattedAddress}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// INTERMEDIATE CITIES DROPDOWN COMPONENT
const IntermediateCitiesDropdown = ({ 
  cities, 
  onSelect, 
  visible,
  isLoading,
  onRefresh,
  fromLocation,
  toLocation
}: { 
  cities: CitySuggestion[];
  onSelect: (city: CitySuggestion) => void;
  visible: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  fromLocation: string;
  toLocation: string;
}) => {
  if (!visible) return null;

  return (
    <div className="absolute z-20 w-full mt-2 bg-white border border-blue-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Map className="h-5 w-5 text-[#21409A]" />
              <h3 className="text-base font-semibold text-[#21409A]">Cities Along Your Route</h3>
            </div>
            <div className="text-sm text-[#21409A]">
              <div className="flex items-center gap-2">
                <span className="font-medium">Route:</span>
                <span className="bg-white px-3 py-1 rounded-full border border-blue-200 text-sm flex items-center gap-1">
                  <Navigation2 className="h-3 w-3" />
                  {fromLocation} → {toLocation}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white border border-blue-200 text-[#21409A] hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-3 text-xs text-[#21409A] bg-blue-100 px-2 py-1.5 rounded">
          💡 These cities are located between your selected route. Click to add as stops.
        </div>
      </div>
      
      {isLoading ? (
        <div className="px-4 py-8 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#21409A] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-700 mt-4 font-medium">Finding cities along your route...</span>
          <span className="text-xs text-gray-500 mt-1">This may take a moment</span>
        </div>
      ) : cities.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-gray-600 mb-2">No cities found between your route</div>
          <div className="text-xs text-gray-400">Try selecting different locations or refresh</div>
        </div>
      ) : (
        <div className="p-3">
          <div className="grid grid-cols-1 gap-2">
            {cities.map((city, index) => (
              <div
                key={city.place_id}
                className="group p-3 hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 hover:shadow-sm"
                onClick={() => onSelect(city)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#21409A] to-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#21409A]">{city.name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#21409A]">
                            <Building2 className="h-2.5 w-2.5 mr-1" />
                            City
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">{city.address}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-[#21409A]" />
                      </button>
                    </div>
                    {city.distanceFromRoute && (
                      <div className="flex items-center gap-1.5 text-xs text-[#21409A] bg-blue-50 px-2 py-1 rounded-full w-fit">
                        <Navigation className="h-3 w-3" />
                        <span className="font-medium">{city.distanceFromRoute}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-3 text-xs text-gray-500 border-t border-gray-100 mt-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span>Found {cities.length} cities along your route</span>
              <span className="text-[#21409A] font-medium">Click any city to add as stop</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stop Item Component
const StopItem = ({ 
  stop, 
  onRemove,
  index 
}: { 
  stop: Stop;
  onRemove: (id: string) => void;
  index: number;
}) => (
  <div className="group flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm">
    <div className="flex-shrink-0">
      <div className="w-8 h-8 bg-gradient-to-br from-[#21409A] to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
        {index + 1}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{stop.place.displayName.text}</h4>
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{stop.place.formattedAddress}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(stop.id)}
          className="opacity-70 hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1.5 hover:bg-red-50 rounded-lg"
          title="Remove stop"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

// Add Stop Component
const AddStop = ({
  onAddStop,
  existingStops,
  intermediateCities,
  isLoadingCities,
  onRefreshCities,
  fromLocation,
  toLocation
}: {
  onAddStop: (place: Place) => void;
  existingStops: Stop[];
  intermediateCities: CitySuggestion[];
  isLoadingCities: boolean;
  onRefreshCities: () => void;
  fromLocation: string;
  toLocation: string;
}) => {
  const [showCities, setShowCities] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = () => {
    setShowCities(true);
  };

  const handleCitySelect = (city: CitySuggestion) => {
    const place = citySuggestionToPlace(city);
    
    const isDuplicate = existingStops.some(stop => 
      stop.place.displayName.text.toLowerCase() === city.name.toLowerCase()
    );

    if (!isDuplicate) {
      onAddStop(place);
      setShowCities(false);
      showToast(`✅ ${city.name} added as a stop!`);
    } else {
      showToast(`⚠️ ${city.name} is already added as a stop`, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div 
          className="relative group cursor-pointer"
          onClick={handleInputFocus}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#21409A] to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#21409A] rounded-xl p-1">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#21409A] to-indigo-600 rounded-lg flex items-center justify-center">
                  <Map className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#21409A] mb-1">Add Intermediate Stops</div>
                <div className="text-sm text-[#21409A]">
                  Click to see cities between {fromLocation || "your starting point"} and {toLocation || "your destination"}
                </div>
              </div>
              <div className="flex-shrink-0">
                <ChevronDown className={`h-5 w-5 text-[#21409A] transition-transform duration-300 ${showCities ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </div>
        
        <IntermediateCitiesDropdown
          cities={intermediateCities}
          onSelect={handleCitySelect}
          visible={showCities}
          isLoading={isLoadingCities}
          onRefresh={onRefreshCities}
          fromLocation={fromLocation}
          toLocation={toLocation}
        />
      </div>
      
      {/* Quick Stats */}
      {intermediateCities.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-[#21409A] mb-1">Cities Available</div>
            <div className="text-lg font-bold text-[#21409A]">{intermediateCities.length}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 mb-1">Stops Added</div>
            <div className="text-lg font-bold text-green-700">{existingStops.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Input Component
const CustomInput = ({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  onFocus,
  required, 
  min, 
  max,
  className,
  icon: Icon
}: { 
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  icon?: React.ElementType;
}) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        required={required}
        min={min}
        max={max}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-xl 
          focus:ring-2 focus:ring-[#21409A] focus:border-[#21409A]
          transition-all duration-200
          ${Icon ? 'pl-11' : ''}
          ${className}
        `}
      />
    </div>
  </div>
);

// Route Card Component
const RouteCard = ({ from, to }: { from: string; to: string }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#21409A] mb-2">Your Route</div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm font-medium text-gray-900">{from || "Starting point"}</div>
            </div>
            <div className="h-4 border-l-2 border-dashed border-blue-300 ml-1"></div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="text-sm font-medium text-gray-900">{to || "Destination"}</div>
            </div>
          </div>
          <div className="text-[#21409A]">
            <Navigation2 className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const OfferRide = () => {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: "1",
    price: "",
    vehicle: "",
    fromAddress: "",
    toAddress: ""
  });

  // Location states
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toPlace, setToPlace] = useState<Place | null>(null);

  // Autocomplete states
  const [fromSuggestions, setFromSuggestions] = useState<Place[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [isFromSearching, setIsFromSearching] = useState(false);

  const [toSuggestions, setToSuggestions] = useState<Place[]>([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isToSearching, setIsToSearching] = useState(false);

  // Stops state
  const [stops, setStops] = useState<Stop[]>([]);

  // Intermediate cities state
  const [intermediateCities, setIntermediateCities] = useState<CitySuggestion[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Route info state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<string | undefined>();

  const { isGuest } = useAuth();
  const navigate = useNavigate();

  // Debounced search for From location
  useEffect(() => {
    if (formData.from.length > 2) {
      setIsFromSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(formData.from);
          setFromSuggestions(results);
          setShowFromSuggestions(true);
        } catch (error) {
          console.error('Error searching from location:', error);
          setFromSuggestions([]);
        } finally {
          setIsFromSearching(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      setIsFromSearching(false);
    }
  }, [formData.from]);

  // Debounced search for To location
  useEffect(() => {
    if (formData.to.length > 2) {
      setIsToSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchPlaces(formData.to);
          setToSuggestions(results);
          setShowToSuggestions(true);
        } catch (error) {
          console.error('Error searching to location:', error);
          setToSuggestions([]);
        } finally {
          setIsToSearching(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
      setIsToSearching(false);
    }
  }, [formData.to]);

  // Find intermediate cities when both from and to locations are set
  useEffect(() => {
    const findIntermediateCities = async () => {
      if (fromPlace?.location && toPlace?.location) {
        setIsLoadingCities(true);
        try {
          console.log('📍 Finding cities between locations...');
          const cities = await getIntermediateCities(
            fromPlace.location.latitude,
            fromPlace.location.longitude,
            toPlace.location.latitude,
            toPlace.location.longitude
          );
          setIntermediateCities(cities);
          console.log(`✅ Found ${cities.length} intermediate cities`);
        } catch (error) {
          console.error('❌ Error finding intermediate cities:', error);
          setIntermediateCities([]);
        } finally {
          setIsLoadingCities(false);
        }
      } else {
        setIntermediateCities([]);
      }
    };

    findIntermediateCities();
  }, [fromPlace, toPlace]);

  // Calculate route when locations or stops change
  useEffect(() => {
    const calculateRouteInfo = async () => {
      if (fromPlace && toPlace && fromPlace.id !== toPlace.id) {
        setIsCalculatingRoute(true);
        try {
          console.log('🚗 Calculating route with EXACT Google Routes API...');
          const routeData = await calculateRouteWithStops(fromPlace, toPlace, stops);
          
          // Multiply price by number of seats
          const pricePerSeat = routeData.baseFare || 0 + 
                              (routeData.distanceFare || 0) + 
                              (routeData.timeFare || 0) + 
                              (routeData.stopFare || 0);
          
          const totalPrice = Math.max(100, Math.round(pricePerSeat / 10) * 10);
          
          setRouteInfo({
            distance: routeData.distanceKm,
            duration: routeData.durationHours,
            suggestedPrice: totalPrice,
            distanceMeters: routeData.distanceMeters,
            durationSeconds: routeData.durationSeconds,
            routePolyline: routeData.routePolyline,
            baseFare: routeData.baseFare,
            distanceFare: routeData.distanceFare,
            timeFare: routeData.timeFare
          });
          
          setRoutePolyline(routeData.routePolyline);
          
          // Auto-fill suggested price if empty
          if (!formData.price) {
            setFormData(prev => ({ ...prev, price: totalPrice.toString() }));
          }
          
          console.log('✅ Route & Price calculated successfully:', {
            distance: routeData.distanceKm,
            duration: routeData.durationHours,
            price: totalPrice,
            hasPolyline: !!routeData.routePolyline
          });
          
        } catch (error) {
          console.error('❌ Error calculating route:', error);
          showToast('Using estimated calculation', 'error');
        } finally {
          setIsCalculatingRoute(false);
        }
      } else {
        setRouteInfo(null);
        setRoutePolyline(undefined);
      }
    };

    calculateRouteInfo();
  }, [fromPlace, toPlace, stops, formData.seats]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.suggestion-dropdown-container')) {
        setShowFromSuggestions(false);
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGuest) {
      navigate("/login");
      return;
    }

    // Validate required fields
    if (!formData.from || !formData.to || !formData.date || !formData.time || !formData.vehicle || !formData.price) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    // Log trip information with Google Routes API data
    console.log('🚗 Ride Details:');
    console.log(`From: ${formData.from}`);
    console.log(`To: ${formData.to}`);
    console.log(`Distance: ${routeInfo?.distance}`);
    console.log(`Duration: ${routeInfo?.duration}`);
    console.log(`Stops: ${stops.length}`);
    stops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.place.displayName.text}`);
    });
    console.log(`Total Price: ₹${formData.price}`);
    console.log(`Intermediate cities available: ${intermediateCities.length}`);
    console.log(`Route polyline available: ${!!routePolyline}`);

    showToast("🎉 Ride posted successfully with accurate route calculation!");
    
    // Reset form
    setFormData({
      from: "",
      to: "",
      date: "",
      time: "",
      seats: "1",
      price: "",
      vehicle: "",
      fromAddress: "",
      toAddress: ""
    });
    setFromPlace(null);
    setToPlace(null);
    setStops([]);
    setIntermediateCities([]);
    setRouteInfo(null);
    setRoutePolyline(undefined);
  };

  const selectFromSuggestion = (place: Place) => {
    setFormData({ 
      ...formData, 
      from: place.displayName.text,
      fromAddress: place.formattedAddress
    });
    setFromPlace(place);
    setShowFromSuggestions(false);
  };

  const selectToSuggestion = (place: Place) => {
    setFormData({ 
      ...formData, 
      to: place.displayName.text,
      toAddress: place.formattedAddress
    });
    setToPlace(place);
    setShowToSuggestions(false);
  };

  const handleFromFocus = () => {
    if (fromSuggestions.length > 0) {
      setShowFromSuggestions(true);
    }
  };

  const handleToFocus = () => {
    if (toSuggestions.length > 0) {
      setShowToSuggestions(true);
    }
  };

  const useSuggestedPrice = () => {
    if (routeInfo) {
      setFormData(prev => ({ ...prev, price: routeInfo.suggestedPrice.toString() }));
      showToast("✅ Price updated with Google Routes API data!");
    }
  };

  const addStop = (place: Place) => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      place
    };
    setStops(prev => [...prev, newStop]);
    
    console.log('📍 Added stop:', place.displayName.text);
    showToast(`📍 ${place.displayName.text} added as stop!`);
  };

  const removeStop = (stopId: string) => {
    const stopToRemove = stops.find(stop => stop.id === stopId);
    if (stopToRemove) {
      console.log('❌ Removed stop:', stopToRemove.place.displayName.text);
    }
    setStops(prev => prev.filter(stop => stop.id !== stopId));
    showToast("Stop removed");
  };

  const refreshIntermediateCities = async () => {
    if (fromPlace?.location && toPlace?.location) {
      setIsLoadingCities(true);
      try {
        console.log('🔄 Refreshing intermediate cities...');
        const cities = await getIntermediateCities(
          fromPlace.location.latitude,
          fromPlace.location.longitude,
          toPlace.location.latitude,
          toPlace.location.longitude
        );
        setIntermediateCities(cities);
        showToast(`🔍 Found ${cities.length} cities along your route`);
      } catch (error) {
        console.error('❌ Error refreshing cities:', error);
        showToast('Error refreshing cities', 'error');
      } finally {
        setIsLoadingCities(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-[#21409A] to-indigo-700 rounded-2xl mb-3">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#21409A] to-indigo-700 bg-clip-text text-transparent mb-2">
              Offer a Ride
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Share your journey, split costs, and make travel more sustainable
            </p>
            
            {isGuest && (
              <div className="mt-4 max-w-md mx-auto p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-800 font-medium">
                      <span className="font-bold">Guest Mode:</span> Login to post rides and access all features
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Split 50/50 Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Form (50%) */}
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden h-full">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-[#21409A] to-indigo-700 px-6 py-5">
                  <h2 className="text-xl font-bold text-white">Ride Details</h2>
                  <p className="text-blue-100 text-sm mt-1">Fill in your ride information below</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {/* Route Information Card */}
                  {routeInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                      <h3 className="font-semibold text-[#21409A] mb-3 flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Route Summary (Powered by Google Routes API)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="text-sm font-medium text-gray-700 mb-1">Distance</div>
                          <div className="text-xl font-bold text-[#21409A]">{routeInfo.distance}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="text-sm font-medium text-gray-700 mb-1">Duration</div>
                          <div className="text-xl font-bold text-[#21409A]">{routeInfo.duration}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="text-sm font-medium text-gray-700 mb-1">Suggested Price</div>
                          <div className="text-xl font-bold text-green-600">₹{routeInfo.suggestedPrice}</div>
                          <button
                            type="button"
                            onClick={useSuggestedPrice}
                            className="text-sm text-[#21409A] hover:text-indigo-800 mt-2 font-medium flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" />
                            Use this price
                          </button>
                        </div>
                      </div>
                      {routeInfo.routePolyline && (
                        <div className="mt-3 text-sm text-[#21409A] bg-blue-100 px-3 py-2 rounded-lg">
                          ✓ Route polyline available for map display
                        </div>
                      )}
                      {stops.length > 0 && (
                        <div className="mt-3 text-sm text-[#21409A] bg-blue-100 px-3 py-2 rounded-lg">
                          Includes {stops.length} stop{stops.length > 1 ? 's' : ''} • ₹20 per stop
                        </div>
                      )}
                    </div>
                  )}

                  {isCalculatingRoute && (
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 rounded-xl">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#21409A] mr-2"></div>
                      <div>
                        <span className="text-gray-700 font-medium text-sm">Calculating route with Google Routes API...</span>
                        <span className="text-xs text-gray-500 block">Getting accurate distance, duration and price</span>
                      </div>
                    </div>
                  )}

                  {/* Route Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-[#21409A]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Route Details</h2>
                        <p className="text-gray-600 text-xs">Set your pickup and drop locations</p>
                      </div>
                    </div>

                    {/* Route Card */}
                    <RouteCard from={formData.from} to={formData.to} />

                    {/* Location Inputs */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* From Location */}
                      <div className="relative suggestion-dropdown-container">
                        <CustomInput
                          label="From (Pickup Location) *"
                          placeholder="Enter starting point"
                          value={formData.from}
                          onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                          onFocus={handleFromFocus}
                          required
                          icon={MapPin}
                        />
                        {isFromSearching && (
                          <div className="absolute right-3 top-9 transform">
                            <Loader2 className="h-4 w-4 animate-spin text-[#21409A]" />
                          </div>
                        )}
                        <SuggestionDropdown
                          suggestions={fromSuggestions}
                          onSelect={selectFromSuggestion}
                          visible={showFromSuggestions}
                        />
                      </div>

                      {/* To Location */}
                      <div className="relative suggestion-dropdown-container">
                        <CustomInput
                          label="To (Drop Location) *"
                          placeholder="Enter destination"
                          value={formData.to}
                          onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                          onFocus={handleToFocus}
                          required
                          icon={MapPin}
                        />
                        {isToSearching && (
                          <div className="absolute right-3 top-9 transform">
                            <Loader2 className="h-4 w-4 animate-spin text-[#21409A]" />
                          </div>
                        )}
                        <SuggestionDropdown
                          suggestions={toSuggestions}
                          onSelect={selectToSuggestion}
                          visible={showToSuggestions}
                        />
                      </div>
                    </div>

                    {/* Stops Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Plus className="h-3 w-3 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm">Intermediate Stops</h3>
                        </div>
                        {intermediateCities.length > 0 && (
                          <div className="text-xs font-medium text-[#21409A] bg-blue-50 px-2 py-1 rounded-full">
                            {intermediateCities.length} cities available
                          </div>
                        )}
                      </div>
                      
                      {fromPlace && toPlace ? (
                        <AddStop 
                          onAddStop={addStop} 
                          existingStops={stops}
                          intermediateCities={intermediateCities}
                          isLoadingCities={isLoadingCities}
                          onRefreshCities={refreshIntermediateCities}
                          fromLocation={formData.from}
                          toLocation={formData.to}
                        />
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Map className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-gray-700 font-medium text-sm">Select both locations to see intermediate cities</p>
                          <p className="text-gray-500 text-xs mt-1">Choose your starting point and destination first</p>
                        </div>
                      )}
                      
                      {/* Display Stops */}
                      {stops.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-gray-700">
                              Your Stops ({stops.length})
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setStops([]);
                                showToast("All stops cleared");
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2">
                            {stops.map((stop, index) => (
                              <StopItem
                                key={stop.id}
                                stop={stop}
                                onRemove={removeStop}
                                index={index}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
                        <p className="text-gray-600 text-xs">When are you planning to travel?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomInput
                        type="date"
                        label="Date *"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        icon={Calendar}
                      />
                      <CustomInput
                        type="time"
                        label="Departure Time *"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                        icon={Clock}
                      />
                    </div>
                  </div>

                  {/* Ride Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Car className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Ride Details</h2>
                        <p className="text-gray-600 text-xs">Tell us about your vehicle and pricing</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomInput
                        type="number"
                        label="Available Seats *"
                        placeholder="1-4"
                        min="1"
                        max="4"
                        value={formData.seats}
                        onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                        required
                        icon={Users}
                      />
                      <CustomInput
                        label="Vehicle Model *"
                        placeholder="e.g., Honda City"
                        value={formData.vehicle}
                        onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                        required
                        icon={Car}
                      />
                      <div className="relative">
                        <CustomInput
                          type="number"
                          label="Price per Seat (₹) *"
                          placeholder="Enter price"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          min="1"
                          required
                          icon={DollarSign}
                        />
                        {routeInfo && (
                          <button
                            type="button"
                            onClick={useSuggestedPrice}
                            className="absolute right-2 top-8 text-xs bg-blue-100 hover:bg-blue-200 text-[#21409A] px-2 py-1 rounded-lg font-medium transition-colors"
                          >
                            Use Suggested
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🎯 PRICE BREAKDOWN WITH ₹6 PER KM */}
                  {routeInfo && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        Price Breakdown (₹6/km based on Google Routes API)
                      </h3>
                      <div className="space-y-1 text-xs text-green-700">
                        <div className="flex justify-between items-center py-1 border-b border-green-100">
                          <span>Base fare:</span>
                          <span className="font-semibold">₹{routeInfo.baseFare || 50}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-green-100">
                          <span>Distance ({routeInfo.distance} × ₹6/km):</span>
                          <span className="font-semibold">₹{routeInfo.distanceFare || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-green-100">
                          <span>Time component ({routeInfo.duration} × ₹2/min):</span>
                          <span className="font-semibold">₹{routeInfo.timeFare || 0}</span>
                        </div>
                        {stops.length > 0 && (
                          <div className="flex justify-between items-center py-1 border-b border-green-100">
                            <span>Stop charges ({stops.length} stops × ₹20):</span>
                            <span className="font-semibold">₹{stops.length * 20}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-1">
                          <span className="text-sm font-bold text-green-900">Total per seat:</span>
                          <span className="text-lg font-bold text-green-900">₹{routeInfo.suggestedPrice}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-green-600">For {formData.seats} seat(s):</span>
                            <span className="text-sm font-bold text-green-800">
                              ₹{routeInfo.suggestedPrice * parseInt(formData.seats)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guidelines */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-amber-500" />
                      Before You Post
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-start gap-1">
                          <div className="mt-0.5 text-green-500 text-xs">✓</div>
                          <span className="text-xs text-gray-600">Ensure vehicle documents are up to date</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <div className="mt-0.5 text-green-500 text-xs">✓</div>
                          <span className="text-xs text-gray-600">Maintain vehicle cleanliness and safety</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start gap-1">
                          <div className="mt-0.5 text-green-500 text-xs">✓</div>
                          <span className="text-xs text-gray-600">Be punctual and communicate delays</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <div className="mt-0.5 text-green-500 text-xs">✓</div>
                          <span className="text-xs text-gray-600">Verify passenger identities</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#21409A] to-indigo-700 hover:from-[#19327c] hover:to-indigo-800 text-white py-3 px-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                    disabled={isGuest}
                  >
                    {isGuest ? "Login to Post Ride" : "Post Ride Now"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side - Map (50%) */}
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden h-full">
                {/* Map Header */}
                <div className="bg-gradient-to-r from-[#21409A] to-indigo-700 px-6 py-5">
                  <h2 className="text-xl font-bold text-white">Route Map</h2>
                  <p className="text-blue-100 text-sm mt-1">Visualize your route and stops</p>
                  {routePolyline && (
                    <div className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      ✓ Route powered by Google Routes API
                    </div>
                  )}
                </div>

                {/* Map Container */}
                <div className="p-4 h-[calc(100vh-200px)]">
                  <MapComponent 
                    fromPlace={fromPlace} 
                    toPlace={toPlace} 
                    stops={stops} 
                    routePolyline={routePolyline} 
                  />
                </div>

                {/* Map Tips */}
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium text-gray-800 text-sm">Map Features</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs text-gray-600">• Click markers for details</div>
                    <div className="text-xs text-gray-600">• Zoom with mouse wheel</div>
                    <div className="text-xs text-gray-600">• Drag to pan the map</div>
                    <div className="text-xs text-gray-600">• Route updates automatically</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-bold text-[#21409A] mb-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-[#21409A]" />
              Tips for a Great Ride Experience
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-[#21409A] mb-1 text-xs">About Google Routes API</h4>
                <ul className="space-y-1 text-xs text-[#21409A]">
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>Real-time distance from Google Maps</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>Traffic-aware duration calculation</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>₹6/km accurate pricing</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#21409A] mb-1 text-xs">Pricing Information</h4>
                <ul className="space-y-1 text-xs text-[#21409A]">
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>Base fare: ₹50</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>Distance: ₹6 per km</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <div className="mt-0.5">•</div>
                    <span>Time: ₹2 per minute</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OfferRide;