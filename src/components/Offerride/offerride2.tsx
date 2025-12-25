// src/pages/offer-ride/OfferRide2.tsx - UPDATED WITH IMMEDIATE STOP NAME UPDATES
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircleArrowRight, RefreshCw, Plus, MapPin, ArrowLeft, Navigation, AlertCircle, Trash2, Info, X, Map, Route, ChevronRight, Ban, Maximize2, Minimize2, Search, Locate } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import Navbar from '../layout/Navbar';
import { computeRoutes } from '../../services/routesApi';
import { reverseGeocode, calculateDistance, searchPlacesAlongRoute } from '../../services/placesApi';
import { StopPoint, Location, RouteOption } from '../../types';

// Function to decode polyline string to LatLng points
const decodePolyline = (encoded: string): google.maps.LatLngLiteral[] => {
  if (!encoded) return [];

  const points: google.maps.LatLngLiteral[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  
  return points;
};

// Function to calculate distance from point to polyline (Haversine formula)
const calculateDistanceFromPointToPolyline = (
  point: { lat: number; lng: number },
  polylinePoints: google.maps.LatLngLiteral[]
): number => {
  if (polylinePoints.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  // Calculate distance to each segment of the polyline
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const segmentStart = polylinePoints[i];
    const segmentEnd = polylinePoints[i + 1];
    
    // Calculate distance to line segment
    const distance = calculateDistance(point, segmentStart);
    
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
};

// Function to validate if stop is on polyline route (within 50km)
const validateStopOnPolylineRoute = (
  stop: { lat: number; lng: number },
  polylinePoints: google.maps.LatLngLiteral[],
  maxDistanceKm: number = 50
): { isValid: boolean; message: string; distanceFromRoute: number } => {
  if (polylinePoints.length === 0) {
    return {
      isValid: false,
      message: 'No route selected. Please select a route first.',
      distanceFromRoute: Infinity
    };
  }
  
  const distanceFromRoute = calculateDistanceFromPointToPolyline(stop, polylinePoints);
  
  const isValid = distanceFromRoute <= maxDistanceKm;
  
  return {
    isValid,
    message: isValid 
      ? `Location is on the route (${distanceFromRoute.toFixed(1)} km from route line)` 
      : `Location is ${distanceFromRoute.toFixed(1)} km away from the route. Maximum allowed distance is ${maxDistanceKm} km.`,
    distanceFromRoute
  };
};

// Toast Notification Component
const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}>
      <AlertCircle size={16} />
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2">
        <X size={14} />
      </button>
    </div>
  );
};

// Helper function to check if a string is a coordinate
const isCoordinateString = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  
  // Pattern for coordinates like "12.8122, 79.8168" or "-12.8122, -79.8168"
  const coordinatePattern = /^\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*$/;
  return coordinatePattern.test(text);
};

// Extract best location name from address components
const extractBestLocationName = (addressComponents: any[]): string => {
  if (!addressComponents || addressComponents.length === 0) return '';
  
  // Priority order for location types
  const priorityTypes = [
    'locality',          // City/Town
    'sublocality',       // Suburb/Neighborhood
    'administrative_area_level_2', // District
    'neighborhood',      // Neighborhood
    'route',             // Road/Street
    'administrative_area_level_1', // State
    'postal_town',       // Postal town
  ];
  
  // Try to find the most specific type first
  for (const type of priorityTypes) {
    for (const component of addressComponents) {
      const types = component.types || [];
      const longName = component.long_name || '';
      
      if (types.includes(type) && longName && !isCoordinateString(longName)) {
        return longName;
      }
    }
  }
  
  // Fallback: Return the first non-coordinate, non-numeric component
  for (const component of addressComponents) {
    const longName = component.long_name || '';
    if (longName && !isCoordinateString(longName) && !/^\d+$/.test(longName)) {
      return longName;
    }
  }
  
  return '';
};

// Extract city name from full address
const extractCityFromAddress = (fullAddress: string): string => {
  if (!fullAddress) return '';
  
  const parts = fullAddress.split(',');
  
  // Try to find city name (usually the first part)
  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    const part = parts[i].trim();
    
    // Skip if it's a coordinate or empty
    if (!part || isCoordinateString(part) || /^\d+$/.test(part)) {
      continue;
    }
    
    // Skip country/state/district indicators
    const lowerPart = part.toLowerCase();
    if (
      lowerPart.includes('india') ||
      lowerPart.includes('district') ||
      lowerPart.includes('state') ||
      lowerPart.includes('country') ||
      lowerPart.includes('pin ') ||
      lowerPart.includes('postal code')
    ) {
      continue;
    }
    
    // Check if it's a reasonable city name (2-30 characters)
    if (part.length >= 2 && part.length <= 30) {
      return part;
    }
  }
  
  // Return first meaningful part
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && !isCoordinateString(trimmed) && trimmed.length >= 2) {
      return trimmed;
    }
  }
  
  return '';
};

