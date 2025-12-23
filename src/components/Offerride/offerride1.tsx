// src/pages/offer-ride/OfferRide1.tsx - SIMPLIFIED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Send,
  Calendar,
  Clock,
  Users,
  Minus,
  Plus,
  CircleArrowRight,
  X,
  ArrowLeft,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../layout/Navbar';
import { useNavigate } from 'react-router-dom';
import { fetchSettings, fetchPreferences } from '../../services/settingsApi';
import { 
  autocompletePlaces, 
  Place, 
  getCurrentLocation, 
  reverseGeocode,
  calculateDistance 
} from '../../services/placesApi';
import { Location } from '../../types';

const OfferRide1: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:30');
  const [timeFormat, setTimeFormat] = useState<'AM' | 'PM'>('AM');
  const [seats, setSeats] = useState(2);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string>('');
  
  // API data
  const [settings, setSettings] = useState<any>(null);
  
  // Autocomplete
  const [pickupSuggestions, setPickupSuggestions] = useState<Place[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<Place[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<Location | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<Location | null>(null);
  
  // Loading states
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [gettingCurrentLocationPickup, setGettingCurrentLocationPickup] = useState(false);
  const [gettingCurrentLocationDrop, setGettingCurrentLocationDrop] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Initialize
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
    
    // Disable previous dates
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const minDate = todayDate.toISOString().split('T')[0];
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = minDate;
    }
    
    loadSettings();
    loadPreferences();
  }, []);

  useEffect(() => {
    // Calculate distance when both locations are selected
    if (selectedPickup && selectedDrop) {
      const calculatedDistance = calculateDistance(
        { lat: selectedPickup.lat, lng: selectedPickup.lng },
        { lat: selectedDrop.lat, lng: selectedDrop.lng }
      );
      setDistance(calculatedDistance);
      
      // Validate distance is at least 100 km
      if (calculatedDistance < 100) {
        setDistanceError(`Distance must be at least 100 km (Current: ${calculatedDistance.toFixed(1)} km)`);
      } else {
        setDistanceError('');
      }
    }
  }, [selectedPickup, selectedDrop]);

  const loadSettings = async () => {
    try {
      const settingsData = await fetchSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await fetchPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPreferences(['Ladies only', 'Kids Only', 'Senior Citizens', 'Students only', 'Professionals only']);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Handle location selection
  const handlePickupSelect = (place: Place) => {
    const location: Location = {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      address: place.displayName.text,
      placeId: place.id,
    };
    
    // Check if this is same as selected drop location
    if (selectedDrop && selectedDrop.lat && selectedDrop.lng) {
      const distance = calculateDistance(
        { lat: location.lat, lng: location.lng },
        { lat: selectedDrop.lat, lng: selectedDrop.lng }
      );
      
      if (distance < 0.1) { // Less than 100 meters
        setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
        return;
      }
    }
    
    setPickupLocation(place.displayName.text);
    setSelectedPickup(location);
    setShowPickupSuggestions(false);
    setError(null);
  };

  const handleDropSelect = (place: Place) => {
    const location: Location = {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      address: place.displayName.text,
      placeId: place.id,
    };
    
    // Check if this is same as selected pickup location
    if (selectedPickup && selectedPickup.lat && selectedPickup.lng) {
      const distance = calculateDistance(
        { lat: location.lat, lng: location.lng },
        { lat: selectedPickup.lat, lng: selectedPickup.lng }
      );
      
      if (distance < 0.1) { // Less than 100 meters
        setError('Drop and pickup locations cannot be the same or too close. Please select different locations.');
        return;
      }
    }
    
    setDropLocation(place.displayName.text);
    setSelectedDrop(location);
    setShowDropSuggestions(false);
    setError(null);
  };

  // Debounced search for pickup
  const searchPickupPlaces = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.length < 2) {
      setPickupSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await autocompletePlaces(query);
        setPickupSuggestions(results);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error('Error searching pickup places:', error);
        setError('Failed to search pickup locations. Please try again.');
      }
    }, 300);
  }, []);

  // Debounced search for drop
  const searchDropPlaces = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.length < 2) {
      setDropSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await autocompletePlaces(query);
        setDropSuggestions(results);
        setShowDropSuggestions(true);
      } catch (error) {
        console.error('Error searching drop places:', error);
        setError('Failed to search drop locations. Please try again.');
      }
    }, 300);
  }, []);

  // Current location handler for pickup
  const handleCurrentLocationPickup = async () => {
    setGettingCurrentLocationPickup(true);
    setError(null);
    
    try {
      const currentPos = await getCurrentLocation();
      
      const reverseResults = await reverseGeocode(currentPos.lat, currentPos.lng);
      
      if (reverseResults.length === 0) {
        throw new Error('Could not get address for current location');
      }
      
      const address = reverseResults[0].displayName.text;
      
      const pickupLocationObj: Location = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        address: address,
        placeId: reverseResults[0].id,
      };
      
      // Check if drop location is already selected
      if (selectedDrop && selectedDrop.lat && selectedDrop.lng) {
        const distance = calculateDistance(
          { lat: currentPos.lat, lng: currentPos.lng },
          { lat: selectedDrop.lat, lng: selectedDrop.lng }
        );
        
        if (distance < 0.1) {
          setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
          return;
        }
      }
      
      setPickupLocation(address);
      setSelectedPickup(pickupLocationObj);
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      
    } catch (error: any) {
      console.error('Error getting current location for pickup:', error);
      
      if (error.message === 'Geolocation is not supported by your browser') {
        setError('Geolocation is not supported by your browser. Please enable location services or enter location manually.');
      } else if (error.message.includes('permission')) {
        setError('Location permission denied. Please enable location services in your browser settings.');
      } else if (error.message.includes('timeout')) {
        setError('Location request timed out. Please check your internet connection and try again.');
      } else {
        setError('Unable to get current location. Please check your location services or enter location manually.');
      }
    } finally {
      setGettingCurrentLocationPickup(false);
    }
  };

  // Current location handler for drop
  const handleCurrentLocationDrop = async () => {
    setGettingCurrentLocationDrop(true);
    setError(null);
    
    try {
      const currentPos = await getCurrentLocation();
      
      const reverseResults = await reverseGeocode(currentPos.lat, currentPos.lng);
      
      if (reverseResults.length === 0) {
        throw new Error('Could not get address for current location');
      }
      
      const address = reverseResults[0].displayName.text;
      
      const dropLocationObj: Location = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        address: address,
        placeId: reverseResults[0].id,
      };
      
      // Check if pickup location is already selected
      if (selectedPickup && selectedPickup.lat && selectedPickup.lng) {
        const distance = calculateDistance(
          { lat: currentPos.lat, lng: currentPos.lng },
          { lat: selectedPickup.lat, lng: selectedPickup.lng }
        );
        
        if (distance < 0.1) {
          setError('Drop and pickup locations cannot be the same or too close. Please select different locations.');
          return;
        }
      }
      
      setDropLocation(address);
      setSelectedDrop(dropLocationObj);
      setDropSuggestions([]);
      setShowDropSuggestions(false);
      
    } catch (error: any) {
      console.error('Error getting current location for drop:', error);
      
      if (error.message === 'Geolocation is not supported by your browser') {
        setError('Geolocation is not supported by your browser. Please enable location services or enter location manually.');
      } else if (error.message.includes('permission')) {
        setError('Location permission denied. Please enable location services in your browser settings.');
      } else if (error.message.includes('timeout')) {
        setError('Location request timed out. Please check your internet connection and try again.');
      } else {
        setError('Unable to get current location. Please check your location services or enter location manually.');
      }
    } finally {
      setGettingCurrentLocationDrop(false);
    }
  };

  // Toggle preferences
  const togglePreference = (pref: string) => {
    setSelectedPreferences(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };

  // Handle continue to next screen
  const handleContinue = () => {
    // Validation checks
    if (!selectedPickup || !selectedDrop) {
      setError('Please select valid pickup and drop locations');
      return;
    }

    if (!selectedPickup.lat || !selectedPickup.lng || !selectedDrop.lat || !selectedDrop.lng) {
      setError('Location coordinates not available. Please select from suggestions.');
      return;
    }

    // Check if pickup and drop are too close
    const distance = calculateDistance(
      { lat: selectedPickup.lat, lng: selectedPickup.lng },
      { lat: selectedDrop.lat, lng: selectedDrop.lng }
    );
    
    if (distance < 0.1) {
      setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
      return;
    }

    // Check if distance is at least 100 km
    if (distance < 100) {
      setError(`Distance must be at least 100 km (Current: ${distance.toFixed(1)} km)`);
      return;
    }

    // Clear any previous errors
    setError(null);

    const rideData = {
      pickup: selectedPickup,
      drop: selectedDrop,
      stops: [],
      date,
      time,
      timeFormat,
      seats,
      preferences: selectedPreferences,
      selectedRoute: null,
      totalDistance: distance,
      totalDuration: 0,
      settings,
    };

    navigate('/offer-ride2', { state: rideData });
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setShowDropSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <Navbar />

      {/* Back Button - Fixed Top Left */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-20 left-4 z-20 p-2 hover:bg-accent rounded-full transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-foreground" />
      </button>

      {/* Error Toast Notification */}
      {(error || distanceError) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle size={18} />
          <span className="font-medium">{error || distanceError}</span>
          <button onClick={() => {setError(null); setDistanceError('');}} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 pt-16 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-4 py-4 flex flex-col">
          {/* HEADER */}
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-foreground">
              Offer a Ride
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill the details to create your ride
            </p>
          </div>

          {/* CONTENT - Single row layout, no scroll */}
          <div className="flex-1 flex flex-col gap-6">
            {/* PICKUP & DROP IN SINGLE ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PICKUP LOCATION */}
              <div className="space-y-2">
                <div className="relative" ref={pickupRef}>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-primary" size={18} />
                      <input
                        value={pickupLocation}
                        onChange={(e) => {
                          setPickupLocation(e.target.value);
                          searchPickupPlaces(e.target.value);
                        }}
                        onFocus={() => {
                          if (pickupLocation.length >= 2) {
                            setShowPickupSuggestions(true);
                          }
                        }}
                        placeholder="Enter pickup location"
                        className="w-full font-semibold outline-none bg-transparent placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={handleCurrentLocationPickup}
                        disabled={gettingCurrentLocationPickup}
                        className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                        title="Use current location"
                      >
                        {gettingCurrentLocationPickup ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Navigation size={16} className="text-primary" />
                        )}
                      </button>
                      {pickupLocation && (
                        <button
                          onClick={() => {
                            setPickupLocation('');
                            setSelectedPickup(null);
                            setPickupSuggestions([]);
                            setDistance(null);
                            setDistanceError('');
                          }}
                          className="p-1 hover:bg-muted rounded-full"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Pickup Suggestions */}
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {pickupSuggestions.map((place) => (
                        <div
                          key={place.id}
                          onClick={() => handlePickupSelect(place)}
                          className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium text-foreground">{place.displayName.text}</div>
                          <div className="text-xs text-muted-foreground">
                            {place.formattedAddress}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* DROP LOCATION */}
              <div className="space-y-2">
                <div className="relative" ref={dropRef}>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3">
                      <Send className="text-primary rotate-45" size={18} />
                      <input
                        value={dropLocation}
                        onChange={(e) => {
                          setDropLocation(e.target.value);
                          searchDropPlaces(e.target.value);
                        }}
                        onFocus={() => {
                          if (dropLocation.length >= 2) {
                            setShowDropSuggestions(true);
                          }
                        }}
                        placeholder="Enter drop location"
                        className="w-full font-semibold outline-none bg-transparent placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={handleCurrentLocationDrop}
                        disabled={gettingCurrentLocationDrop}
                        className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                        title="Use current location"
                      >
                        {gettingCurrentLocationDrop ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Navigation size={16} className="text-primary" />
                        )}
                      </button>
                      {dropLocation && (
                        <button
                          onClick={() => {
                            setDropLocation('');
                            setSelectedDrop(null);
                            setDropSuggestions([]);
                            setDistance(null);
                            setDistanceError('');
                          }}
                          className="p-1 hover:bg-muted rounded-full"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Drop Suggestions */}
                  {showDropSuggestions && dropSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {dropSuggestions.map((place) => (
                        <div
                          key={place.id}
                          onClick={() => handleDropSelect(place)}
                          className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium text-foreground">{place.displayName.text}</div>
                          <div className="text-xs text-muted-foreground">
                            {place.formattedAddress}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Distance Display */}
            {distance !== null && (
              <div className={`bg-card rounded-xl p-4 border ${distanceError ? 'border-red-500' : 'border-green-500'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${distanceError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} flex items-center justify-center`}>
                      {distanceError ? (
                        <AlertCircle size={16} />
                      ) : (
                        <Navigation size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Distance</p>
                      <p className={`text-sm ${distanceError ? 'text-red-600' : 'text-green-600'}`}>
                        {distance.toFixed(1)} km
                        {distanceError && ` - ${distanceError}`}
                      </p>
                    </div>
                  </div>
                  {!distanceError && (
                    <div className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      ✓ Valid for offer
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DATE & TIME - Single row */}
            <div className="bg-card rounded-xl p-4 border border-border grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={18} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full font-semibold outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={18} />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-lg font-bold w-28 outline-none bg-transparent"
                />
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setTimeFormat('AM')}
                    className={`px-4 py-1 text-sm font-medium ${
                      timeFormat === 'AM'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setTimeFormat('PM')}
                    className={`px-4 py-1 text-sm font-medium ${
                      timeFormat === 'PM'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* SEATS */}
            <div className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={18} />
                <span className="font-medium text-foreground">
                  Seats available
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => seats > 1 && setSeats(seats - 1)}
                  className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-accent"
                >
                  <Minus size={16} />
                </button>

                <span className="text-2xl font-bold">{seats}</span>

                <button
                  onClick={() => seats < 8 && setSeats(seats + 1)}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* PREFERENCES */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm font-medium mb-3 text-foreground">
                Preferences
              </p>
              <div className="flex flex-wrap gap-2">
                {loadingPreferences ? (
                  <div className="text-sm text-muted-foreground">Loading preferences...</div>
                ) : (
                  preferences.map(pref => (
                    <button
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedPreferences.includes(pref)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {pref}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* FLOATING CONTINUE BUTTON */}
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={handleContinue}
              disabled={!selectedPickup || !selectedDrop || loadingSettings || !!error || !!distanceError}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                selectedPickup && selectedDrop && !loadingSettings && !error && !distanceError
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              aria-label="Continue"
            >
              <CircleArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferRide1;