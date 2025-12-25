// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   MapPin,
//   Send,
//   Calendar,
//   Clock,
//   Users,
//   Minus,
//   Plus,
//   CircleArrowRight,
//   X,
//   ArrowLeft,
//   Navigation,
//   AlertCircle,
//   Car,
//   User,
//   ShieldAlert,
//   Loader2,
//   DollarSign,
// } from 'lucide-react';
// import Navbar from '../layout/Navbar';
// import { useNavigate } from 'react-router-dom';
// import { fetchSettings, fetchPreferences } from '../../services/settingsApi';
// import { 
//   autocompletePlaces, 
//   Place, 
//   getCurrentLocation, 
//   reverseGeocode,
//   calculateDistance 
// } from '../../services/placesApi';
// import { fetchVerifiedVehicles, Vehicle } from '../../services/rideApi';
// import { getVerifiedDrivers, getAllDrivers, Driver } from '../../services/driverApi';
// import { Location } from '../../types';
// import { useAuth } from '../../contexts/AuthContext';
// import VehicleModal from '../../components/common/VehicleModal';

// const OfferRide1: React.FC = () => {
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
  
//   // Form state
//   const [pickupLocation, setPickupLocation] = useState('');
//   const [dropLocation, setDropLocation] = useState('');
//   const [date, setDate] = useState('');
//   const [time, setTime] = useState('');
//   const [timeFormat, setTimeFormat] = useState<'AM' | 'PM'>('AM');
//   const [seats, setSeats] = useState(2);
//   const [preferences, setPreferences] = useState<string[]>([]);
//   const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
//   const [distance, setDistance] = useState<number | null>(null);
//   const [distanceError, setDistanceError] = useState<string>('');
  
//   // New field: is_negotiable (price negotiation)
//   const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  
//   // Vehicle and Driver state
//   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
//   const [drivers, setDrivers] = useState<Driver[]>([]);
//   const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
//   const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
//   const [loadingVehicles, setLoadingVehicles] = useState(false);
//   const [loadingDrivers, setLoadingDrivers] = useState(false);
//   const [vehicleError, setVehicleError] = useState<string>('');
//   const [driverError, setDriverError] = useState<string>('');
  
//   // Modal state
//   const [showVehicleModal, setShowVehicleModal] = useState(false);
//   const [showVehicleErrorModal, setShowVehicleErrorModal] = useState(false);
//   const [hasCheckedVehicles, setHasCheckedVehicles] = useState(false); // Track if we've checked for vehicles
  
//   // API data
//   const [settings, setSettings] = useState<any>(null);
  
//   // Autocomplete
//   const [pickupSuggestions, setPickupSuggestions] = useState<Place[]>([]);
//   const [dropSuggestions, setDropSuggestions] = useState<Place[]>([]);
//   const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
//   const [showDropSuggestions, setShowDropSuggestions] = useState(false);
//   const [selectedPickup, setSelectedPickup] = useState<Location | null>(null);
//   const [selectedDrop, setSelectedDrop] = useState<Location | null>(null);
  
//   // Loading states
//   const [loadingSettings, setLoadingSettings] = useState(true);
//   const [loadingPreferences, setLoadingPreferences] = useState(true);
//   const [gettingCurrentLocationPickup, setGettingCurrentLocationPickup] = useState(false);
//   const [gettingCurrentLocationDrop, setGettingCurrentLocationDrop] = useState(false);
  
//   // Error state
//   const [error, setError] = useState<string | null>(null);
  
//   const pickupRef = useRef<HTMLDivElement>(null);
//   const dropRef = useRef<HTMLDivElement>(null);
//   const debounceTimeout = useRef<NodeJS.Timeout>();

//   // Function to get current time in 12-hour format with AM/PM
//   const getCurrentTime = () => {
//     const now = new Date();
//     let hours = now.getHours();
//     const minutes = now.getMinutes();
    
//     // Convert to 12-hour format
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12;
//     hours = hours ? hours : 12; // 0 should be 12
    
//     // Format minutes with leading zero
//     const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    
//     // Format time as HH:MM for input[type="time"]
//     const formattedTime = `${hours < 10 ? '0' + hours : hours}:${formattedMinutes}`;
    
//     return {
//       time: formattedTime,
//       format: ampm
//     };
//   };

//   // Function to convert 12-hour time to 24-hour format for API
//   const convertTo24HourFormat = (time12h: string, ampm: 'AM' | 'PM'): string => {
//     let [hours, minutes] = time12h.split(':').map(Number);
    
//     if (ampm === 'PM' && hours !== 12) {
//       hours += 12;
//     } else if (ampm === 'AM' && hours === 12) {
//       hours = 0;
//     }
    
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
//   };

//   // Initialize
//   useEffect(() => {
//     // Set current date
//     const today = new Date();
//     const formattedDate = today.toISOString().split('T')[0];
//     setDate(formattedDate);
    
//     // Set current time with AM/PM (default to current time)
//     const currentTime = getCurrentTime();
//     setTime(currentTime.time);
//     setTimeFormat(currentTime.format as 'AM' | 'PM');
    
//     loadSettings();
//     loadPreferences();
//   }, []);

//   // Load vehicles and drivers when component mounts
//   useEffect(() => {
//     loadVehicles();
//     loadDrivers();
//   }, []);

//   // Show modal ONLY when no vehicles are found AND we've finished loading
//   useEffect(() => {
//     console.log('Vehicle check:', {
//       loadingVehicles,
//       vehiclesCount: vehicles.length,
//       hasCheckedVehicles,
//       showVehicleModal,
//       showVehicleErrorModal
//     });
    
//     // Only show modal when:
//     // 1. We're not loading vehicles
//     // 2. We have no vehicles
//     // 3. We haven't shown the modal yet
//     // 4. We're not currently showing the modal
//     if (
//       !loadingVehicles && 
//       vehicles.length === 0 && 
//       !hasCheckedVehicles && 
//       !showVehicleModal &&
//       !showVehicleErrorModal
//     ) {
//       console.log('Showing vehicle error modal - no vehicles found');
//       setHasCheckedVehicles(true);
//       setShowVehicleErrorModal(true);
//     }
//   }, [loadingVehicles, vehicles.length, hasCheckedVehicles, showVehicleModal, showVehicleErrorModal]);