// Get accurate location name from coordinates - UPDATED WITH CACHING FOR BETTER PERFORMANCE
const getAccurateLocationName = async (lat: number, lng: number): Promise<{name: string, address: string}> => {
  const cacheKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
  
  // Check cache first
  if (window.locationNameCache && window.locationNameCache[cacheKey]) {
    return window.locationNameCache[cacheKey];
  }
  
  try {
    // First try using reverse geocoding with detailed result_type
    const reverseResults = await reverseGeocode(lat, lng);
    
    if (reverseResults.length > 0) {
      const fullAddress = reverseResults[0].formattedAddress || '';
      
      // Try to get detailed geocoding information
      const detailedResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk&language=en&result_type=locality|sublocality|administrative_area_level_2|neighborhood|route`
      );
      
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        
        if (detailedData.status === 'OK' && detailedData.results && detailedData.results.length > 0) {
          const result = detailedData.results[0];
          const addressComponents = result.address_components || [];
          
          // Try to extract best name from address components
          const bestName = extractBestLocationName(addressComponents);
          
          if (bestName && bestName !== '') {
            const locationData = {
              name: bestName,
              address: fullAddress
            };
            
            // Cache the result
            if (!window.locationNameCache) {
              window.locationNameCache = {};
            }
            window.locationNameCache[cacheKey] = locationData;
            
            return locationData;
          }
          
          // If no good name from components, try to extract from formatted address
          const formattedAddress = result.formatted_address || fullAddress;
          const cityName = extractCityFromAddress(formattedAddress);
          
          if (cityName && cityName !== '') {
            const locationData = {
              name: cityName,
              address: formattedAddress
            };
            
            // Cache the result
            if (!window.locationNameCache) {
              window.locationNameCache = {};
            }
            window.locationNameCache[cacheKey] = locationData;
            
            return locationData;
          }
        }
      }
      
      // Fallback: Extract city name from full address
      const cityName = extractCityFromAddress(fullAddress);
      if (cityName && cityName !== '') {
        const locationData = {
          name: cityName,
          address: fullAddress
        };
        
        // Cache the result
        if (!window.locationNameCache) {
          window.locationNameCache = {};
        }
        window.locationNameCache[cacheKey] = locationData;
        
        return locationData;
      }
      
      // Last resort: Return first part of address
      const firstPart = fullAddress.split(',')[0].trim();
      if (firstPart && !isCoordinateString(firstPart)) {
        const locationData = {
          name: firstPart,
          address: fullAddress
        };
        
        // Cache the result
        if (!window.locationNameCache) {
          window.locationNameCache = {};
        }
        window.locationNameCache[cacheKey] = locationData;
        
        return locationData;
      }
    }
  } catch (error) {
    console.error('Error getting accurate location name:', error);
  }
  
  // Fallback to coordinates if everything fails
  const fallbackData = {
    name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    address: `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
  };
  
  // Cache even the fallback
  if (!window.locationNameCache) {
    window.locationNameCache = {};
  }
  window.locationNameCache[cacheKey] = fallbackData;
  
  return fallbackData;
};

// Add type for window cache
declare global {
  interface Window {
    locationNameCache?: Record<string, {name: string, address: string}>;
  }
}

// Manual Stop Search Modal Component
const ManualStopSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stopData: StopPoint) => void;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  isFullCar: boolean;
  polylinePoints: google.maps.LatLngLiteral[];
  onSearchPlaces: (query: string) => Promise<Array<{
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }>>;
}> = ({ isOpen, onClose, onConfirm, origin, destination, isFullCar, polylinePoints, onSearchPlaces }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
  } | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
    distanceFromRoute: number;
  }>({ isValid: false, message: '', distanceFromRoute: 0 });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await onSearchPlaces(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaceSelect = async (place: {
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => {
    setSelectedPlace(place);
    
    // Validate if place is on the polyline route (within 50km)
    const validationResult = validateStopOnPolylineRoute(
      place.location,
      polylinePoints,
      50
    );

    setValidation(validationResult);
  };

  const handleConfirm = async () => {
    if (selectedPlace && validation.isValid) {
      // Get accurate name from coordinates
      const accurateName = await getAccurateLocationName(
        selectedPlace.location.lat,
        selectedPlace.location.lng
      );
      
      onConfirm({
        stopId: Date.now(),
        type: 'STOP',
        name: accurateName.name, // Use accurate name
        address: accurateName.address, // Use accurate address
        lat: selectedPlace.location.lat,
        lng: selectedPlace.location.lng
      });
      resetModal();
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlace(null);
    setValidation({ isValid: false, message: '', distanceFromRoute: 0 });
    onClose();
  };

  if (!isOpen) return null;

  if (isFullCar) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
        <div className="bg-white rounded-lg w-full max-w-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Stops Not Allowed</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={18} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <Ban size={16} />
                <span className="text-sm">Stops are not allowed for full car rides</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Since this is a full car ride (private), you cannot add intermediate stops. 
                The ride will go directly from pickup to destination.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357c]"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Search for a Stop</h3>
          <button onClick={resetModal} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Search for cities/places along the route:</div>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Route:</span> 
              <span>Selected route polyline (within 50km)</span>
            </div>
            <div className="text-xs mt-1">
              <span className="font-medium">Note:</span> Only locations within 50km of the route line are allowed
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter city or place name..."
              className="w-full p-2 pl-9 border border-gray-300 rounded-lg font-medium text-gray-800 bg-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs rounded ${
                !searchQuery.trim() || isSearching
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#21409A] text-white hover:bg-[#1a357c]'
              }`}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Note: Only locations within 50km of the selected route are allowed
          </p>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-3 max-h-60 overflow-y-auto">
            <div className="text-sm text-gray-600 mb-2">Search Results:</div>
            <div className="space-y-1">
              {searchResults.map((place) => (
                <div
                  key={place.placeId}
                  onClick={() => handlePlaceSelect(place)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedPlace?.placeId === place.placeId
                      ? 'border-[#21409A] bg-[#21409A]/5'
                      : 'border-gray-200 hover:border-[#21409A]/50 hover:bg-[#21409A]/2'
                  }`}
                >
                  <div className="font-medium text-gray-800 text-sm">{place.name}</div>
                  <div className="text-xs text-gray-500 truncate">{place.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Place and Validation */}
        {selectedPlace && (
          <div className="mb-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-800 text-sm">Selected Location:</div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear
              </button>
            </div>
            
            <div className="mb-2">
              <div className="font-medium text-sm">{selectedPlace.name}</div>
              <div className="text-xs text-gray-500">{selectedPlace.address}</div>
              <div className="text-xs text-gray-400 mt-1">
                Coordinates: {selectedPlace.location.lat.toFixed(6)}, {selectedPlace.location.lng.toFixed(6)}
              </div>
            </div>

            <div className={`p-2 rounded-lg ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`flex items-center gap-2 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.isValid ? (
                  <>
                    <CircleArrowRight size={14} />
                    <span className="text-sm font-medium">Valid Stop Location</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span className="text-sm font-medium">Invalid Stop Location</span>
                  </>
                )}
              </div>
              <p className="text-xs mt-1">
                {validation.message}
                {validation.distanceFromRoute > 0 && (
                  <span className={`block ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    Distance from route: {validation.distanceFromRoute.toFixed(1)} km
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedPlace || !validation.isValid}
            className={`flex-1 py-2 rounded-lg font-medium ${
              selectedPlace && validation.isValid
                ? 'bg-[#21409A] text-white hover:bg-[#1a357c]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Stop
          </button>
          <button
            onClick={resetModal}
            className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Stop Modal Component - FIXED WITH IMMEDIATE UPDATES
const AddStopModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stopData: StopPoint) => void;
  position: { lat: number; lng: number } | null;
  address: string;
  isValid: boolean;
  validationMessage: string;
  isFullCar: boolean;
}> = ({ isOpen, onClose, onConfirm, position, address, isValid, validationMessage, isFullCar }) => {
  const [stopName, setStopName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [hasFetchedName, setHasFetchedName] = useState(false);

  // Fetch accurate name immediately when modal opens
  useEffect(() => {
    const fetchAccurateName = async () => {
      if (position && !hasFetchedName) {
        setLoadingName(true);
        try {
          const accurateName = await getAccurateLocationName(position.lat, position.lng);
          // IMMEDIATE STATE UPDATE - This will trigger re-render
          setStopName(accurateName.name);
          setHasFetchedName(true);
        } catch (error) {
          console.error('Error fetching accurate name:', error);
          // Try to extract city name from address as fallback
          const cityName = extractCityFromAddress(address);
          setStopName(cityName || 'Stop');
          setHasFetchedName(true);
        } finally {
          setLoadingName(false);
        }
      }
    };

    if (isOpen && position) {
      fetchAccurateName();
    }
    
    // Reset when modal closes
    return () => {
      if (!isOpen) {
        setHasFetchedName(false);
        setStopName('');
      }
    };
  }, [isOpen, position, address]);

  // Also update when address changes
  useEffect(() => {
    if (address && !stopName && !loadingName) {
      const cityName = extractCityFromAddress(address);
      if (cityName) {
        setStopName(cityName);
      }
    }
  }, [address, stopName, loadingName]);

  if (!isOpen) return null;

  if (isFullCar) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
        <div className="bg-white rounded-lg w-full max-w-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Stops Not Allowed</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={18} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <Ban size={16} />
                <span className="text-sm">Stops are not allowed for full car rides</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Since this is a full car ride (private), you cannot add intermediate stops. 
                The ride will go directly from pickup to destination.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357c]"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Add New Stop</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Stop Name:</div>
          <div className="relative">
            <input
              type="text"
              value={stopName}
              onChange={(e) => {
                // MANUAL UPDATE - This triggers immediate UI update
                setStopName(e.target.value);
              }}
              placeholder="Enter stop name"
              className="w-full p-2 border border-gray-300 rounded-lg font-medium text-gray-800 bg-transparent"
              disabled={loadingName}
            />
            {loadingName && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {loadingName ? 'Detecting location name...' : 'Accurately detected location name (city/town)'}
          </p>
        </div>

        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Location Address:</div>
          <div className="font-medium text-gray-800 p-2 bg-gray-50 rounded-lg max-h-20 overflow-y-auto">
            {address || 'Fetching address...'}
          </div>
          {position && (
            <div className="text-xs text-gray-500 mt-1">
              Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div className={`mb-3 p-2 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            <AlertCircle size={14} />
            <span className="text-sm">{validationMessage}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              if (position && isValid && stopName) {
                onConfirm({
                  stopId: Date.now(),
                  type: 'STOP',
                  name: stopName,
                  address: address,
                  lat: position.lat,
                  lng: position.lng
                });
              }
            }}
            disabled={!isValid || !stopName || loadingName}
            className={`flex-1 py-2 rounded-lg font-medium ${
              isValid && stopName && !loadingName
                ? 'bg-[#21409A] text-white hover:bg-[#1a357c]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loadingName ? 'Loading...' : 'Add Stop'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Invalid Stop Modal Component
const InvalidStopModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  stopLocation: { lat: number; lng: number };
  polylinePoints: google.maps.LatLngLiteral[];
  errorMessage: string;
  distanceFromRoute: number;
}> = ({ isOpen, onClose, stopLocation, polylinePoints, errorMessage, distanceFromRoute }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-red-600">Invalid Stop Location</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-3">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle size={14} />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
            <p className="text-sm text-gray-600">
              Please select a location within 50km of the selected route.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#21409A] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              !
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#21409A]">Selected Location</div>
              <div className="text-xs text-gray-500">
                {stopLocation.lat.toFixed(4)}, {stopLocation.lng.toFixed(4)}
              </div>
              <div className="text-xs text-amber-600 mt-0.5">
                <span className="font-medium">Distance from route:</span> {distanceFromRoute.toFixed(1)} km
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              i
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Route Information</div>
              <div className="text-xs text-gray-500">
                Route length: {polylinePoints.length} points
              </div>
              <div className="text-xs text-gray-500">
                Allowed distance: Within 50km of route
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg mb-3">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">How to add a valid stop:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-xs">
                <li>Click on the map along the blue route line</li>
                <li>Use the "Search Cities" option to find locations near the route</li>
                <li>Make sure the location is within 50km of the route line</li>
                <li>Try adding a stop closer to the route</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357c]"
          >
            Okay, I'll try again
          </button>
        </div>
      </div>
    </div>
  );
};

const LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places'];

const OfferRide2: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state;

  const [selectedRoute, setSelectedRoute] = useState<number>(1);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [stopPoints, setStopPoints] = useState<StopPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isFullCar, setIsFullCar] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'routes' | 'stops'>('routes');
  const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 });
  const [mapZoom, setMapZoom] = useState(10);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [addStopModal, setAddStopModal] = useState({
    isOpen: false,
    position: null as { lat: number; lng: number } | null,
    address: '',
    isValid: false,
    validationMessage: ''
  });
  const [manualSearchModal, setManualSearchModal] = useState({
    isOpen: false
  });
  const [invalidStopModal, setInvalidStopModal] = useState({
    isOpen: false,
    position: null as { lat: number; lng: number } | null,
    errorMessage: '',
    distanceFromRoute: 0
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAddStopMode, setIsAddStopMode] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);
  const [routeSegments, setRouteSegments] = useState<Array<{
    from: string;
    to: string;
    distance: number;
    duration: number;
  }>>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [mapExpanded, setMapExpanded] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk',
    libraries: LIBRARIES
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Get current polyline points
  const selectedRouteData = routes.find(r => r.id === selectedRoute);
  const polylinePath = selectedRouteData?.polyline 
    ? decodePolyline(selectedRouteData.polyline)
    : [];

  // Background fare calculation functions
  const calculateSegmentFare = (distanceKm: number): number => {
    if (!rideData) return 0;
    
    const farePerKm = parseFloat(rideData.settings?.fare_per_km_car || '12');
    const seats = rideData.seats || 1;
    
    const baseFare = distanceKm * farePerKm / seats;
    return Math.round(baseFare / 10) * 10;
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize stops with proper names
  useEffect(() => {
    if (!rideData?.pickup || !rideData?.drop) {
      navigate('/offer-ride1');
      return;
    }

    setMapCenter({ 
      lat: rideData.pickup.lat, 
      lng: rideData.pickup.lng 
    });
    setMapZoom(12);
    
    // Initialize stops with proper names
    const initializeStops = async () => {
      const initialStops: StopPoint[] = [];
      
      // Get accurate name for pickup
      const pickupName = await getAccurateLocationName(
        rideData.pickup.lat,
        rideData.pickup.lng
      );
      
      initialStops.push({
        stopId: 1,
        type: 'ORIGIN',
        name: pickupName.name,
        address: pickupName.address,
        lat: rideData.pickup.lat,
        lng: rideData.pickup.lng
      });
      
      // Get accurate name for drop
      const dropName = await getAccurateLocationName(
        rideData.drop.lat,
        rideData.drop.lng
      );
      
      initialStops.push({
        stopId: 2,
        type: 'DESTINATION',
        name: dropName.name,
        address: dropName.address,
        lat: rideData.drop.lat,
        lng: rideData.drop.lng
      });
      
      // Use setState callback to ensure proper update
      setStopPoints(prev => {
        const updatedStops = [...initialStops];
        console.log('Initializing stops:', updatedStops);
        return updatedStops;
      });
      
      loadRoutes(initialStops);
    };
    
    initializeStops();
  }, [rideData, navigate]);

  const loadRoutes = async (stops: StopPoint[]) => {
    setIsLoading(true);
    try {
      const sortedStops = [...stops].sort((a, b) => a.stopId - b.stopId);
      
      const intermediateStops = isFullCar 
        ? [] 
        : sortedStops
            .filter(stop => stop.type === 'STOP')
            .map(stop => ({ lat: stop.lat, lng: stop.lng }));

      const results = await computeRoutes(
        { lat: rideData.pickup.lat, lng: rideData.pickup.lng },
        { lat: rideData.drop.lat, lng: rideData.drop.lng },
        intermediateStops,
        false
      );

      if (results.routes && results.routes.length > 0) {
        const routeOptions: RouteOption[] = results.routes.map((route, index) => {
          const durationSeconds = parseDurationToSeconds(route.duration);
          const durationFormatted = formatDuration(route.duration);
          
          return {
            id: index + 1,
            duration: durationFormatted,
            durationSeconds,
            distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
            distanceMeters: route.distanceMeters,
            hasTolls: !!route.travelAdvisory?.tollInfo?.estimatedPrice,
            polyline: route.polyline?.encodedPolyline || '',
            legs: route.legs || [],
          };
        });

        setRoutes(routeOptions);
        
        if (results.routes[0]?.legs) {
          const segments = results.routes[0].legs.map((leg, index) => {
            const fromStop = sortedStops[index];
            const toStop = sortedStops[index + 1];
            
            return {
              from: fromStop?.name || 'Unknown',
              to: toStop?.name || 'Unknown',
              distance: leg.distanceMeters / 1000,
              duration: Math.round(parseDurationToSeconds(leg.duration) / 60)
            };
          });

          setRouteSegments(segments);
        }
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      const fallbackRoutes: RouteOption[] = [
        {
          id: 1,
          duration: '45 min',
          durationSeconds: 2700,
          distance: '18.5 km',
          distanceMeters: 18500,
          hasTolls: true,
          polyline: '',
          legs: [],
        },
      ];
      setRoutes(fallbackRoutes);
      
      const sortedStops = [...stops].sort((a, b) => a.stopId - b.stopId);
      const fallbackSegments = [];
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const from = sortedStops[i];
        const to = sortedStops[i + 1];
        const distance = calculateDistance(
          { lat: from.lat, lng: from.lng },
          { lat: to.lat, lng: to.lng }
        );
        
        fallbackSegments.push({
          from: from.name,
          to: to.name,
          distance: distance,
          duration: Math.round((distance / 40) * 60)
        });
      }
      setRouteSegments(fallbackSegments);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (duration: string): string => {
    if (!duration) return '0 min';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;

    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const parseDurationToSeconds = (duration: string): number => {
    if (!duration) return 0;
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = match[1] ? parseInt(match[1].replace('H', '')) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) * 60 : 0;
    const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;

    return hours + minutes + seconds;
  };

  // Function to search places along route
  const handleSearchPlaces = async (query: string): Promise<Array<{
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }>> => {
    const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
    const destination = stopPoints.find(stop => stop.type === 'DESTINATION');
    
    if (!origin || !destination) {
      throw new Error('Origin or destination not found');
    }

    try {
      const places = await searchPlacesAlongRoute(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
        query,
        50 // 50km radius from route
      );

      // Filter places that are within 50km of the polyline route
      const filteredPlaces = places.filter(place => {
        const validation = validateStopOnPolylineRoute(
          { lat: place.lat, lng: place.lng },
          polylinePath,
          50
        );
        return validation.isValid;
      });

      return filteredPlaces.map(place => ({
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        location: { lat: place.lat, lng: place.lng }
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  };

  // Handle manual search stop addition
  const handleManualSearchStop = async (stopData: StopPoint) => {
    const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
    const destination = stopPoints.find(stop => stop.type === 'DESTINATION');
    
    if (!origin || !destination) {
      setToast({ 
        message: 'Origin or destination not found', 
        type: 'error' 
      });
      return;
    }

    // Validate the stop location is on the polyline route (within 50km)
    const validation = validateStopOnPolylineRoute(
      { lat: stopData.lat, lng: stopData.lng },
      polylinePath,
      50
    );

    if (!validation.isValid) {
      setInvalidStopModal({
        isOpen: true,
        position: { lat: stopData.lat, lng: stopData.lng },
        errorMessage: validation.message,
        distanceFromRoute: validation.distanceFromRoute || 0
      });
      return;
    }

    try {
      // Get accurate name from coordinates
      const accurateName = await getAccurateLocationName(
        stopData.lat,
        stopData.lng
      );
      
      const maxStopId = Math.max(...stopPoints.map(stop => stop.stopId));
      const newStopId = maxStopId + 1;
      
      const newStop: StopPoint = {
        ...stopData,
        stopId: newStopId,
        name: accurateName.name,
        address: accurateName.address
      };
      
      // Use setState callback to ensure immediate update
      setStopPoints(prevStops => {
        const updatedStops = [...prevStops];
        const destinationIndex = updatedStops.findIndex(stop => stop.type === 'DESTINATION');
        updatedStops.splice(destinationIndex, 0, newStop);
        
        // Reassign stop IDs
        const reassignedStops = updatedStops.map((stop, index) => ({
          ...stop,
          stopId: index + 1
        }));
        
        console.log('Manual search stop added:', reassignedStops);
        return reassignedStops;
      });
      
      setManualSearchModal({ isOpen: false });
      
      setToast({ 
        message: 'Stop added successfully!', 
        type: 'success' 
      });
      
      // Recalculate routes
      setIsRecalculating(true);
      setTimeout(() => {
        setStopPoints(prev => {
          loadRoutes(prev);
          return prev;
        });
        setIsRecalculating(false);
      }, 500);
    } catch (error) {
      console.error('Error adding stop:', error);
      setToast({ 
        message: 'Failed to add stop', 
        type: 'error' 
      });
    }
  };

  const handleOneClickAddStop = async () => {
    if (isFullCar) {
      setToast({ 
        message: 'Stops are not allowed for full car rides', 
        type: 'error' 
      });
      return;
    }

    try {
      // Find a point on the polyline route for midpoint
      if (polylinePath.length === 0) {
        setToast({ 
          message: 'No route selected. Please select a route first.', 
          type: 'error' 
        });
        return;
      }

      // Take the midpoint of the polyline
      const midIndex = Math.floor(polylinePath.length / 2);
      const midPoint = polylinePath[midIndex];
      
      // Get accurate name from coordinates
      const accurateName = await getAccurateLocationName(midPoint.lat, midPoint.lng);
      
      // Validate the stop location is on the polyline route
      const validation = validateStopOnPolylineRoute(
        midPoint,
        polylinePath,
        50
      );
      
      if (!validation.isValid) {
        setInvalidStopModal({
          isOpen: true,
          position: midPoint,
          errorMessage: validation.message,
          distanceFromRoute: validation.distanceFromRoute || 0
        });
        return;
      }
      
      const maxStopId = Math.max(...stopPoints.map(stop => stop.stopId));
      const newStopId = maxStopId + 1;
      
      const newStop: StopPoint = {
        stopId: newStopId,
        type: 'STOP',
        name: accurateName.name,
        address: accurateName.address,
        lat: midPoint.lat,
        lng: midPoint.lng
      };
      
      // Use setState callback to ensure immediate update
      setStopPoints(prevStops => {
        const updatedStops = [...prevStops];
        const destinationIndex = updatedStops.findIndex(stop => stop.type === 'DESTINATION');
        updatedStops.splice(destinationIndex, 0, newStop);
        
        // Reassign stop IDs
        const reassignedStops = updatedStops.map((stop, index) => ({
          ...stop,
          stopId: index + 1
        }));
        
        console.log('One-click stop added:', reassignedStops);
        return reassignedStops;
      });
      
      setToast({ 
        message: 'Stop added on route!', 
        type: 'success' 
      });
      
      // Recalculate routes
      setIsRecalculating(true);
      setTimeout(() => {
        setStopPoints(prev => {
          loadRoutes(prev);
          return prev;
        });
        setIsRecalculating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error adding midpoint stop:', error);
      setToast({ 
        message: 'Failed to add stop', 
        type: 'error' 
      });
    }
  };

  // Handle Map Click
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (isFullCar) {
      setAddStopModal({
        isOpen: true,
        position: null,
        address: '',
        isValid: false,
        validationMessage: ''
      });
      return;
    }

    if (!isAddStopMode || !e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      // Validate if the clicked location is on the polyline route (within 50km)
      const validation = validateStopOnPolylineRoute(
        { lat, lng },
        polylinePath,
        50
      );

      if (!validation.isValid) {
        setInvalidStopModal({
          isOpen: true,
          position: { lat, lng },
          errorMessage: validation.message,
          distanceFromRoute: validation.distanceFromRoute
        });
        return;
      }

      // Get accurate name and address
      const accurateName = await getAccurateLocationName(lat, lng);

      setAddStopModal({
        isOpen: true,
        position: { lat, lng },
        address: accurateName.address,
        isValid: validation.isValid,
        validationMessage: validation.message
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setInvalidStopModal({
        isOpen: true,
        position: { lat, lng },
        errorMessage: 'Unable to validate location. Please try again.',
        distanceFromRoute: 0
      });
    }
  };

  const confirmAddStop = async (stopData: StopPoint) => {
    if (isFullCar) {
      setAddStopModal({ 
        isOpen: false, 
        position: null, 
        address: '', 
        isValid: false, 
        validationMessage: '' 
      });
      setIsAddStopMode(false);
      return;
    }

    try {
      const maxStopId = Math.max(...stopPoints.map(stop => stop.stopId));
      const newStopId = maxStopId + 1;
      
      const newStop: StopPoint = {
        ...stopData,
        stopId: newStopId
      };
      
      // Use setState callback to ensure immediate update
      setStopPoints(prevStops => {
        const updatedStops = [...prevStops];
        const destinationIndex = updatedStops.findIndex(stop => stop.type === 'DESTINATION');
        updatedStops.splice(destinationIndex, 0, newStop);
        
        // Reassign stop IDs
        const reassignedStops = updatedStops.map((stop, index) => ({
          ...stop,
          stopId: index + 1
        }));
        
        console.log('Map click stop added:', reassignedStops);
        return reassignedStops;
      });
      
      setAddStopModal({ 
        isOpen: false, 
        position: null, 
        address: '', 
        isValid: false, 
        validationMessage: '' 
      });
      setIsAddStopMode(false);
      
      setToast({ 
        message: 'Stop added successfully!', 
        type: 'success' 
      });
      
      // Recalculate routes
      setIsRecalculating(true);
      setTimeout(() => {
        setStopPoints(prev => {
          loadRoutes(prev);
          return prev;
        });
        setIsRecalculating(false);
      }, 500);
    } catch (error) {
      console.error('Error adding stop:', error);
      setToast({ 
        message: 'Failed to add stop', 
        type: 'error' 
      });
    }
  };

  const removeStop = (stopId: number) => {
    if (isFullCar) {
      setToast({ 
        message: 'Cannot modify stops for full car rides', 
        type: 'error' 
      });
      return;
    }

    const stopToRemove = stopPoints.find(stop => stop.stopId === stopId);
    
    if (stopToRemove?.type === 'ORIGIN' || stopToRemove?.type === 'DESTINATION') {
      setToast({ 
        message: `Cannot remove ${stopToRemove.type}`, 
        type: 'error' 
      });
      return;
    }
    
    // Use setState callback to ensure immediate update
    setStopPoints(prevStops => {
      const newStops = prevStops.filter(stop => stop.stopId !== stopId);
      
      // Reassign stop IDs
      const reassignedStops = newStops.map((stop, index) => ({
        ...stop,
        stopId: index + 1
      }));
      
      console.log('Stop removed:', reassignedStops);
      return reassignedStops;
    });
    
    setToast({ 
      message: 'Stop removed successfully', 
      type: 'info' 
    });
    
    // Recalculate routes
    setIsRecalculating(true);
    setTimeout(() => {
      setStopPoints(prev => {
        loadRoutes(prev);
        return prev;
      });
      setIsRecalculating(false);
    }, 500);
  };

  const handleRouteSelect = (routeId: number) => {
    setSelectedRoute(routeId);
  };

  const handleNext = () => {
    const selectedRouteData = routes.find(r => r.id === selectedRoute);
    if (!selectedRouteData || !rideData) return;

    const totalDistanceKm = selectedRouteData.distanceMeters / 1000;
    const totalDuration = selectedRouteData.durationSeconds;
    const farePerKm = parseFloat(rideData.settings?.fare_per_km_car || '12');
    const seats = rideData.seats || 1;
    
    const calculatedPrice = Math.round((totalDistanceKm * farePerKm / seats) / 10) * 10;
    
    const fareCombinations = [];
    
    const sortedStops = [...stopPoints].sort((a, b) => a.stopId - b.stopId);
    
    for (let i = 0; i < sortedStops.length - 1; i++) {
      for (let j = i + 1; j < sortedStops.length; j++) {
        const fromStop = sortedStops[i];
        const toStop = sortedStops[j];
        
        let segmentDistance = 0;
        for (let k = i; k < j; k++) {
          segmentDistance += routeSegments[k]?.distance || 0;
        }
        
        const calculatedFare = segmentDistance * farePerKm / seats;
        const fare = Math.round(Math.max(10, calculatedFare) / 10) * 10;
        
        fareCombinations.push({
          from_stop_order: fromStop.stopId,
          to_stop_order: toStop.stopId,
          fare: fare,
          distance: segmentDistance,
          fare_per_km: farePerKm,
          seats: seats
        });
      }
    }

    const updatedRideData = {
      ...rideData,
      stopPoints: sortedStops,
      stops: sortedStops.filter(stop => stop.type === 'STOP'),
      fareCombinations,
      pricePerSeat: calculatedPrice,
      totalDistance: totalDistanceKm,
      totalDuration,
      selectedRoute: selectedRouteData,
      farePerKm: farePerKm,
      routeSegments: routeSegments,
      isFullCar: isFullCar,
      isNegotiable: rideData.isNegotiable,
      seatCount: seats
    };

    navigate('/offer-ride3', { state: updatedRideData });
  };

  const recalculateRoute = async (avoidTolls: boolean) => {
    if (!rideData) return;
    
    setIsRecalculating(true);
    try {
      const sortedStops = [...stopPoints].sort((a, b) => a.stopId - b.stopId);
      
      const intermediateStops = isFullCar 
        ? [] 
        : sortedStops
            .filter(stop => stop.type === 'STOP')
            .map(stop => ({ lat: stop.lat, lng: stop.lng }));

      const results = await computeRoutes(
        { lat: rideData.pickup.lat, lng: rideData.pickup.lng },
        { lat: rideData.drop.lat, lng: rideData.drop.lng },
        intermediateStops,
        avoidTolls
      );

      if (results.routes && results.routes.length > 0) {
        const routeOptions: RouteOption[] = results.routes.map((route, index) => {
          const durationSeconds = parseDurationToSeconds(route.duration);
          return {
            id: index + 1,
            duration: formatDuration(route.duration),
            durationSeconds,
            distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
            distanceMeters: route.distanceMeters,
            hasTolls: !!route.travelAdvisory?.tollInfo?.estimatedPrice,
            polyline: route.polyline?.encodedPolyline || '',
            legs: route.legs || [],
          };
        });

        setRoutes(routeOptions);
        if (routeOptions[0]) {
          setSelectedRoute(1);
        }
        
        if (results.routes[0]?.legs) {
          const segments = results.routes[0].legs.map((leg, index) => {
            const fromStop = sortedStops[index];
            const toStop = sortedStops[index + 1];
            
            return {
              from: fromStop?.name || 'Unknown',
              to: toStop?.name || 'Unknown',
              distance: leg.distanceMeters / 1000,
              duration: Math.round(parseDurationToSeconds(leg.duration) / 60)
            };
          });
          setRouteSegments(segments);
        }
      }
    } catch (error) {
      console.error('Error recalculating route:', error);
      setToast({ 
        message: 'Failed to recalculate route', 
        type: 'error' 
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const sortedStops = [...stopPoints].sort((a, b) => a.stopId - b.stopId);
  const fallbackPolylinePath = sortedStops.map(stop => ({ 
    lat: stop.lat, 
    lng: stop.lng 
  }));

  const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
  const destination = stopPoints.find(stop => stop.type === 'DESTINATION');

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-800">Error loading Google Maps</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 bg-[#21409A] text-white rounded-lg hover:bg-[#1a357c]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#21409A] mx-auto mb-3"></div>
          <p className="text-gray-800">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#21409A] mx-auto mb-3"></div>
          <p className="text-gray-800">Loading ride data...</p>
          <button
            onClick={() => navigate('/offer-ride1')}
            className="mt-3 px-3 py-1.5 bg-[#21409A] text-white rounded-lg hover:bg-[#1a357c]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Full Car Toggle Card
  const renderFullCarToggle = () => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isFullCar ? 'bg-[#21409A]' : 'bg-gray-100'}`}>
            <Navigation size={16} className={isFullCar ? 'text-white' : 'text-gray-600'} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 text-sm">Full Car (Private Ride)</h3>
            <p className="text-xs text-gray-500">
              {isFullCar 
                ? 'Direct ride without stops • Higher fare' 
                : 'Shared ride with stops • Split fare'}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isFullCar}
            onChange={(e) => {
              setIsFullCar(e.target.checked);
              if (e.target.checked) {
                const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
                const destination = stopPoints.find(stop => stop.type === 'DESTINATION');
                if (origin && destination) {
                  setStopPoints([origin, destination]);
                  setToast({
                    message: 'Switched to full car mode. All intermediate stops removed.',
                    type: 'info'
                  });
                }
              }
            }}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#21409A]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#21409A]"></div>
        </label>
      </div>
    </div>
  );

  // Render Routes Screen
  const renderRoutesScreen = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h1 className="text-lg font-bold text-gray-800">Available Routes</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {isFullCar ? 'Full car route - No stops allowed' : 'Select the best route for your journey'}
        </p>
      </div>

      {/* Full Car Toggle */}
      {renderFullCarToggle()}

      {/* Route Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => recalculateRoute(false)}
          disabled={isRecalculating}
          className="flex-1 py-2 text-xs bg-blue-50 text-[#21409A] rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          Fastest
        </button>
        <button
          onClick={() => recalculateRoute(true)}
          disabled={isRecalculating}
          className="flex-1 py-2 text-xs bg-blue-50 text-[#21409A] rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          No Tolls
        </button>
      </div>

      {/* Route Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#21409A] mx-auto mb-2"></div>
              <p className="text-gray-800 text-sm">Finding available routes...</p>
            </div>
          </div>
        ) : routes.length > 0 ? (
          <div className="space-y-2 pb-2">
            {routes.map((route) => (
              <div
                key={route.id}
                onClick={() => handleRouteSelect(route.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedRoute === route.id
                    ? 'border-[#21409A] bg-[#21409A]/5'
                    : 'border-gray-200 hover:border-[#21409A]/50 hover:bg-[#21409A]/2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Route Selection Radio */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedRoute === route.id ? 'border-[#21409A]' : 'border-gray-300'
                      }`}
                    >
                      {selectedRoute === route.id && (
                        <div className="w-2 h-2 rounded-full bg-[#21409A]" />
                      )}
                    </div>

                    {/* Route Info */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-800">{route.duration}</span>
                        <span
                          className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                            route.hasTolls
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {route.hasTolls ? 'With tolls' : 'No tolls'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-600">{route.distance}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-[#21409A] font-medium">
                          Route #{route.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isFullCar && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      Full Car
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Route className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-800 text-sm">No routes found</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Please check your pickup and drop locations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex-shrink-0 pt-3 border-t border-gray-200">
        <button
          onClick={() => {
            if (selectedRoute) {
              setCurrentScreen('stops');
            }
          }}
          disabled={isLoading || routes.length === 0 || !selectedRoute || isRecalculating}
          className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            !isLoading && routes.length > 0 && selectedRoute && !isRecalculating
              ? 'bg-[#21409A] text-white hover:bg-[#1a357c]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRecalculating ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-sm">Recalculating...</span>
            </>
          ) : (
            <>
              <span className="text-sm">{isFullCar ? 'Continue to Vehicle Selection' : 'Continue to Add Stops'}</span>
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render Stops Screen
  const renderStopsScreen = () => (
    <div className="h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentScreen('routes')}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back to routes"
          >
            <ArrowLeft size={16} className="text-gray-800" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {isFullCar ? 'Full Car Ride' : 'Add Stops'}
            </h1>
            <p className="text-xs text-gray-500">
              {isFullCar 
                ? 'Direct ride without intermediate stops' 
                : 'Add stops within 50km of the selected route'}
            </p>
          </div>
        </div>
      </div>

      {/* Full Car Toggle */}
      {renderFullCarToggle()}

      {/* If Full Car, show info message instead of stop controls */}
      {isFullCar ? (
        <div className="mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-800 text-sm mb-0.5">Full Car Mode</h3>
              <p className="text-xs text-gray-600">
                This is a private ride. No intermediate stops are allowed. 
                The ride will go directly from pickup to destination with a single base fare.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stop Controls */}
          <div className="flex flex-col sm:flex-row gap-1.5 mb-3 flex-shrink-0">
            <button
              onClick={handleOneClickAddStop}
              disabled={isRecalculating || isFullCar || polylinePath.length === 0}
              className={`flex-1 py-2 text-xs rounded-lg flex items-center justify-center gap-1 ${
                isFullCar || polylinePath.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              <Plus size={12} />
              <span>Quick Add</span>
            </button>
            
            <button
              onClick={() => {
                if (isFullCar) {
                  setAddStopModal({
                    isOpen: true,
                    position: null,
                    address: '',
                    isValid: false,
                    validationMessage: ''
                  });
                  return;
                }
                if (polylinePath.length === 0) {
                  setToast({ 
                    message: 'Please select a route first', 
                    type: 'error' 
                  });
                  return;
                }
                setIsAddStopMode(true);
                setToast({ 
                  message: 'Click on map along the route line to add a stop (within 50km)', 
                  type: 'info' 
                });
              }}
              disabled={isRecalculating || isAddStopMode || polylinePath.length === 0}
              className={`flex-1 py-2 text-xs rounded-lg flex items-center justify-center gap-1 ${
                isAddStopMode
                  ? 'bg-amber-500 text-white'
                  : polylinePath.length === 0
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-[#21409A] text-white hover:bg-[#1a357c]'
              } disabled:opacity-50`}
            >
              <Plus size={12} />
              <span>Add on Map</span>
            </button>

            <button
              onClick={() => {
                if (polylinePath.length === 0) {
                  setToast({ 
                    message: 'Please select a route first', 
                    type: 'error' 
                  });
                  return;
                }
                setManualSearchModal({ isOpen: true });
              }}
              disabled={isRecalculating || isFullCar || polylinePath.length === 0}
              className={`flex-1 py-2 text-xs rounded-lg flex items-center justify-center gap-1 ${
                isFullCar || polylinePath.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#21409A] text-white hover:bg-[#1a357c]'
              } disabled:opacity-50`}
            >
              <Search size={12} />
              <span>Search Cities</span>
            </button>
          </div>

          {isAddStopMode && (
            <div className="mb-2 flex-shrink-0">
              <button
                onClick={() => setIsAddStopMode(false)}
                className="w-full py-1.5 text-xs bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Cancel Add Stop Mode
              </button>
            </div>
          )}
          
          {/* Route Info */}
          {polylinePath.length > 0 && (
            <div className="mb-2 flex-shrink-0 p-2 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Info size={12} className="text-blue-600" />
                <div className="text-xs text-blue-700">
                  <span className="font-medium">Note:</span> Stops must be within 50km of the selected route line
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stops List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-medium text-gray-800">
              {isFullCar ? 'Route Points' : `All Stops (${stopPoints.length})`}
            </h3>
          </div>
          
          <div className="space-y-1.5">
            {stopPoints
              .sort((a, b) => a.stopId - b.stopId)
              .map((stop) => (
                <div
                  key={stop.stopId}
                  className={`flex items-center justify-between p-1.5 rounded-lg ${
                    stop.type === 'ORIGIN' ? 'bg-green-50' :
                    stop.type === 'DESTINATION' ? 'bg-red-50' :
                    'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      stop.type === 'ORIGIN' ? 'bg-green-600 text-white' :
                      stop.type === 'DESTINATION' ? 'bg-red-600 text-white' :
                      'bg-[#21409A] text-white'
                    }`}>
                      {stop.type === 'ORIGIN' && 'P'}
                      {stop.type === 'DESTINATION' && 'D'}
                      {stop.type === 'STOP' && stop.stopId - 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {stop.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {stop.address}
                      </div>
                    </div>
                  </div>
                  {stop.type === 'STOP' && !isFullCar && (
                    <button
                      onClick={() => removeStop(stop.stopId)}
                      className="p-0.5 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-1"
                      aria-label="Remove stop"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}

            {!isFullCar && stopPoints.filter(stop => stop.type === 'STOP').length === 0 && (
              <div className="text-center py-3 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                <MapPin className="w-5 h-5 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No intermediate stops</p>
                <p className="text-xs mt-0.5">
                  Add stops within 50km of the route line
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue to Next Button */}
      <div className="flex-shrink-0 pt-2 border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={isRecalculating}
          className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            !isRecalculating
              ? 'bg-[#21409A] text-white hover:bg-[#1a357c]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRecalculating ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-sm">Updating route...</span>
            </>
          ) : (
            <>
              <span className="text-sm">Continue to Vehicle Selection</span>
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Mobile Floating Action Button for Map Toggle
  const MobileFAB = () => (
    <button
      onClick={() => setMapExpanded(!mapExpanded)}
      className="fixed bottom-16 right-3 z-40 p-2.5 bg-[#21409A] text-white rounded-full shadow-lg flex items-center justify-center"
      aria-label={mapExpanded ? "Show options" : "Expand map"}
    >
      {mapExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </button>
  );

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Navbar />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-16 left-3 z-20 p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors border border-gray-300"
        aria-label="Go back to previous page"
      >
        <ArrowLeft size={18} className="text-gray-800" />
      </button>

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Manual Search Modal */}
      {origin && destination && (
        <ManualStopSearchModal
          isOpen={manualSearchModal.isOpen}
          onClose={() => setManualSearchModal({ isOpen: false })}
          onConfirm={handleManualSearchStop}
          origin={{ lat: origin.lat, lng: origin.lng }}
          destination={{ lat: destination.lat, lng: destination.lng }}
          isFullCar={isFullCar}
          polylinePoints={polylinePath}
          onSearchPlaces={handleSearchPlaces}
        />
      )}

      {/* Add Stop Modal */}
      <AddStopModal
        isOpen={addStopModal.isOpen}
        onClose={() => {
          setAddStopModal({ 
            isOpen: false, 
            position: null, 
            address: '', 
            isValid: false, 
            validationMessage: '' 
          });
          setIsAddStopMode(false);
        }}
        onConfirm={confirmAddStop}
        position={addStopModal.position}
        address={addStopModal.address}
        isValid={addStopModal.isValid}
        validationMessage={addStopModal.validationMessage}
        isFullCar={isFullCar}
      />

      {/* Invalid Stop Modal */}
      <InvalidStopModal
        isOpen={invalidStopModal.isOpen}
        onClose={() => setInvalidStopModal({ 
          isOpen: false, 
          position: null, 
          errorMessage: '', 
          distanceFromRoute: 0 
        })}
        stopLocation={invalidStopModal.position || { lat: 0, lng: 0 }}
        polylinePoints={polylinePath}
        errorMessage={invalidStopModal.errorMessage}
        distanceFromRoute={invalidStopModal.distanceFromRoute}
      />

      <div className="flex-1 pt-14 overflow-hidden">
        {/* Responsive Layout */}
        <div className={`h-full ${isMobile ? (mapExpanded ? 'hidden' : 'block') : 'max-w-6xl mx-auto px-3 py-3'}`}>
          {/* Mobile - Full width panel when map is not expanded */}
          {isMobile ? (
            <div className="h-full bg-white">
              <div className="p-3 h-full">
                {currentScreen === 'routes' ? renderRoutesScreen() : renderStopsScreen()}
              </div>
            </div>
          ) : (
            /* Desktop/Tablet - Responsive grid */
            <div className={`grid gap-3 h-full ${isTablet ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Options Panel */}
              <div className={`${isTablet ? (mapExpanded ? 'hidden' : 'block') : 'h-full'}`}>
                <div className="bg-white rounded-lg p-3 border border-gray-200 h-full">
                  {currentScreen === 'routes' ? renderRoutesScreen() : renderStopsScreen()}
                </div>
              </div>

              {/* Map Panel */}
              <div className={`${isTablet ? (mapExpanded ? 'col-span-2' : 'hidden') : 'h-full'}`}>
                <div ref={mapContainerRef} className="h-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 relative">
                  {isLoaded && (
                    <>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={(map) => setMap(map)}
                        onClick={handleMapClick}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false,
                          zoomControl: true,
                          clickableIcons: false,
                          styles: [
                            {
                              featureType: 'poi',
                              elementType: 'labels',
                              stylers: [{ visibility: 'off' }]
                            },
                            {
                              featureType: 'transit',
                              elementType: 'labels.icon',
                              stylers: [{ visibility: 'off' }]
                            }
                          ]
                        }}
                      >
                        {/* Render all stops as markers */}
                        {stopPoints.map((stop) => (
                          <Marker
                            key={stop.stopId}
                            position={{ lat: stop.lat, lng: stop.lng }}
                            draggable={stop.type === 'STOP' && !isFullCar}
                            onDragStart={() => setActiveStopIndex(stop.stopId)}
                            onDragEnd={async (e) => {
                              if (!e.latLng || isFullCar) return;
                              const lat = e.latLng.lat();
                              const lng = e.latLng.lng();
                              
                              // Validate the new position is on the polyline route
                              const validation = validateStopOnPolylineRoute(
                                { lat, lng },
                                polylinePath,
                                50
                              );
                              
                              if (!validation.isValid) {
                                setInvalidStopModal({
                                  isOpen: true,
                                  position: { lat, lng },
                                  errorMessage: validation.message,
                                  distanceFromRoute: validation.distanceFromRoute || 0
                                });
                                return;
                              }
                              
                              // Get accurate name for new location
                              const accurateName = await getAccurateLocationName(lat, lng);
                              
                              setStopPoints(prevStops => {
                                const updatedStops = prevStops.map(s => 
                                  s.stopId === stop.stopId 
                                    ? { 
                                        ...s, 
                                        lat, 
                                        lng,
                                        name: accurateName.name,
                                        address: accurateName.address
                                      }
                                    : s
                                );
                                console.log('Stop dragged and updated:', updatedStops);
                                return updatedStops;
                              });
                              
                              setActiveStopIndex(null);
                              
                              setIsRecalculating(true);
                              setTimeout(() => {
                                setStopPoints(prev => {
                                  loadRoutes(prev);
                                  return prev;
                                });
                                setIsRecalculating(false);
                              }, 500);
                            }}
                            icon={{
                              path: google.maps.SymbolPath.CIRCLE,
                              fillColor: stop.type === 'ORIGIN' ? '#10B981' :
                                        stop.type === 'DESTINATION' ? '#EF4444' :
                                        activeStopIndex === stop.stopId ? '#8B5CF6' : '#21409A',
                              fillOpacity: 1,
                              strokeColor: '#FFFFFF',
                              strokeWeight: 2,
                              scale: stop.type === 'STOP' ? 6 : 8
                            }}
                            label={{
                              text: stop.type === 'ORIGIN' ? 'P' : 
                                    stop.type === 'DESTINATION' ? 'D' : 
                                    (stop.stopId - 1).toString(),
                              color: '#FFFFFF',
                              fontSize: stop.type === 'STOP' ? '9px' : '11px',
                              fontWeight: 'bold'
                            }}
                          />
                        ))}

                        {/* Route Polyline with highlight effect */}
                        <Polyline
                          path={polylinePath.length > 0 ? polylinePath : fallbackPolylinePath}
                          options={{
                            strokeColor: isFullCar ? '#8B5CF6' : '#21409A',
                            strokeOpacity: 0.8,
                            strokeWeight: isFullCar ? 4 : 3,
                            geodesic: true
                          }}
                        />
                      </GoogleMap>
                    </>
                  )}

                  {/* Map Controls */}
                  <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium text-gray-800 border border-gray-300 shadow-sm max-w-[70%]">
                    <div className="flex items-center gap-1">
                      <Navigation size={12} className={isFullCar ? "text-purple-600" : "text-[#21409A]"} />
                      <span className="truncate text-xs">
                        {origin?.name || 'Origin'} → 
                        {destination?.name || 'Destination'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {isFullCar ? 'Full Car • No Stops' : `${stopPoints.filter(stop => stop.type === 'STOP').length} intermediate stops`}
                    </div>
                    {selectedRouteData && (
                      <div className={`text-xs font-medium mt-0.5 ${isFullCar ? 'text-purple-600' : 'text-[#21409A]'}`}>
                        {selectedRouteData.distance} • {selectedRouteData.duration}
                      </div>
                    )}
                    {!isFullCar && polylinePath.length > 0 && (
                      <div className="text-xs text-blue-600 font-medium mt-0.5">
                        ✓ Stops must be within 50km of route
                      </div>
                    )}
                  </div>

                  {/* Map Mode Indicator */}
                  {isAddStopMode && !isFullCar && (
                    <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white px-2 py-1 rounded text-sm font-medium shadow-sm animate-pulse">
                      <Map size={12} className="inline mr-1" />
                      <span className="text-xs">Click route to add stop</span>
                    </div>
                  )}

                  {/* Full Car Indicator */}
                  {isFullCar && (
                    <div className="absolute top-2 right-2 z-10 bg-purple-500 text-white px-2 py-1 rounded text-sm font-medium shadow-sm">
                      <Navigation size={12} className="inline mr-1" />
                      <span className="text-xs">Full Car</span>
                    </div>
                  )}

                  {/* Back to Options Button (Tablet) */}
                  {isTablet && mapExpanded && (
                    <button
                      onClick={() => setMapExpanded(false)}
                      className="absolute top-2 left-2 z-10 p-1.5 bg-white rounded-full shadow-lg"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Map Full Screen View */}
        {isMobile && mapExpanded && (
          <div className="h-full">
            <div ref={mapContainerRef} className="h-full w-full">
              {isLoaded && (
                <>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={mapZoom}
                    onLoad={(map) => setMap(map)}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      zoomControl: true,
                      clickableIcons: false,
                      styles: [
                        {
                          featureType: 'poi',
                          elementType: 'labels',
                          stylers: [{ visibility: 'off' }]
                        }
                      ]
                    }}
                  >
                    {/* Render all stops as markers */}
                    {stopPoints.map((stop) => (
                      <Marker
                        key={stop.stopId}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        draggable={stop.type === 'STOP' && !isFullCar}
                        onDragStart={() => setActiveStopIndex(stop.stopId)}
                        onDragEnd={async (e) => {
                          if (!e.latLng || isFullCar) return;
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          
                          // Validate the new position is on the polyline route
                          const validation = validateStopOnPolylineRoute(
                            { lat, lng },
                            polylinePath,
                            50
                          );
                          
                          if (!validation.isValid) {
                            setInvalidStopModal({
                              isOpen: true,
                              position: { lat, lng },
                              errorMessage: validation.message,
                              distanceFromRoute: validation.distanceFromRoute || 0
                            });
                            return;
                          }
                          
                          // Get accurate name for new location
                          const accurateName = await getAccurateLocationName(lat, lng);
                          
                          setStopPoints(prevStops => {
                            const updatedStops = prevStops.map(s => 
                              s.stopId === stop.stopId 
                                ? { 
                                    ...s, 
                                    lat, 
                                    lng,
                                    name: accurateName.name,
                                    address: accurateName.address
                                  }
                                : s
                            );
                            console.log('Mobile: Stop dragged and updated:', updatedStops);
                            return updatedStops;
                          });
                          
                          setActiveStopIndex(null);
                          
                          setIsRecalculating(true);
                          setTimeout(() => {
                            setStopPoints(prev => {
                              loadRoutes(prev);
                              return prev;
                            });
                            setIsRecalculating(false);
                          }, 500);
                        }}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: stop.type === 'ORIGIN' ? '#10B981' :
                                    stop.type === 'DESTINATION' ? '#EF4444' :
                                    activeStopIndex === stop.stopId ? '#8B5CF6' : '#21409A',
                          fillOpacity: 1,
                          strokeColor: '#FFFFFF',
                          strokeWeight: 2,
                          scale: stop.type === 'STOP' ? 6 : 8
                        }}
                        label={{
                          text: stop.type === 'ORIGIN' ? 'P' : 
                                stop.type === 'DESTINATION' ? 'D' : 
                                (stop.stopId - 1).toString(),
                          color: '#FFFFFF',
                          fontSize: stop.type === 'STOP' ? '9px' : '11px',
                          fontWeight: 'bold'
                        }}
                      />
                    ))}

                    {/* Route Polyline */}
                    <Polyline
                      path={polylinePath.length > 0 ? polylinePath : fallbackPolylinePath}
                      options={{
                        strokeColor: isFullCar ? '#8B5CF6' : '#21409A',
                        strokeOpacity: 0.8,
                        strokeWeight: isFullCar ? 4 : 3,
                        geodesic: true
                      }}
                    />
                  </GoogleMap>
                </>
              )}

              {/* Mobile Map Controls */}
              <button
                onClick={() => setMapExpanded(false)}
                className="absolute top-3 left-3 z-10 p-1.5 bg-white rounded-full shadow-lg"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Mobile Route Info */}
              <div className="absolute bottom-16 left-3 right-3 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">
                      {origin?.name} → 
                      {destination?.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
                      <span>{selectedRouteData?.distance}</span>
                      <span>•</span>
                      <span>{selectedRouteData?.duration}</span>
                      {isFullCar && <span className="text-purple-600 font-medium">• Full Car</span>}
                    </div>
                    {!isFullCar && (
                      <div className="text-xs text-blue-600 font-medium mt-0.5">
                        ✓ Stops must be within 50km of route
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setMapExpanded(false)}
                    className="ml-2 px-2 py-1 bg-[#21409A] text-white text-xs rounded-lg flex-shrink-0"
                  >
                    Options
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile FAB */}
        {isMobile && <MobileFAB />}
      </div>
    </div>
  );
};

export default OfferRide2;