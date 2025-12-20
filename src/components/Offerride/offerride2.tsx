// OfferRide2.tsx - FIXED HEIGHT WITHOUT SCROLL
import React, { useState, useEffect, useRef } from 'react';
import { CircleArrowRight, RefreshCw, Plus, MapPin, ArrowLeft, Navigation, AlertCircle, Trash2, Info, X, Map, Route, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import Navbar from '../layout/Navbar';
import { computeRoutes } from '../../services/routesApi';
import { reverseGeocode, calculateDistance, isStopBetweenRoute } from '../../services/placesApi';
import { StopPoint, Location, RouteOption } from '../../types';
import { log } from 'console';

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
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}>
      <AlertCircle size={18} />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2">
        <X size={16} />
      </button>
    </div>
  );
};

// Modal Component for Add Stop Confirmation
const AddStopModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stopData: StopPoint) => void;
  position: { lat: number; lng: number } | null;
  address: string;
  isValid: boolean;
  validationMessage: string;
}> = ({ isOpen, onClose, onConfirm, position, address, isValid, validationMessage }) => {
  const [stopName, setStopName] = useState('');

  useEffect(() => {
    if (address && !stopName) {
      const name = address.split(',')[0].trim();
      setStopName(name);
    }
  }, [address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Add New Stop</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Stop Name:</div>
          <input
            type="text"
            value={stopName}
            onChange={(e) => setStopName(e.target.value)}
            placeholder="Enter stop name"
            className="w-full p-3 border border-border rounded-lg font-medium text-foreground bg-transparent"
          />
        </div>

        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Location Address:</div>
          <div className="font-medium text-foreground p-3 bg-accent/30 rounded-lg">
            {address || 'Fetching address...'}
          </div>
          {position && (
            <div className="text-xs text-muted-foreground mt-2">
              Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div className={`mb-4 p-3 rounded-lg ${isValid ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'}`}>
          <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            <AlertCircle size={16} />
            <span className="text-sm">{validationMessage}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
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
            disabled={!isValid || !stopName}
            className={`flex-1 py-2.5 rounded-lg font-medium ${
              isValid && stopName
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add Stop
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-accent"
          >
            Cancel
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
  
  // Screen state: 'routes' or 'stops'
  const [currentScreen, setCurrentScreen] = useState<'routes' | 'stops'>('routes');
  
  // Google Maps state
  const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 });
  const [mapZoom, setMapZoom] = useState(10);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // Add stop modal state
  const [addStopModal, setAddStopModal] = useState({
    isOpen: false,
    position: null as { lat: number; lng: number } | null,
    address: '',
    isValid: false,
    validationMessage: ''
  });
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Add stop mode state
  const [isAddStopMode, setIsAddStopMode] = useState(false);
  
  // Active stop for dragging
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);

  // Route segments info
  const [routeSegments, setRouteSegments] = useState<Array<{
    from: string;
    to: string;
    distance: number;
    duration: number;
  }>>([]);
  
  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCsWQJdiuPGmabvpX-_4FhyC9C5GKu3TLk',
    libraries: LIBRARIES
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    
    // Initialize stopPoints with Origin and Destination
    const initialStops: StopPoint[] = [
      {
        stopId: 1,
        type: 'ORIGIN',
        name: rideData.pickup.name || rideData.pickup.address.split(',')[0] || 'Origin',
        address: rideData.pickup.address || 'Origin Location',
        lat: rideData.pickup.lat,
        lng: rideData.pickup.lng
      },
      {
        stopId: 2,
        type: 'DESTINATION',
        name: rideData.drop.name || rideData.drop.address.split(',')[0] || 'Destination',
        address: rideData.drop.address || 'Destination Location',
        lat: rideData.drop.lat,
        lng: rideData.drop.lng
      }
    ];
    
    setStopPoints(initialStops);
    loadRoutes(initialStops);
  }, [rideData, navigate]);

  const loadRoutes = async (stops: StopPoint[]) => {
    setIsLoading(true);
    try {
      const sortedStops = [...stops].sort((a, b) => a.stopId - b.stopId);
      
      const intermediateStops = sortedStops
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
      return `${hours}h ${minutes}min`;
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

  // Add intermediate stop at midpoint
  const handleOneClickAddStop = async () => {
    try {
      const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
      const destination = stopPoints.find(stop => stop.type === 'DESTINATION');
      
      if (!origin || !destination) return;
      
      const midLat = (origin.lat + destination.lat) / 2;
      const midLng = (origin.lng + destination.lng) / 2;
      
      const reverseResults = await reverseGeocode(midLat, midLng);
      const address = reverseResults.length > 0 
        ? reverseResults[0].displayName.text 
        : `Midpoint stop`;
      
      const name = address.split(',')[0].trim();
      
      const validation = isStopBetweenRoute(
        { lat: midLat, lng: midLng },
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
        100
      );
      
      if (!validation.isValid) {
        setToast({ 
          message: `❌ Cannot add stop: ${validation.message}`, 
          type: 'error' 
        });
        return;
      }
      
      const maxStopId = Math.max(...stopPoints.map(stop => stop.stopId));
      const newStopId = maxStopId + 1;
    console.log("New Stop ID: ", newStopId);
      const newStop: StopPoint = {
        stopId: newStopId,
        type: 'STOP',
        name: name,
        address: address,
        lat: midLat,
        lng: midLng
      };
      console.log("New Stop: ", newStop);
      const updatedStops = [...stopPoints];
      const destinationIndex = updatedStops.findIndex(stop => stop.type === 'DESTINATION');
      updatedStops.splice(destinationIndex, 0, newStop);
      
      const reassignedStops = updatedStops.map((stop, index) => ({
        ...stop,
        stopId: index + 1
      }));
      
      setStopPoints(reassignedStops);
      
      setToast({ 
        message: '✅ Stop added at midpoint!', 
        type: 'success' 
      });
      
      setIsRecalculating(true);
      setTimeout(() => {
        loadRoutes(reassignedStops);
        setIsRecalculating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error adding midpoint stop:', error);
      setToast({ 
        message: '❌ Failed to add stop', 
        type: 'error' 
      });
    }
  };

  // Handle map click for adding stops
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!isAddStopMode || !e.latLng) return;
     console.log("Map Clicked at: ", e.latLng.toJSON());
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      const origin = stopPoints.find(stop => stop.type === 'ORIGIN');
      const destination = stopPoints.find(stop => stop.type === 'DESTINATION');
      
      if (!origin || !destination) {
        setToast({ 
          message: '❌ Origin and Destination not found', 
          type: 'error' 
        });
        return;
      }

      const reverseResults = await reverseGeocode(lat, lng);
      const address = reverseResults.length > 0 
        ? reverseResults[0].displayName.text 
        : `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
console.log("Reverse Geocode Address: ", address);
      const validation = isStopBetweenRoute(
        { lat, lng },
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
        100
      );
console.log("Validation Result: ", validation);
      setAddStopModal({
        isOpen: true,
        position: { lat, lng },
        address,
        isValid: validation.isValid,
        validationMessage: validation.message
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddStopModal({
        isOpen: true,
        position: { lat, lng },
        address: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        isValid: false,
        validationMessage: 'Unable to validate location. Please try again.'
      });
    }
  };

  // Confirm adding stop
  const confirmAddStop = async (stopData: StopPoint) => {
    try {
      const maxStopId = Math.max(...stopPoints.map(stop => stop.stopId));
      const newStopId = maxStopId + 1;
      
      const newStop: StopPoint = {
        ...stopData,
        stopId: newStopId
      };
      
      const updatedStops = [...stopPoints];
      const destinationIndex = updatedStops.findIndex(stop => stop.type === 'DESTINATION');
      updatedStops.splice(destinationIndex, 0, newStop);
      
      const reassignedStops = updatedStops.map((stop, index) => ({
        ...stop,
        stopId: index + 1
      }));
      
      setStopPoints(reassignedStops);
      setAddStopModal({ 
        isOpen: false, 
        position: null, 
        address: '', 
        isValid: false, 
        validationMessage: '' 
      });
      setIsAddStopMode(false);
      
      setToast({ 
        message: '✅ Stop added successfully!', 
        type: 'success' 
      });
      
      setIsRecalculating(true);
      setTimeout(() => {
        loadRoutes(reassignedStops);
        setIsRecalculating(false);
      }, 500);
    } catch (error) {
      console.error('Error adding stop:', error);
      setToast({ 
        message: '❌ Failed to add stop', 
        type: 'error' 
      });
    }
  };

  const removeStop = (stopId: number) => {
    const stopToRemove = stopPoints.find(stop => stop.stopId === stopId);
    
    if (stopToRemove?.type === 'ORIGIN' || stopToRemove?.type === 'DESTINATION') {
      setToast({ 
        message: `❌ Cannot remove ${stopToRemove.type}`, 
        type: 'error' 
      });
      return;
    }
    
    const newStops = stopPoints.filter(stop => stop.stopId !== stopId);
    
    const reassignedStops = newStops.map((stop, index) => ({
      ...stop,
      stopId: index + 1
    }));
    
    setStopPoints(reassignedStops);
    
    setToast({ 
      message: 'ℹ️ Stop removed successfully', 
      type: 'info' 
    });
    
    setIsRecalculating(true);
    setTimeout(() => {
      loadRoutes(reassignedStops);
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
    
    const calculatedPrice = Math.round(Math.max(10, totalDistanceKm * farePerKm * seats));
    
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
        
        const calculatedFare = segmentDistance * farePerKm * seats;
        const fare = Math.round(Math.max(10, calculatedFare));
        
        fareCombinations.push({
          from_stop_order: fromStop.stopId,
          to_stop_order: toStop.stopId,
          fare: fare,
        });
      }
    }

    const updatedRideData = {
      ...rideData,
      stopPoints: sortedStops,
      stops: sortedStops.filter(stop => stop.type === 'STOP'),
      fareCombinations,
      pricePerSeat: Math.round(calculatedPrice / seats),
      totalDistance: totalDistanceKm,
      totalDuration,
      selectedRoute: selectedRouteData,
      farePerKm: farePerKm,
      routeSegments: routeSegments,
    };

    console.log('Navigating to OfferRide3 with stopPoints:', sortedStops);
    navigate('/offer-ride3', { state: updatedRideData });
  };

  const recalculateRoute = async (avoidTolls: boolean) => {
    if (!rideData) return;
    
    setIsRecalculating(true);
    try {
      const sortedStops = [...stopPoints].sort((a, b) => a.stopId - b.stopId);
      const intermediateStops = sortedStops
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
        message: '❌ Failed to recalculate route', 
        type: 'error' 
      });
    } finally {
      setIsRecalculating(false);
    }
  };

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

  const selectedRouteData = routes.find(r => r.id === selectedRoute);
  const polylinePath = selectedRouteData?.polyline 
    ? decodePolyline(selectedRouteData.polyline)
    : [];

  const sortedStops = [...stopPoints].sort((a, b) => a.stopId - b.stopId);
  const fallbackPolylinePath = sortedStops.map(stop => ({ 
    lat: stop.lat, 
    lng: stop.lng 
  }));

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground">Error loading Google Maps</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading ride data...</p>
          <button
            onClick={() => navigate('/offer-ride1')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render Routes Screen (Left Column) - FIXED HEIGHT
  const renderRoutesScreen = () => (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Available Routes</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Select the best route for your journey
        </p>
      </div>

      {/* Route Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => recalculateRoute(false)}
          disabled={isRecalculating}
          className="flex-1 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
        >
          Fastest
        </button>
        <button
          onClick={() => recalculateRoute(true)}
          disabled={isRecalculating}
          className="flex-1 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
        >
          No Tolls
        </button>
      </div>

      {/* Route Cards - Fixed height with no scroll */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground">Finding available routes...</p>
            </div>
          </div>
        ) : routes.length > 0 ? (
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedRoute === route.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Route Selection Radio */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedRoute === route.id ? 'border-primary' : 'border-muted-foreground/40'
                        }`}
                      >
                        {selectedRoute === route.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Route Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">{route.duration}</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              route.hasTolls
                                ? 'bg-primary/10 text-primary'
                                : 'bg-green-500/10 text-green-600'
                            }`}
                          >
                            {route.hasTolls ? 'With tolls' : 'No tolls'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{route.distance}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-primary font-medium">
                            Route #{route.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground">No routes found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check your pickup and drop locations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button - Fixed at bottom */}
      <div className="flex-shrink-0 pt-4 border-t border-border">
        <button
          onClick={() => {
            if (selectedRoute) {
              setCurrentScreen('stops');
            }
          }}
          disabled={isLoading || routes.length === 0 || !selectedRoute || isRecalculating}
          className={`w-full py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            !isLoading && routes.length > 0 && selectedRoute && !isRecalculating
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isRecalculating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <span>Continue to Add Stops</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
        
        {isRecalculating && (
          <div className="text-center mt-2 text-xs text-muted-foreground">
            Updating route information...
          </div>
        )}
      </div>
    </div>
  );

  // Render Stops Screen (Left Column) - FIXED HEIGHT
  const renderStopsScreen = () => (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header with Back Button */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setCurrentScreen('routes')}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors"
            aria-label="Go back to routes"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add Stops</h1>
            <p className="text-sm text-muted-foreground">
              Add intermediate stops to your route
            </p>
          </div>
        </div>
      </div>

      {/* Stop Controls */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <button
          onClick={handleOneClickAddStop}
          disabled={isRecalculating}
          className="flex-1 py-2.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Quick Add
        </button>
        
        <button
          onClick={() => {
            setIsAddStopMode(true);
            setToast({ 
              message: 'Click on map to add a stop', 
              type: 'info' 
            });
          }}
          disabled={isRecalculating || isAddStopMode}
          className={`flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${
            isAddStopMode
              ? 'bg-amber-500 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          <Plus size={14} />
          Add on Map
        </button>
      </div>

      {isAddStopMode && (
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={() => setIsAddStopMode(false)}
            className="w-full py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-accent"
          >
            Cancel Add Stop Mode
          </button>
        </div>
      )}

      {/* Stops List - Fixed height with no scroll */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto pr-1">
          <div className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">All Stops ({stopPoints.length})</h3>
              <div className="text-xs text-muted-foreground">
                Drag stops on map
              </div>
            </div>
            
            <div className="space-y-2">
              {stopPoints
                .sort((a, b) => a.stopId - b.stopId)
                .map((stop) => (
                  <div
                    key={stop.stopId}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      stop.type === 'ORIGIN' ? 'bg-green-50' :
                      stop.type === 'DESTINATION' ? 'bg-red-50' :
                      'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        stop.type === 'ORIGIN' ? 'bg-green-500 text-white' :
                        stop.type === 'DESTINATION' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {stop.type === 'ORIGIN' && 'P'}
                        {stop.type === 'DESTINATION' && 'D'}
                        {stop.type === 'STOP' && stop.stopId - 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {stop.name}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            stop.type === 'ORIGIN' ? 'bg-green-100 text-green-800' :
                            stop.type === 'DESTINATION' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {stop.type.charAt(0)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {stop.address}
                        </div>
                      </div>
                    </div>
                    {stop.type === 'STOP' && (
                      <button
                        onClick={() => removeStop(stop.stopId)}
                        className="p-1 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                        aria-label="Remove stop"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}

              {stopPoints.filter(stop => stop.type === 'STOP').length === 0 && (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-border rounded-lg">
                  <MapPin className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-sm">No intermediate stops</p>
                  <p className="text-xs mt-0.5">
                    Add stops to customize route
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Continue to Next Button - Fixed at bottom */}
      <div className="flex-shrink-0 pt-3 border-t border-border">
        <button
          onClick={handleNext}
          disabled={isRecalculating}
          className={`w-full py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            !isRecalculating
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isRecalculating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Updating route...
            </>
          ) : (
            <>
              <span>Continue to Vehicle Selection</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
        
        <div className="text-center mt-2 text-xs text-muted-foreground">
          Route #{selectedRoute} • {selectedRouteData?.distance} • {selectedRouteData?.duration}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <Navbar />

      {/* Back Button (Fixed to go back to OfferRide1) */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-20 left-4 z-20 p-2 bg-card hover:bg-accent rounded-full transition-colors border border-border"
        aria-label="Go back to previous page"
      >
        <ArrowLeft size={20} className="text-foreground" />
      </button>

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
      />

      <div className="flex-1 pt-16 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Fixed height container */}
          <div className="h-full">
            <div className="bg-card rounded-xl p-4 border border-border h-full">
              {currentScreen === 'routes' ? renderRoutesScreen() : renderStopsScreen()}
            </div>
          </div>

          {/* RIGHT COLUMN - Google Map - Fixed height */}
          <div className="h-full">
            <div ref={mapContainerRef} className="h-full rounded-xl overflow-hidden border border-border bg-muted relative">
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
                        draggable={stop.type === 'STOP'}
                        onDragStart={() => setActiveStopIndex(stop.stopId)}
                        onDragEnd={(e) => {
                          if (!e.latLng) return;
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          
                          const origin = stopPoints.find(s => s.type === 'ORIGIN');
                          const destination = stopPoints.find(s => s.type === 'DESTINATION');
                          
                          if (!origin || !destination || stop.type === 'ORIGIN' || stop.type === 'DESTINATION') {
                            return;
                          }
                          
                          const updatedStops = stopPoints.map(s => 
                            s.stopId === stop.stopId 
                              ? { ...s, lat, lng }
                              : s
                          );
                          setStopPoints(updatedStops);
                          setActiveStopIndex(null);
                          
                          setIsRecalculating(true);
                          setTimeout(() => {
                            loadRoutes(updatedStops);
                            setIsRecalculating(false);
                          }, 500);
                        }}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: stop.type === 'ORIGIN' ? '#10B981' :
                                    stop.type === 'DESTINATION' ? '#EF4444' :
                                    activeStopIndex === stop.stopId ? '#8B5CF6' : '#3B82F6',
                          fillOpacity: 1,
                          strokeColor: '#FFFFFF',
                          strokeWeight: 2,
                          scale: stop.type === 'STOP' ? 7 : 9
                        }}
                        label={{
                          text: stop.type === 'ORIGIN' ? 'P' : 
                                stop.type === 'DESTINATION' ? 'D' : 
                                (stop.stopId - 1).toString(),
                          color: '#FFFFFF',
                          fontSize: stop.type === 'STOP' ? '10px' : '12px',
                          fontWeight: 'bold'
                        }}
                      />
                    ))}

                    {/* Route Polyline */}
                    <Polyline
                      path={polylinePath.length > 0 ? polylinePath : fallbackPolylinePath}
                      options={{
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.7,
                        strokeWeight: 3,
                        geodesic: true
                      }}
                    />
                  </GoogleMap>
                </>
              )}

              {/* Map Controls */}
              <div className="absolute top-3 left-3 z-10 bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium text-foreground border border-border shadow-sm">
                <div className="flex items-center gap-1">
                  <Navigation size={12} className="text-primary" />
                  <span className="max-w-[180px] truncate">
                    {stopPoints.find(s => s.type === 'ORIGIN')?.name || 'Origin'} → 
                    {stopPoints.find(s => s.type === 'DESTINATION')?.name || 'Destination'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stopPoints.filter(stop => stop.type === 'STOP').length} intermediate stops
                </div>
                {selectedRouteData && (
                  <div className="text-xs text-primary font-medium mt-1">
                    {selectedRouteData.distance} • {selectedRouteData.duration}
                  </div>
                )}
              </div>

              {/* Map Mode Indicator */}
              {isAddStopMode && (
                <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm animate-pulse">
                  <Map size={12} className="inline mr-1" />
                  Click to add stop
                </div>
              )}

              {/* Map Legend */}
              <div className="absolute bottom-3 left-3 z-10 bg-card/95 backdrop-blur-sm px-2 py-1.5 rounded-lg text-xs border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span>Origin</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span>Stops</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span>Drop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferRide2;