//   useEffect(() => {
//     // Calculate distance when both locations are selected
//     if (selectedPickup && selectedDrop) {
//       const calculatedDistance = calculateDistance(
//         { lat: selectedPickup.lat, lng: selectedPickup.lng },
//         { lat: selectedDrop.lat, lng: selectedDrop.lng }
//       );
//       setDistance(calculatedDistance);
      
//       // Validate distance is at least 100 km
//       if (calculatedDistance < 100) {
//         setDistanceError(`Distance must be at least 100 km (Current: ${calculatedDistance.toFixed(1)} km)`);
//       } else {
//         setDistanceError('');
//       }
//     }
//   }, [selectedPickup, selectedDrop]);

//   const loadSettings = async () => {
//     try {
//       const settingsData = await fetchSettings();
//       setSettings(settingsData);
//     } catch (error) {
//       console.error('Failed to load settings:', error);
//     } finally {
//       setLoadingSettings(false);
//     }
//   };

//   const loadPreferences = async () => {
//     try {
//       const prefs = await fetchPreferences();
//       setPreferences(prefs);
//     } catch (error) {
//       console.error('Failed to load preferences:', error);
//       setPreferences(['Ladies only', 'Kids Only', 'Senior Citizens', 'Students only', 'Professionals only']);
//     } finally {
//       setLoadingPreferences(false);
//     }
//   };

//   const loadVehicles = async () => {
//     setLoadingVehicles(true);
//     setVehicleError('');
//     setHasCheckedVehicles(false); // Reset check when loading
//     try {
//       const verifiedVehicles = await fetchVerifiedVehicles();
//       console.log('Loaded vehicles:', verifiedVehicles);
//       setVehicles(verifiedVehicles);
      
//       if (verifiedVehicles.length > 0) {
//         // Auto-select first verified vehicle
//         setSelectedVehicle(verifiedVehicles[0]);
//         setHasCheckedVehicles(true); // We have vehicles, no need to show modal
//       } else {
//         setVehicleError('No verified vehicles found. Please add and verify a vehicle first.');
//       }
//     } catch (error: any) {
//       console.error('Failed to load vehicles:', error);
//       setVehicleError(error.message || 'Failed to load vehicles');
//       setHasCheckedVehicles(true); // Even on error, mark as checked
//     } finally {
//       setLoadingVehicles(false);
//     }
//   };

//   const loadDrivers = async () => {
//     setLoadingDrivers(true);
//     setDriverError('');
//     try {
//       // Get ALL drivers from API
//       const allDrivers = await getAllDrivers();
      
//       // Create current user as a driver option if authenticated
//       let driversList = [...allDrivers];
      
//       if (isAuthenticated && user) {
//         // Check if current user is already in the drivers list
//         const userAlreadyInList = allDrivers.some(driver => 
//           driver.user.mobile_number === user.mobile_number
//         );
        
//         if (!userAlreadyInList) {
//           // Add current user as a driver option
//           const currentUserAsDriver: Driver = {
//             id: user.id || Date.now(), // Use user ID or timestamp
//             user: {
//               first_name: user.first_name || 'You',
//               last_name: user.last_name || '',
//               mobile_number: user.mobile_number || user.phone || '',
//               gender: user.gender || '',
//               email: user.email_address || '',
//               profile_image: user.profile_image_url || ''
//             },
//             is_verified: false, // User self is not verified as driver
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//             driving_license_number: '',
//             driving_license_expiry: '',
//             vehicle_id: null,
//             status: 'active'
//           };
          
//           driversList = [currentUserAsDriver, ...allDrivers];
//         }
//       }
      
//       setDrivers(driversList);
      
//       if (driversList.length > 0) {
//         // Auto-select first driver
//         setSelectedDriver(driversList[0]);
//       } else {
//         setDriverError('No drivers found. Please add a driver first.');
//       }
//     } catch (error: any) {
//       console.error('Failed to load drivers:', error);
//       setDriverError(error.message || 'Failed to load drivers');
//     } finally {
//       setLoadingDrivers(false);
//     }
//   };

//   // Handle location selection
//   const handlePickupSelect = (place: Place) => {
//     const location: Location = {
//       lat: place.location?.latitude || 0,
//       lng: place.location?.longitude || 0,
//       address: place.displayName.text,
//       placeId: place.id,
//       name: place.displayName.text.split(',')[0].trim() // Get accurate name
//     };
    
//     // Check if this is same as selected drop location
//     if (selectedDrop && selectedDrop.lat && selectedDrop.lng) {
//       const distance = calculateDistance(
//         { lat: location.lat, lng: location.lng },
//         { lat: selectedDrop.lat, lng: selectedDrop.lng }
//       );
      
//       if (distance < 0.1) { // Less than 100 meters
//         setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
//         return;
//       }
//     }
    
//     setPickupLocation(place.displayName.text);
//     setSelectedPickup(location);
//     setShowPickupSuggestions(false);
//     setError(null);
//   };

//   const handleDropSelect = (place: Place) => {
//     const location: Location = {
//       lat: place.location?.latitude || 0,
//       lng: place.location?.longitude || 0,
//       address: place.displayName.text,
//       placeId: place.id,
//       name: place.displayName.text.split(',')[0].trim() // Get accurate name
//     };
    
//     // Check if this is same as selected pickup location
//     if (selectedPickup && selectedPickup.lat && selectedPickup.lng) {
//       const distance = calculateDistance(
//         { lat: location.lat, lng: location.lng },
//         { lat: selectedPickup.lat, lng: selectedPickup.lng }
//       );
      
