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
  Car,
  User,
  Loader2,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Info,
  Check,
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
import { fetchVerifiedVehicles, Vehicle } from '../../services/rideApi';
import { getAllDrivers, Driver } from '../../services/driverApi';
import { Location } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Add interface for ride creation status response
interface RideCreationStatus {
  canCreateRide: boolean;
  message: string;
}

// Add function to check ride creation status
const checkRideCreationStatus = async (): Promise<RideCreationStatus> => {
  try {
    const tokenSources = [
      localStorage.getItem('authToken'),
      localStorage.getItem('token'),
      sessionStorage.getItem('authToken'),
      sessionStorage.getItem('token')
    ];
    
    let token: string | null = null;
    
    for (const t of tokenSources) {
      if (t && t !== 'undefined' && t !== 'null') {
        token = t;
        break;
      }
    }
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://18.61.216.57:4500/api/profile/ride-creation-status', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      throw new Error(`Failed to check ride creation status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Check Ride Creation Status Error:', error);
    throw error;
  }
};

const OfferRide1: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeFormat, setTimeFormat] = useState<'AM' | 'PM'>('AM');
  const [seats, setSeats] = useState(2);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string>('');
  
  // New field: is_negotiable (price negotiation)
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  
  // Vehicle and Driver state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [vehicleError, setVehicleError] = useState<string>('');
  const [driverError, setDriverError] = useState<string>('');
  
  // Ride creation status state
  const [rideCreationStatus, setRideCreationStatus] = useState<RideCreationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [canCreateRide, setCanCreateRide] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(true); // New state for toast visibility
  
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

  // Function to get current time in 12-hour format with AM/PM
  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Format minutes with leading zero
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    
    // Format time as HH:MM for input[type="time"]
    const formattedTime = `${hours < 10 ? '0' + hours : hours}:${formattedMinutes}`;
    
    return {
      time: formattedTime,
      format: ampm
    };
  };

  // Function to get day/night based on selected time
  const getDayNight = (selectedTime: string, selectedFormat: 'AM' | 'PM') => {
    const [hours] = selectedTime.split(':').map(Number);
    
    // Convert to 24-hour format for comparison
    let hour24 = hours;
    if (selectedFormat === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (selectedFormat === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    // Day: 6 AM to 5:59 PM (6:00 to 17:59)
    // Night: 6 PM to 5:59 AM (18:00 to 5:59)
    if (hour24 >= 6 && hour24 < 18) {
      return 'day';
    } else {
      return 'night';
    }
  };

  // Function to convert 12-hour time to 24-hour format for API
  const convertTo24HourFormat = (time12h: string, ampm: 'AM' | 'PM'): string => {
    let [hours, minutes] = time12h.split(':').map(Number);
    
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  // Function to format time range for display (railway format)
  const getTimeRangeText = (format: 'AM' | 'PM') => {
    if (format === 'AM') {
      return '06:00 - 17:59'; // Day time
    } else {
      return '18:00 - 05:59'; // Night time (railway format)
    }
  };

  // Check ride creation status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      setLoadingStatus(true);
      try {
        const status = await checkRideCreationStatus();
        setRideCreationStatus(status);
        setCanCreateRide(status.canCreateRide);
        
        if (!status.canCreateRide) {
          setError(status.message);
          // Redirect to profile page if cannot create ride
          setTimeout(() => {
            navigate('/profile');
          }, 3000); // Redirect after 3 seconds
        }
      } catch (error: any) {
        console.error('Failed to check ride creation status:', error);
        setError(error.message || 'Unable to verify ride creation eligibility. Please try again.');
        setCanCreateRide(false);
        // Redirect to profile page on error
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkStatus();
  }, [navigate]);

  // Initialize
  useEffect(() => {
    // Only set date/time if user can create ride
    if (canCreateRide) {
      // Set current date
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setDate(formattedDate);
      
      // Set current time with AM/PM (default to current time)
      const currentTime = getCurrentTime();
      setTime(currentTime.time);
      setTimeFormat(currentTime.format as 'AM' | 'PM');
      
      loadSettings();
      loadPreferences();
    } else {
      setLoadingSettings(false);
      setLoadingPreferences(false);
    }
  }, [canCreateRide]);

  // Load vehicles and drivers when component mounts and user can create ride
  useEffect(() => {
    if (canCreateRide) {
      loadVehicles();
      loadDrivers();
    }
  }, [canCreateRide]);

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

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    setVehicleError('');
    try {
      const verifiedVehicles = await fetchVerifiedVehicles();
      console.log('Loaded vehicles:', verifiedVehicles);
      setVehicles(verifiedVehicles);
      
      if (verifiedVehicles.length > 0) {
        // Auto-select first verified vehicle
        setSelectedVehicle(verifiedVehicles[0]);
      } else {
        setVehicleError('No verified vehicles found. Please add and verify a vehicle first.');
      }
    } catch (error: any) {
      console.error('Failed to load vehicles:', error);
      setVehicleError(error.message || 'Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    setDriverError('');
    try {
      // Get ALL drivers from API
      const allDrivers = await getAllDrivers();
      
      // Create current user as a driver option if authenticated
      let driversList = [...allDrivers];
      
      if (isAuthenticated && user) {
        // Always add current user as the first option
        const currentUserAsDriver: Driver = {
          id: user.id || Date.now(), // Use user ID or timestamp
          user: {
            first_name: user.first_name || 'You',
            last_name: user.last_name || '',
            mobile_number: user.mobile_number || user.phone || '',
            gender: user.gender || '',
            email: user.email_address || '',
            profile_image: user.profile_image_url || ''
          },
          is_verified: false, // User self is not verified as driver
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          driving_license_number: user.driving_license || '', // Add driving license from user
          driving_license_expiry: '',
          vehicle_id: null,
          status: 'active'
        };
        
        // Add current user as the first driver option
        driversList = [currentUserAsDriver, ...allDrivers];
      }
      
      setDrivers(driversList);
      
      if (driversList.length > 0) {
        // Auto-select current user (first option)
        setSelectedDriver(driversList[0]);
      } else {
        setDriverError('No drivers found.');
      }
    } catch (error: any) {
      console.error('Failed to load drivers:', error);
      setDriverError(error.message || 'Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Handle location selection
  const handlePickupSelect = (place: Place) => {
    const location: Location = {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      address: place.displayName.text,
      placeId: place.id,
      name: place.displayName.text.split(',')[0].trim() // Get accurate name
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
      name: place.displayName.text.split(',')[0].trim() // Get accurate name
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
      const name = address.split(',')[0].trim();
      
      const pickupLocationObj: Location = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        address: address,
        placeId: reverseResults[0].id,
        name: name
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
      const name = address.split(',')[0].trim();
      
      const dropLocationObj: Location = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        address: address,
        placeId: reverseResults[0].id,
        name: name
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

  // Toggle is_negotiable
  const handleToggleNegotiable = () => {
    setIsNegotiable(!isNegotiable);
  };

  // Handle time input change - convert 24-hour format to 12-hour
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTime = e.target.value;
    setTime(inputTime);
    
    // Convert 24-hour format from input to 12-hour for AM/PM display
    if (inputTime) {
      const [hours, minutes] = inputTime.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      setTimeFormat(ampm);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = getTodayDate();
    
    // Only set date if it's today or in the future
    if (selectedDate >= today) {
      setDate(selectedDate);
    }
  };

  // Handle time format change
  const handleTimeFormatChange = (format: 'AM' | 'PM') => {
    setTimeFormat(format);
  };

  // Handle continue to next screen
  const handleContinue = () => {
    // First check if user can create ride
    if (!canCreateRide) {
      setError(rideCreationStatus?.message || 'You are not eligible to create a ride. Please check your profile settings.');
      return;
    }

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

    // Check if vehicle is selected
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    // Check if driver is selected
    if (!selectedDriver) {
      setError('Please select a driver');
      return;
    }

    // Validate time is selected
    if (!time) {
      setError('Please select a valid time');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Convert date and time to ISO format for API
    const time24Hour = convertTo24HourFormat(time, timeFormat);
    const departureTime = new Date(`${date}T${time24Hour}`).toISOString();

    const rideData = {
      pickup: selectedPickup,
      drop: selectedDrop,
      stops: [],
      date,
      time,
      timeFormat,
      departureTime, // ISO format for API
      seats,
      preferences: selectedPreferences,
      isNegotiable, // Add the new field
      selectedRoute: null,
      totalDistance: distance,
      totalDuration: 0,
      settings,
      selectedVehicle: selectedVehicle,
      selectedDriver: selectedDriver
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

  // Check if vehicle is commercial
  const isCommercialVehicle = (vehicle: Vehicle) => {
    // Assuming vehicle_type or number_plate indicates commercial
    return vehicle.vehicle_type?.toLowerCase().includes('commercial') || 
           vehicle.number_plate?.startsWith('TN') || // Example logic
           vehicle.seating_capacity > 6; // Commercial vehicles usually have more seats
  };

  // If still loading status, show loading screen
  if (loadingStatus) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-gray-600">Checking ride eligibility...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user cannot create ride, show blocked screen with redirect
  if (!canCreateRide) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* Back Button - Fixed Top Left */}
        <button
          onClick={() => navigate(-1)}
          className="fixed top-20 left-4 z-20 p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Create Ride</h2>
            <p className="text-gray-600 mb-4">{rideCreationStatus?.message || 'You are not eligible to create a ride.'}</p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to profile page in 3 seconds...
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Profile Settings Now
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Navbar />

      {/* Back Button - Fixed Top Left */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-20 left-4 z-20 p-2 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-gray-800" />
      </button>

      {/* BLUE HIGHLIGHT SECTION - Shows when user can create ride */}
      {canCreateRide && rideCreationStatus?.message && showSuccessToast && (
        <div className="bg-blue-600 text-white py-2 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-white" />
                <span className="font-medium text-sm">{rideCreationStatus.message}</span>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className="flex-1 pt-4 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-4 py-2 flex flex-col">
          {/* HEADER */}
          <div className="mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">
              Offer a Ride
            </h1>
            <p className="text-sm text-gray-600">
              Fill the details to create your ride
            </p>
          </div>

          {/* CONTENT - No scroll */}
          <div className="flex-1 overflow-hidden">
            <div className="space-y-3">
              {/* PICKUP & DROP IN SINGLE ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PICKUP LOCATION */}
                <div className="space-y-1">
                  <div className="relative" ref={pickupRef}>
                    <div className="bg-white rounded-lg p-3 border border-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-blue-600" size={16} />
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
                          className="w-full font-medium outline-none bg-transparent placeholder:text-gray-400 text-sm"
                        />
                        <button
                          onClick={handleCurrentLocationPickup}
                          disabled={gettingCurrentLocationPickup}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                          title="Use current location"
                        >
                          {gettingCurrentLocationPickup ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Navigation size={14} className="text-blue-600" />
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
                            className="p-0.5 hover:bg-gray-100 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Pickup Suggestions */}
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {pickupSuggestions.map((place) => (
                          <div
                            key={place.id}
                            onClick={() => handlePickupSelect(place)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">{place.displayName.text}</div>
                            <div className="text-xs text-gray-600">
                              {place.formattedAddress}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* DROP LOCATION */}
                <div className="space-y-1">
                  <div className="relative" ref={dropRef}>
                    <div className="bg-white rounded-lg p-3 border border-gray-300">
                      <div className="flex items-center gap-2">
                        <Send className="text-blue-600 rotate-45" size={16} />
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
                          className="w-full font-medium outline-none bg-transparent placeholder:text-gray-400 text-sm"
                        />
                        <button
                          onClick={handleCurrentLocationDrop}
                          disabled={gettingCurrentLocationDrop}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                          title="Use current location"
                        >
                          {gettingCurrentLocationDrop ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Navigation size={14} className="text-blue-600" />
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
                            className="p-0.5 hover:bg-gray-100 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Drop Suggestions */}
                    {showDropSuggestions && dropSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {dropSuggestions.map((place) => (
                          <div
                            key={place.id}
                            onClick={() => handleDropSelect(place)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">{place.displayName.text}</div>
                            <div className="text-xs text-gray-600">
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
                <div className={`bg-white rounded-lg p-3 border ${distanceError ? 'border-red-500' : 'border-green-500'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${distanceError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} flex items-center justify-center`}>
                        {distanceError ? (
                          <AlertCircle size={14} />
                        ) : (
                          <Navigation size={14} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Distance</p>
                        <p className={`text-xs ${distanceError ? 'text-red-600' : 'text-green-600'}`}>
                          {distance.toFixed(1)} km
                          {distanceError && ` - ${distanceError}`}
                        </p>
                      </div>
                    </div>
                    {!distanceError && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        ✓ Valid
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DATE, TIME & SEATS - Three columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Date */}
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Date</span>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    min={getTodayDate()}
                    className="w-full font-medium outline-none bg-transparent text-gray-900 text-sm"
                  />
                </div>

                {/* Time with Day/Night toggle */}
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={handleTimeChange}
                      className="font-bold w-24 outline-none bg-transparent text-gray-900 text-sm"
                    />
                    <div className="flex border border-gray-300 rounded-md overflow-hidden">
                      <button
                        onClick={() => handleTimeFormatChange('AM')}
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs ${
                          timeFormat === 'AM'
                            ? 'bg-blue-50 text-blue-600 border-r border-blue-100'
                            : 'bg-white text-gray-600 border-r border-gray-200'
                        }`}
                      >
                        <Sun size={14} className={timeFormat === 'AM' ? 'text-yellow-500' : 'text-gray-400'} />
                        <span>Day</span>
                      </button>
                      <button
                        onClick={() => handleTimeFormatChange('PM')}
                        className={`px-3 py-1.5 flex items-center gap-1.5 text-xs ${
                          timeFormat === 'PM'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-white text-gray-600'
                        }`}
                      >
                        <Moon size={14} className={timeFormat === 'PM' ? 'text-blue-500' : 'text-gray-400'} />
                        <span>Night</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeFormat === 'AM' ? getTimeRangeText('AM') : getTimeRangeText('PM')}
                  </div>
                </div>

                {/* Seats */}
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">Seats</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => seats > 1 && setSeats(seats - 1)}
                      className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="text-xl font-bold text-gray-900">{seats}</span>

                    <button
                      onClick={() => seats < 8 && setSeats(seats + 1)}
                      className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* DRIVER, VEHICLE, PREFERENCES - THREE COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* DRIVER COLUMN */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-blue-600" size={16} />
                    <span className="font-medium text-sm text-gray-900">Select Driver</span>
                  </div>
                  
                  {loadingDrivers ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Loader2 size={14} className="animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  ) : driverError ? (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={14} />
                        <div className="text-xs">{driverError}</div>
                      </div>
                    </div>
                  ) : drivers.length > 0 ? (
                    <div className="space-y-2">
                      {drivers.map((driver) => {
                        // Check if this driver is the current user
                        const isCurrentUser = isAuthenticated && 
                          user && 
                          driver.user.mobile_number === user.mobile_number;
                        
                        return (
                          <div 
                            key={driver.id}
                            onClick={() => setSelectedDriver(driver)}
                            className={`p-2 border rounded-md cursor-pointer transition-all ${
                              selectedDriver?.id === driver.id
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {isCurrentUser ? 'You' : `${driver.user.first_name} ${driver.user.last_name}`}
                                  </span>
                                  {isCurrentUser ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
                                      You
                                    </span>
                                  ) : driver.is_verified ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800 flex items-center gap-0.5">
                                      <CheckCircle size={7} />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 rounded-full whitespace-nowrap bg-yellow-100 text-yellow-800 flex items-center gap-0.5">
                                      <XCircle size={7} />
                                      Unverified
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 mb-1 truncate">
                                  {driver.user.mobile_number}
                                </div>
                                {driver.driving_license_number && (
                                  <div className="text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded inline-block">
                                    {driver.driving_license_number}
                                  </div>
                                )}
                              </div>
                              {selectedDriver?.id === driver.id && (
                                <div className="w-3 h-3 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-blue-500">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-2 border border-dashed border-gray-300 rounded-md bg-gray-50">
                      <User className="w-5 h-5 text-gray-400 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">No drivers</p>
                    </div>
                  )}
                </div>

                {/* VEHICLE COLUMN */}
               <div className="bg-white rounded-2xl shadow-lg p-4">
  {/* Header */}
  <div className="flex items-center gap-2 mb-3">
    <Car className="text-green-600" size={18} />
    <span className="font-semibold text-sm text-gray-900">
      Select Vehicle
    </span>
  </div>

  {loadingVehicles ? (
    <div className="flex items-center justify-center gap-2 py-6">
      <Loader2 size={18} className="animate-spin text-green-600" />
      <span className="text-sm text-gray-600">Loading vehicles...</span>
    </div>

  ) : vehicleError ? (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle size={16} />
        <span className="text-sm">{vehicleError}</span>
      </div>
    </div>

  ) : vehicles.length > 0 ? (
    <div className="space-y-3">
      {vehicles.map((vehicle) => {
        const isCommercial = isCommercialVehicle(vehicle);
        const isActive = selectedVehicle?.id === vehicle.id;

        return (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className={`rounded-xl border p-3 cursor-pointer transition-all ${
              isActive
                ? isCommercial
                  ? "border-yellow-500 bg-yellow-50 shadow-sm"
                  : "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {/* Vehicle Number (NO BLACK) */}
            <div className="text-center mb-2">
              <span className="text-base font-semibold text-gray-900 tracking-wide">
                {vehicle.number_plate}
              </span>
            </div>

            {/* Badges + Active */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  Verified
                </span>

                {isCommercial && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    Commercial
                  </span>
                )}
              </div>

              {isActive && (
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isCommercial
                      ? "border-yellow-500"
                      : "border-blue-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCommercial
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

  ) : (
    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
      <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">No vehicles found</p>
    </div>
  )}
</div>


                {/* PREFERENCES COLUMN */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-purple-600" size={16} />
                    <span className="font-medium text-sm text-gray-900">Preferences</span>
                  </div>
                  
                  {loadingPreferences ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Loader2 size={14} className="animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  ) : preferences.length > 0 ? (
                    <div className="space-y-2">
                      {preferences.map(pref => (
                        <button
                          key={pref}
                          onClick={() => togglePreference(pref)}
                          className={`w-full p-2 border rounded-md transition-all text-left ${
                            selectedPreferences.includes(pref)
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              selectedPreferences.includes(pref) ? 'text-purple-700' : 'text-gray-700'
                            }`}>
                              {pref}
                            </span>
                            {selectedPreferences.includes(pref) && (
                              <div className="w-3 h-3 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-purple-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 border border-dashed border-gray-300 rounded-md bg-gray-50">
                      <Users className="w-5 h-5 text-gray-400 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">No preferences</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PRICE NEGOTIABLE TOGGLE */}
              <div className="bg-white rounded-lg p-3 border border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNegotiable ? 'bg-blue-500' : 'bg-gray-100'}`}>
                      <Users size={16} className={isNegotiable ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">Price Negotiable</h3>
                      <p className="text-xs text-gray-500">
                        {isNegotiable 
                          ? 'Passengers can negotiate fare' 
                          : 'Fixed fare only'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={handleToggleNegotiable}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* FLOATING CONTINUE BUTTON */}
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={handleContinue}
              disabled={!selectedPickup || !selectedDrop || !selectedVehicle || !selectedDriver || loadingSettings || !!error || !!distanceError || !time}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                selectedPickup && selectedDrop && selectedVehicle && selectedDriver && !loadingSettings && !error && !distanceError && time
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Continue"
            >
              <CircleArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferRide1;