//       if (distance < 0.1) { // Less than 100 meters
//         setError('Drop and pickup locations cannot be the same or too close. Please select different locations.');
//         return;
//       }
//     }
    
//     setDropLocation(place.displayName.text);
//     setSelectedDrop(location);
//     setShowDropSuggestions(false);
//     setError(null);
//   };

//   // Debounced search for pickup
//   const searchPickupPlaces = useCallback((query: string) => {
//     if (debounceTimeout.current) {
//       clearTimeout(debounceTimeout.current);
//     }

//     if (query.length < 2) {
//       setPickupSuggestions([]);
//       return;
//     }

//     debounceTimeout.current = setTimeout(async () => {
//       try {
//         const results = await autocompletePlaces(query);
//         setPickupSuggestions(results);
//         setShowPickupSuggestions(true);
//       } catch (error) {
//         console.error('Error searching pickup places:', error);
//         setError('Failed to search pickup locations. Please try again.');
//       }
//     }, 300);
//   }, []);

//   // Debounced search for drop
//   const searchDropPlaces = useCallback((query: string) => {
//     if (debounceTimeout.current) {
//       clearTimeout(debounceTimeout.current);
//     }

//     if (query.length < 2) {
//       setDropSuggestions([]);
//       return;
//     }

//     debounceTimeout.current = setTimeout(async () => {
//       try {
//         const results = await autocompletePlaces(query);
//         setDropSuggestions(results);
//         setShowDropSuggestions(true);
//       } catch (error) {
//         console.error('Error searching drop places:', error);
//         setError('Failed to search drop locations. Please try again.');
//       }
//     }, 300);
//   }, []);

//   // Current location handler for pickup
//   const handleCurrentLocationPickup = async () => {
//     setGettingCurrentLocationPickup(true);
//     setError(null);
    
//     try {
//       const currentPos = await getCurrentLocation();
      
//       const reverseResults = await reverseGeocode(currentPos.lat, currentPos.lng);
      
//       if (reverseResults.length === 0) {
//         throw new Error('Could not get address for current location');
//       }
      
//       const address = reverseResults[0].displayName.text;
//       const name = address.split(',')[0].trim();
      
//       const pickupLocationObj: Location = {
//         lat: currentPos.lat,
//         lng: currentPos.lng,
//         address: address,
//         placeId: reverseResults[0].id,
//         name: name
//       };
      
//       // Check if drop location is already selected
//       if (selectedDrop && selectedDrop.lat && selectedDrop.lng) {
//         const distance = calculateDistance(
//           { lat: currentPos.lat, lng: currentPos.lng },
//           { lat: selectedDrop.lat, lng: selectedDrop.lng }
//         );
        
//         if (distance < 0.1) {
//           setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
//           return;
//         }
//       }
      
//       setPickupLocation(address);
//       setSelectedPickup(pickupLocationObj);
//       setPickupSuggestions([]);
//       setShowPickupSuggestions(false);
      
//     } catch (error: any) {
//       console.error('Error getting current location for pickup:', error);
      
//       if (error.message === 'Geolocation is not supported by your browser') {
//         setError('Geolocation is not supported by your browser. Please enable location services or enter location manually.');
//       } else if (error.message.includes('permission')) {
//         setError('Location permission denied. Please enable location services in your browser settings.');
//       } else if (error.message.includes('timeout')) {
//         setError('Location request timed out. Please check your internet connection and try again.');
//       } else {
//         setError('Unable to get current location. Please check your location services or enter location manually.');
//       }
//     } finally {
//       setGettingCurrentLocationPickup(false);
//     }
//   };

//   // Current location handler for drop
//   const handleCurrentLocationDrop = async () => {
//     setGettingCurrentLocationDrop(true);
//     setError(null);
    
//     try {
//       const currentPos = await getCurrentLocation();
      
//       const reverseResults = await reverseGeocode(currentPos.lat, currentPos.lng);
      
//       if (reverseResults.length === 0) {
//         throw new Error('Could not get address for current location');
//       }
      
//       const address = reverseResults[0].displayName.text;
//       const name = address.split(',')[0].trim();
      
//       const dropLocationObj: Location = {
//         lat: currentPos.lat,
//         lng: currentPos.lng,
//         address: address,
//         placeId: reverseResults[0].id,
//         name: name
//       };
      
//       // Check if pickup location is already selected
//       if (selectedPickup && selectedPickup.lat && selectedPickup.lng) {
//         const distance = calculateDistance(
//           { lat: currentPos.lat, lng: currentPos.lng },
//           { lat: selectedPickup.lat, lng: selectedPickup.lng }
//         );
        
//         if (distance < 0.1) {
//           setError('Drop and pickup locations cannot be the same or too close. Please select different locations.');
//           return;
//         }
//       }
      
//       setDropLocation(address);
//       setSelectedDrop(dropLocationObj);
//       setDropSuggestions([]);
//       setShowDropSuggestions(false);
      
//     } catch (error: any) {
//       console.error('Error getting current location for drop:', error);
      
//       if (error.message === 'Geolocation is not supported by your browser') {
//         setError('Geolocation is not supported by your browser. Please enable location services or enter location manually.');
//       } else if (error.message.includes('permission')) {
//         setError('Location permission denied. Please enable location services in your browser settings.');
//       } else if (error.message.includes('timeout')) {
//         setError('Location request timed out. Please check your internet connection and try again.');
//       } else {
//         setError('Unable to get current location. Please check your location services or enter location manually.');
//       }
//     } finally {
//       setGettingCurrentLocationDrop(false);
//     }
//   };

//   // Toggle preferences
//   const togglePreference = (pref: string) => {
//     setSelectedPreferences(prev =>
//       prev.includes(pref)
//         ? prev.filter(p => p !== pref)
//         : [...prev, pref]
//     );
//   };

//   // Toggle is_negotiable
//   const handleToggleNegotiable = () => {
//     setIsNegotiable(!isNegotiable);
//   };

//   // Handle time input change - convert 24-hour format to 12-hour
//   const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const inputTime = e.target.value;
//     setTime(inputTime);
    
//     // Convert 24-hour format from input to 12-hour for AM/PM display
//     if (inputTime) {
//       const [hours, minutes] = inputTime.split(':').map(Number);
//       const ampm = hours >= 12 ? 'PM' : 'AM';
//       setTimeFormat(ampm);
//     }
//   };

//   // Get today's date in YYYY-MM-DD format
//   const getTodayDate = () => {
//     const today = new Date();
//     return today.toISOString().split('T')[0];
//   };

//   // Handle date input change
//   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedDate = e.target.value;
//     const today = getTodayDate();
    
//     // Only set date if it's today or in the future
//     if (selectedDate >= today) {
//       setDate(selectedDate);
//     }
//   };

//   // Handle continue to next screen
//   const handleContinue = () => {
//     // Validation checks
//     if (!selectedPickup || !selectedDrop) {
//       setError('Please select valid pickup and drop locations');
//       return;
//     }

//     if (!selectedPickup.lat || !selectedPickup.lng || !selectedDrop.lat || !selectedDrop.lng) {
//       setError('Location coordinates not available. Please select from suggestions.');
//       return;
//     }

//     // Check if pickup and drop are too close
//     const distance = calculateDistance(
//       { lat: selectedPickup.lat, lng: selectedPickup.lng },
//       { lat: selectedDrop.lat, lng: selectedDrop.lng }
//     );
    
//     if (distance < 0.1) {
//       setError('Pickup and drop locations cannot be the same or too close. Please select different locations.');
//       return;
//     }

//     // Check if distance is at least 100 km
//     if (distance < 100) {
//       setError(`Distance must be at least 100 km (Current: ${distance.toFixed(1)} km)`);
//       return;
//     }

//     // Check if vehicle is selected
//     if (!selectedVehicle) {
//       setError('Please select a vehicle');
//       return;
//     }

//     // Check if driver is selected
//     if (!selectedDriver) {
//       setError('Please select a driver');
//       return;
//     }

//     // Validate time is selected
//     if (!time) {
//       setError('Please select a valid time');
//       return;
//     }

//     // Clear any previous errors
//     setError(null);

//     // Convert date and time to ISO format for API
//     const time24Hour = convertTo24HourFormat(time, timeFormat);
//     const departureTime = new Date(`${date}T${time24Hour}`).toISOString();

//     const rideData = {
//       pickup: selectedPickup,
//       drop: selectedDrop,
//       stops: [],
//       date,
//       time,
//       timeFormat,
//       departureTime, // ISO format for API
//       seats,
//       preferences: selectedPreferences,
//       isNegotiable, // Add the new field
//       selectedRoute: null,
//       totalDistance: distance,
//       totalDuration: 0,
//       settings,
//       selectedVehicle: selectedVehicle,
//       selectedDriver: selectedDriver
//     };

//     navigate('/offer-ride2', { state: rideData });
//   };

//   // Handle manual add vehicle button click
//   const handleManualAddVehicle = () => {
//     setShowVehicleModal(true);
//   };

//   // Handle vehicle added from modal
//   const handleVehicleAdded = () => {
//     // Refresh vehicles list
//     loadVehicles();
//     setShowVehicleModal(false);
//     setShowVehicleErrorModal(false);
//   };

//   // Handle close vehicle error modal
//   const handleCloseVehicleErrorModal = () => {
//     setShowVehicleErrorModal(false);
//   };

//   // Close suggestions on outside click
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
//         setShowPickupSuggestions(false);
//       }
//       if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
//         setShowDropSuggestions(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   return (
//     <div className="h-screen overflow-hidden bg-background flex flex-col">
//       <Navbar />

//       {/* Back Button - Fixed Top Left */}
//       <button
//         onClick={() => navigate(-1)}
//         className="fixed top-20 left-4 z-20 p-2 hover:bg-accent rounded-full transition-colors"
//         aria-label="Go back"
//       >
//         <ArrowLeft size={20} className="text-foreground" />
//       </button>

//       {/* Error Toast Notification */}
//       {(error || distanceError) && (
//         <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
//           <AlertCircle size={18} />
//           <span className="font-medium">{error || distanceError}</span>
//           <button onClick={() => {setError(null); setDistanceError('');}} className="ml-2">
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Vehicle Error Modal - Only shows when NO vehicles */}
//       {showVehicleErrorModal && vehicles.length === 0 && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
//                 <ShieldAlert className="text-red-600" size={20} />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800">No Vehicles Found</h3>
//                 <p className="text-sm text-gray-600 mt-1">
//                   You need to add at least one verified vehicle to offer rides.
//                 </p>
//               </div>
//             </div>
            
//             <p className="text-sm text-gray-500 mb-6">
//               Please add your vehicle details including number plate, brand, model, and seating capacity.
//               The vehicle needs to be verified before you can offer rides.
//             </p>
            
//             <div className="flex gap-3">
//               <button
//                 onClick={handleCloseVehicleErrorModal}
//                 className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => {
//                   setShowVehicleErrorModal(false);
//                   setShowVehicleModal(true);
//                 }}
//                 className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
//               >
//                 <Plus size={18} />
//                 Add Vehicle
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Vehicle Add Modal */}
//       <VehicleModal
//         isOpen={showVehicleModal}
//         onClose={() => setShowVehicleModal(false)}
//         onVehicleAdded={handleVehicleAdded}
//       />

//       {/* MAIN AREA */}
//       <div className="flex-1 pt-16 overflow-hidden">
//         <div className="h-full max-w-6xl mx-auto px-4 py-4 flex flex-col">
//           {/* HEADER */}
//           <div className="mb-6 flex-shrink-0">
//             <h1 className="text-2xl font-bold text-foreground">
//               Offer a Ride
//             </h1>
//             <p className="text-sm text-muted-foreground">
//               Fill the details to create your ride
//             </p>
//           </div>

//           {/* CONTENT - Single row layout, no scroll */}
//           <div className="flex-1 overflow-y-auto">
//             <div className="space-y-4">
//               {/* PICKUP & DROP IN SINGLE ROW */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* PICKUP LOCATION */}
//                 <div className="space-y-2">
//                   <div className="relative" ref={pickupRef}>
//                     <div className="bg-card rounded-xl p-4 border border-border">
//                       <div className="flex items-center gap-3">
//                         <MapPin className="text-primary" size={18} />
//                         <input
//                           value={pickupLocation}
//                           onChange={(e) => {
//                             setPickupLocation(e.target.value);
//                             searchPickupPlaces(e.target.value);
//                           }}
//                           onFocus={() => {
//                             if (pickupLocation.length >= 2) {
//                               setShowPickupSuggestions(true);
//                             }
//                           }}
//                           placeholder="Enter pickup location"
//                           className="w-full font-semibold outline-none bg-transparent placeholder:text-muted-foreground"
//                         />
//                         <button
//                           onClick={handleCurrentLocationPickup}
//                           disabled={gettingCurrentLocationPickup}
//                           className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
//                           title="Use current location"
//                         >
//                           {gettingCurrentLocationPickup ? (
//                             <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
//                           ) : (
//                             <Navigation size={16} className="text-primary" />
//                           )}
//                         </button>
//                         {pickupLocation && (
//                           <button
//                             onClick={() => {
//                               setPickupLocation('');
//                               setSelectedPickup(null);
//                               setPickupSuggestions([]);
//                               setDistance(null);
//                               setDistanceError('');
//                             }}
//                             className="p-1 hover:bg-muted rounded-full"
//                           >
//                             <X size={16} />
//                           </button>
//                         )}
//                       </div>
//                     </div>
                    
//                     {/* Pickup Suggestions */}
//                     {showPickupSuggestions && pickupSuggestions.length > 0 && (
//                       <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                         {pickupSuggestions.map((place) => (
//                           <div
//                             key={place.id}
//                             onClick={() => handlePickupSelect(place)}
//                             className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
//                           >
//                             <div className="font-medium text-foreground">{place.displayName.text}</div>
//                             <div className="text-xs text-muted-foreground">
//                               {place.formattedAddress}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* DROP LOCATION */}
//                 <div className="space-y-2">
//                   <div className="relative" ref={dropRef}>
//                     <div className="bg-card rounded-xl p-4 border border-border">
//                       <div className="flex items-center gap-3">
//                         <Send className="text-primary rotate-45" size={18} />
//                         <input
//                           value={dropLocation}
//                           onChange={(e) => {
//                             setDropLocation(e.target.value);
//                             searchDropPlaces(e.target.value);
//                           }}
//                           onFocus={() => {
//                             if (dropLocation.length >= 2) {
//                               setShowDropSuggestions(true);
//                             }
//                           }}
//                           placeholder="Enter drop location"
//                           className="w-full font-semibold outline-none bg-transparent placeholder:text-muted-foreground"
//                         />
//                         <button
//                           onClick={handleCurrentLocationDrop}
//                           disabled={gettingCurrentLocationDrop}
//                           className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
//                           title="Use current location"
//                         >
//                           {gettingCurrentLocationDrop ? (
//                             <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
//                           ) : (
//                             <Navigation size={16} className="text-primary" />
//                           )}
//                         </button>
//                         {dropLocation && (
//                           <button
//                             onClick={() => {
//                               setDropLocation('');
//                               setSelectedDrop(null);
//                               setDropSuggestions([]);
//                               setDistance(null);
//                               setDistanceError('');
//                             }}
//                             className="p-1 hover:bg-muted rounded-full"
//                           >
//                             <X size={16} />
//                           </button>
//                         )}
//                       </div>
//                     </div>
                    
//                     {/* Drop Suggestions */}
//                     {showDropSuggestions && dropSuggestions.length > 0 && (
//                       <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                         {dropSuggestions.map((place) => (
//                           <div
//                             key={place.id}
//                             onClick={() => handleDropSelect(place)}
//                             className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
//                           >
//                             <div className="font-medium text-foreground">{place.displayName.text}</div>
//                             <div className="text-xs text-muted-foreground">
//                               {place.formattedAddress}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Distance Display */}
//               {distance !== null && (
//                 <div className={`bg-card rounded-xl p-4 border ${distanceError ? 'border-red-500' : 'border-green-500'}`}>
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className={`w-8 h-8 rounded-full ${distanceError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} flex items-center justify-center`}>
//                         {distanceError ? (
//                           <AlertCircle size={16} />
//                         ) : (
//                           <Navigation size={16} />
//                         )}
//                       </div>
//                       <div>
//                         <p className="font-medium text-foreground">Distance</p>
//                         <p className={`text-sm ${distanceError ? 'text-red-600' : 'text-green-600'}`}>
//                           {distance.toFixed(1)} km
//                           {distanceError && ` - ${distanceError}`}
//                         </p>
//                       </div>
//                     </div>
//                     {!distanceError && (
//                       <div className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
//                         ✓ Valid for offer
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* DATE & TIME - Single row */}
//               <div className="bg-card rounded-xl p-4 border border-border grid md:grid-cols-2 gap-4">
//                 <div className="flex items-center gap-3">
//                   <Calendar className="text-primary" size={18} />
//                   <input
//                     type="date"
//                     value={date}
//                     onChange={handleDateChange}
//                     min={getTodayDate()}
//                     className="w-full font-semibold outline-none bg-transparent"
//                   />
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <Clock className="text-primary" size={18} />
//                   <input
//                     type="time"
//                     value={time}
//                     onChange={handleTimeChange}
//                     className="text-lg font-bold w-28 outline-none bg-transparent"
//                   />
//                   <div className="flex border rounded-md overflow-hidden">
//                     <button
//                       onClick={() => setTimeFormat('AM')}
//                       className={`px-4 py-1 text-sm font-medium ${
//                         timeFormat === 'AM'
//                           ? 'bg-primary text-primary-foreground'
//                           : 'bg-transparent text-muted-foreground'
//                       }`}
//                     >
//                       AM
//                     </button>
//                     <button
//                       onClick={() => setTimeFormat('PM')}
//                       className={`px-4 py-1 text-sm font-medium ${
//                         timeFormat === 'PM'
//                           ? 'bg-primary text-primary-foreground'
//                           : 'bg-transparent text-muted-foreground'
//                       }`}
//                     >
//                       PM
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* SEATS */}
//               <div className="bg-card rounded-xl p-4 border border-border">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     <Users className="text-primary" size={18} />
//                     <span className="font-medium text-foreground">
//                       Seats available
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-4">
//                     <button
//                       onClick={() => seats > 1 && setSeats(seats - 1)}
//                       className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-accent"
//                     >
//                       <Minus size={16} />
//                     </button>

//                     <span className="text-2xl font-bold">{seats}</span>

//                     <button
//                       onClick={() => seats < 8 && setSeats(seats + 1)}
//                       className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90"
//                     >
//                       <Plus size={16} />
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* PRICE NEGOTIABLE TOGGLE - UPDATED UI */}
//               <div className="bg-white rounded-lg p-4 border border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNegotiable ? 'bg-[#21409A]' : 'bg-gray-100'}`}>
//                       <DollarSign size={20} className={isNegotiable ? 'text-white' : 'text-gray-600'} />
//                     </div>
//                     <div>
//                       <h3 className="font-medium text-gray-800 text-sm">Price Negotiable</h3>
//                       <p className="text-xs text-gray-500">
//                         {isNegotiable 
//                           ? 'Allow passengers to negotiate the fare' 
//                           : 'Fixed fare, no negotiation'}
//                       </p>
//                     </div>
//                   </div>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={isNegotiable}
//                       onChange={handleToggleNegotiable}
//                       className="sr-only peer"
//                     />
//                     <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#21409A]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#21409A]"></div>
//                   </label>
//                 </div>
//               </div>

//               {/* VEHICLE SELECTION */}
//               <div className="bg-card rounded-xl p-4 border border-border">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <Car className="text-primary" size={18} />
//                     <span className="font-medium text-foreground">
//                       Select Vehicle
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={loadVehicles}
//                       className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
//                     >
//                       <Loader2 size={12} className={loadingVehicles ? 'animate-spin' : ''} />
//                       Refresh
//                     </button>
//                     <span className="text-xs text-muted-foreground">|</span>
//                     <button
//                       onClick={handleManualAddVehicle}
//                       className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
//                     >
//                       <Plus size={12} />
//                       Add Vehicle
//                     </button>
//                   </div>
//                 </div>
                
//                 {loadingVehicles ? (
//                   <div className="flex items-center justify-center gap-2 py-3">
//                     <Loader2 size={16} className="animate-spin text-primary" />
//                     <span className="text-sm text-foreground">Loading verified vehicles...</span>
//                   </div>
//                 ) : vehicleError ? (
//                   <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                     <div className="flex items-center gap-2 text-red-600">
//                       <ShieldAlert size={16} />
//                       <div className="text-sm">{vehicleError}</div>
//                     </div>
//                     <button
//                       onClick={handleManualAddVehicle}
//                       className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
//                     >
//                       <Plus size={14} />
//                       Add Vehicle Now
//                     </button>
//                   </div>
//                 ) : vehicles.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                     {vehicles.map((vehicle) => (
//                       <div 
//                         key={vehicle.id}
//                         onClick={() => setSelectedVehicle(vehicle)}
//                         className={`p-3 border rounded-lg cursor-pointer transition-all ${
//                           selectedVehicle?.id === vehicle.id
//                             ? 'border-green-500 bg-green-50'
//                             : 'bg-gray-50 border-border hover:bg-gray-100'
//                         }`}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-1.5 mb-1">
//                               <span className="font-medium text-sm truncate">{vehicle.number_plate}</span>
//                               <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
//                                 ✓ Verified
//                               </span>
//                             </div>
//                             <div className="text-xs text-gray-600 truncate">
//                               {vehicle.model || vehicle.vehicle_type} · {vehicle.seating_capacity} seats
//                               {vehicle.color && ` · ${vehicle.color}`}
//                             </div>
//                           </div>
//                           {selectedVehicle?.id === vehicle.id && (
//                             <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-green-500">
//                               <div className="w-2 h-2 rounded-full bg-green-500" />
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-3 border border-dashed border-border rounded-lg bg-gray-50">
//                     <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                     <p className="text-sm text-gray-500 mb-3">No verified vehicles found</p>
//                     <button
//                       onClick={handleManualAddVehicle}
//                       className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
//                     >
//                       <Plus size={14} />
//                       Add Your First Vehicle
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* DRIVER SELECTION */}
//               <div className="bg-card rounded-xl p-4 border border-border">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <User className="text-primary" size={18} />
//                     <span className="font-medium text-foreground">
//                       Select Driver
//                     </span>
//                   </div>
//                   <button
//                     onClick={loadDrivers}
//                     className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
//                   >
//                     <Loader2 size={12} className={loadingDrivers ? 'animate-spin' : ''} />
//                     Refresh
//                   </button>
//                 </div>
                
//                 {loadingDrivers ? (
//                   <div className="flex items-center justify-center gap-2 py-3">
//                     <Loader2 size={16} className="animate-spin text-primary" />
//                     <span className="text-sm text-foreground">Loading drivers...</span>
//                   </div>
//                 ) : driverError ? (
//                   <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                     <div className="flex items-center gap-2 text-red-600">
//                       <ShieldAlert size={16} />
//                       <div className="text-sm">{driverError}</div>
//                     </div>
//                   </div>
//                 ) : drivers.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                     {drivers.map((driver) => {
//                       // Check if this driver is the current user
//                       const isCurrentUser = isAuthenticated && 
//                         user && 
//                         driver.user.mobile_number === user.mobile_number;
                      
//                       return (
//                         <div 
//                           key={driver.id}
//                           onClick={() => setSelectedDriver(driver)}
//                           className={`p-3 border rounded-lg cursor-pointer transition-all ${
//                             selectedDriver?.id === driver.id
//                               ? 'border-blue-500 bg-blue-50'
//                               : 'bg-gray-50 border-border hover:bg-gray-100'
//                           }`}
//                         >
//                           <div className="flex items-start justify-between">
//                             <div className="flex-1 min-w-0">
//                               <div className="flex items-center gap-1.5 mb-1">
//                                 <span className="font-medium text-sm truncate">
//                                   {isCurrentUser ? 'You' : `${driver.user.first_name} ${driver.user.last_name}`}
//                                 </span>
//                                 {isCurrentUser ? (
//                                   <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
//                                     🚗 You
//                                   </span>
//                                 ) : driver.is_verified ? (
//                                   <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
//                                     ✓ Verified
//                                   </span>
//                                 ) : (
//                                   <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-yellow-100 text-yellow-800">
//                                     Unverified
//                                   </span>
//                                 )}
//                               </div>
//                               <div className="text-xs text-gray-600 truncate">
//                                 {driver.user.mobile_number} · {driver.user.gender || 'Not specified'}
//                               </div>
//                             </div>
//                             {selectedDriver?.id === driver.id && (
//                               <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-blue-500">
//                                 <div className="w-2 h-2 rounded-full bg-blue-500" />
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="text-center py-3 border border-dashed border-border rounded-lg bg-gray-50">
//                     <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                     <p className="text-sm text-gray-500">No drivers found</p>
//                   </div>
//                 )}
//               </div>

//               {/* PREFERENCES */}
//               <div className="bg-card rounded-xl p-4 border border-border">
//                 <p className="text-sm font-medium mb-3 text-foreground">
//                   Preferences
//                 </p>
//                 <div className="flex flex-wrap gap-2">
//                   {loadingPreferences ? (
//                     <div className="text-sm text-muted-foreground">Loading preferences...</div>
//                   ) : (
//                     preferences.map(pref => (
//                       <button
//                         key={pref}
//                         onClick={() => togglePreference(pref)}
//                         className={`px-4 py-2 rounded-lg font-medium transition ${
//                           selectedPreferences.includes(pref)
//                             ? 'bg-primary text-primary-foreground'
//                             : 'bg-muted text-muted-foreground hover:bg-muted/80'
//                         }`}
//                       >
//                         {pref}
//                       </button>
//                     ))
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* FLOATING CONTINUE BUTTON */}
//           <div className="fixed bottom-6 right-6 z-10">
//             <button
//               onClick={handleContinue}
//               disabled={!selectedPickup || !selectedDrop || !selectedVehicle || !selectedDriver || loadingSettings || !!error || !!distanceError || !time}
//               className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
//                 selectedPickup && selectedDrop && selectedVehicle && selectedDriver && !loadingSettings && !error && !distanceError && time
//                   ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
//                   : 'bg-muted text-muted-foreground cursor-not-allowed'
//               }`}
//               aria-label="Continue"
//             >
//               <CircleArrowRight className="w-6 h-6" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OfferRide1;


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
  ShieldAlert,
  Loader2,
  DollarSign,
  Handshake,
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
import { getVerifiedDrivers, getAllDrivers, Driver } from '../../services/driverApi';
import { Location } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import VehicleModal from '../../components/common/VehicleModal';

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
  
  // Modal state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showVehicleErrorModal, setShowVehicleErrorModal] = useState(false);
  const [hasCheckedVehicles, setHasCheckedVehicles] = useState(false); // Track if we've checked for vehicles
  
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

  // Initialize
  useEffect(() => {
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
  }, []);

  // Load vehicles and drivers when component mounts
  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  // Show modal ONLY when no vehicles are found AND we've finished loading
  useEffect(() => {
    console.log('Vehicle check:', {
      loadingVehicles,
      vehiclesCount: vehicles.length,
      hasCheckedVehicles,
      showVehicleModal,
      showVehicleErrorModal
    });
    
    // Only show modal when:
    // 1. We're not loading vehicles
    // 2. We have no vehicles
    // 3. We haven't shown the modal yet
    // 4. We're not currently showing the modal
    if (
      !loadingVehicles && 
      vehicles.length === 0 && 
      !hasCheckedVehicles && 
      !showVehicleModal &&
      !showVehicleErrorModal
    ) {
      console.log('Showing vehicle error modal - no vehicles found');
      setHasCheckedVehicles(true);
      setShowVehicleErrorModal(true);
    }
  }, [loadingVehicles, vehicles.length, hasCheckedVehicles, showVehicleModal, showVehicleErrorModal]);

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
    setHasCheckedVehicles(false); // Reset check when loading
    try {
      const verifiedVehicles = await fetchVerifiedVehicles();
      console.log('Loaded vehicles:', verifiedVehicles);
      setVehicles(verifiedVehicles);
      
      if (verifiedVehicles.length > 0) {
        // Auto-select first verified vehicle
        setSelectedVehicle(verifiedVehicles[0]);
        setHasCheckedVehicles(true); // We have vehicles, no need to show modal
      } else {
        setVehicleError('No verified vehicles found. Please add and verify a vehicle first.');
      }
    } catch (error: any) {
      console.error('Failed to load vehicles:', error);
      setVehicleError(error.message || 'Failed to load vehicles');
      setHasCheckedVehicles(true); // Even on error, mark as checked
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
        // Check if current user is already in the drivers list
        const userAlreadyInList = allDrivers.some(driver => 
          driver.user.mobile_number === user.mobile_number
        );
        
        if (!userAlreadyInList) {
          // Add current user as a driver option
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
            driving_license_number: '',
            driving_license_expiry: '',
            vehicle_id: null,
            status: 'active'
          };
          
          driversList = [currentUserAsDriver, ...allDrivers];
        }
      }
      
      setDrivers(driversList);
      
      if (driversList.length > 0) {
        // Auto-select first driver
        setSelectedDriver(driversList[0]);
      } else {
        setDriverError('No drivers found. Please add a driver first.');
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

  // Handle manual add vehicle button click
  const handleManualAddVehicle = () => {
    setShowVehicleModal(true);
  };

  // Handle vehicle added from modal
  const handleVehicleAdded = () => {
    // Refresh vehicles list
    loadVehicles();
    setShowVehicleModal(false);
    setShowVehicleErrorModal(false);
  };

  // Handle close vehicle error modal
  const handleCloseVehicleErrorModal = () => {
    setShowVehicleErrorModal(false);
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

      {/* Vehicle Error Modal - Only shows when NO vehicles */}
      {showVehicleErrorModal && vehicles.length === 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">No Vehicles Found</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You need to add at least one verified vehicle to offer rides.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Please add your vehicle details including number plate, brand, model, and seating capacity.
              The vehicle needs to be verified before you can offer rides.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCloseVehicleErrorModal}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowVehicleErrorModal(false);
                  setShowVehicleModal(true);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Add Modal */}
      <VehicleModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onVehicleAdded={handleVehicleAdded}
      />

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
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
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
                    onChange={handleDateChange}
                    min={getTodayDate()}
                    className="w-full font-semibold outline-none bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="text-primary" size={18} />
                  <input
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="text-lg font-bold w-28 outline-none bg-transparent"
                  />
                  <div className="flex border rounded-md overflow-hidden">
                    <button
                      onClick={() => setTimeFormat('AM')}
                      className={`px-4 py-1 text-sm font-medium ${
                        timeFormat === 'AM'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-transparent text-muted-foreground'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setTimeFormat('PM')}
                      className={`px-4 py-1 text-sm font-medium ${
                        timeFormat === 'PM'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-transparent text-muted-foreground'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* SEATS */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
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
              </div>

              {/* PRICE NEGOTIABLE TOGGLE - UPDATED UI */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNegotiable ? 'bg-blue-500' : 'bg-gray-100'}`}>
                      <Handshake size={20} className={isNegotiable ? 'text-white' : 'text-gray-600'} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">Price Negotiable</h3>
                      <p className="text-xs text-gray-500">
                        {isNegotiable 
                          ? 'Allow passengers to negotiate the fare' 
                          : 'Fixed fare, no negotiation'}
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
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              {/* VEHICLE SELECTION */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Car className="text-primary" size={18} />
                    <span className="font-medium text-foreground">
                      Select Vehicle
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadVehicles}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Loader2 size={12} className={loadingVehicles ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                    <span className="text-xs text-muted-foreground">|</span>
                    <button
                      onClick={handleManualAddVehicle}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add Vehicle
                    </button>
                  </div>
                </div>
                
                {loadingVehicles ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-foreground">Loading verified vehicles...</span>
                  </div>
                ) : vehicleError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600">
                      <ShieldAlert size={16} />
                      <div className="text-sm">{vehicleError}</div>
                    </div>
                    <button
                      onClick={handleManualAddVehicle}
                      className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Add Vehicle Now
                    </button>
                  </div>
                ) : vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {vehicles.map((vehicle) => (
                      <div 
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedVehicle?.id === vehicle.id
                            ? 'border-green-500 bg-green-50'
                            : 'bg-gray-50 border-border hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-medium text-sm truncate">{vehicle.number_plate}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
                                ✓ Verified
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {vehicle.model || vehicle.vehicle_type} · {vehicle.seating_capacity} seats
                              {vehicle.color && ` · ${vehicle.color}`}
                            </div>
                          </div>
                          {selectedVehicle?.id === vehicle.id && (
                            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-green-500">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 border border-dashed border-border rounded-lg bg-gray-50">
                    <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No verified vehicles found</p>
                    <button
                      onClick={handleManualAddVehicle}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <Plus size={14} />
                      Add Your First Vehicle
                    </button>
                  </div>
                )}
              </div>

              {/* DRIVER SELECTION */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="text-primary" size={18} />
                    <span className="font-medium text-foreground">
                      Select Driver
                    </span>
                  </div>
                  <button
                    onClick={loadDrivers}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Loader2 size={12} className={loadingDrivers ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
                
                {loadingDrivers ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-foreground">Loading drivers...</span>
                  </div>
                ) : driverError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600">
                      <ShieldAlert size={16} />
                      <div className="text-sm">{driverError}</div>
                    </div>
                  </div>
                ) : drivers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {drivers.map((driver) => {
                      // Check if this driver is the current user
                      const isCurrentUser = isAuthenticated && 
                        user && 
                        driver.user.mobile_number === user.mobile_number;
                      
                      return (
                        <div 
                          key={driver.id}
                          onClick={() => setSelectedDriver(driver)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedDriver?.id === driver.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'bg-gray-50 border-border hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {isCurrentUser ? 'You' : `${driver.user.first_name} ${driver.user.last_name}`}
                                </span>
                                {isCurrentUser ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
                                    🚗 You
                                  </span>
                                ) : driver.is_verified ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-green-100 text-green-800">
                                    ✓ Verified
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-yellow-100 text-yellow-800">
                                    Unverified
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {driver.user.mobile_number} · {driver.user.gender || 'Not specified'}
                              </div>
                            </div>
                            {selectedDriver?.id === driver.id && (
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center ml-1 flex-shrink-0 border-blue-500">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 border border-dashed border-border rounded-lg bg-gray-50">
                    <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No drivers found</p>
                  </div>
                )}
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
          </div>

          {/* FLOATING CONTINUE BUTTON */}
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={handleContinue}
              disabled={!selectedPickup || !selectedDrop || !selectedVehicle || !selectedDriver || loadingSettings || !!error || !!distanceError || !time}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                selectedPickup && selectedDrop && selectedVehicle && selectedDriver && !loadingSettings && !error && !distanceError && time
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