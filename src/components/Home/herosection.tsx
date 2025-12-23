import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiCalendar, FiUser, FiArrowRight, FiX, FiSearch, FiNavigation } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { autocompletePlaces, getCurrentLocation, reverseGeocode, searchTextPlaces } from '../../services/placesApi';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import axios from 'axios';
import carImage from '../../assets/mainhome.svg';
import { BASE_URL } from '@/config/api';

// Interface for place object
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

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get auth state
  
  // State for form inputs
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toPlace, setToPlace] = useState<Place | null>(null);
  const [travelDate, setTravelDate] = useState<Date | null>(new Date());
  const [seats, setSeats] = useState(1);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  // State for autocomplete suggestions
  const [fromSuggestions, setFromSuggestions] = useState<Place[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Place[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs for handling click outside
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setTimeout(() => setShowFromSuggestions(false), 200);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setTimeout(() => setShowToSuggestions(false), 200);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle current location for "from" field
  const handleUseCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      setError('');
      const position = await getCurrentLocation();
      const places = await reverseGeocode(position.lat, position.lng);
      if (places.length > 0) {
        const place = places[0];
        setFromLocation(place.displayName.text);
        setFromPlace(place);
        setShowFromSuggestions(false);
      }
    } catch (err: any) {
      setError('Unable to get current location. Please enable location services or enter manually.');
      console.error('Location error:', err);
    } finally {
      setIsLocationLoading(false);
    }
  };
  
  // Debounced autocomplete function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  
  // Handle from location input change
  const handleFromChange = async (value: string) => {
    setFromLocation(value);
    if (value.trim().length > 2) {
      try {
        const suggestions = await autocompletePlaces(value);
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } catch (err) {
        console.error('Error fetching from suggestions:', err);
        // Fallback to searchText API if autocomplete fails
        try {
          const searchResults = await searchTextPlaces(value);
          setFromSuggestions(searchResults);
          setShowFromSuggestions(true);
        } catch (searchErr) {
          console.error('Error with search text API:', searchErr);
        }
      }
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  };
  
  // Handle to location input change
  const handleToChange = async (value: string) => {
    setToLocation(value);
    if (value.trim().length > 2) {
      try {
        const suggestions = await autocompletePlaces(value);
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      } catch (err) {
        console.error('Error fetching to suggestions:', err);
        // Fallback to searchText API if autocomplete fails
        try {
          const searchResults = await searchTextPlaces(value);
          setToSuggestions(searchResults);
          setShowToSuggestions(true);
        } catch (searchErr) {
          console.error('Error with search text API:', searchErr);
        }
      }
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  };
  
  // Debounced handlers
  const debouncedFromChange = React.useCallback(debounce(handleFromChange, 300), []);
  const debouncedToChange = React.useCallback(debounce(handleToChange, 300), []);
  
  // Handle place selection
  const handleSelectFromPlace = (place: Place) => {
    setFromLocation(place.displayName.text);
    setFromPlace(place);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
    setError('');
  };
  
  const handleSelectToPlace = (place: Place) => {
    setToLocation(place.displayName.text);
    setToPlace(place);
    setToSuggestions([]);
    setShowToSuggestions(false);
    setError('');
  };
  
  // Clear from field
  const handleClearFrom = () => {
    setFromLocation('');
    setFromPlace(null);
    setFromSuggestions([]);
    setShowFromSuggestions(false);
  };
  
  // Clear to field
  const handleClearTo = () => {
    setToLocation('');
    setToPlace(null);
    setToSuggestions([]);
    setShowToSuggestions(false);
  };
  
  // Handle seats increment/decrement
  const handleIncrementSeats = () => {
    setSeats(prev => prev + 1);
  };
  
  const handleDecrementSeats = () => {
    if (seats > 1) {
      setSeats(prev => prev - 1);
    }
  };
  
  // Handle preferences toggle
  const handlePreferenceToggle = (pref: string, label: string) => {
    setPreferences(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };
  
  // Check if search button should be enabled
  const isSearchEnabled = () => {
    return fromPlace?.location && toPlace?.location && travelDate;
  };
  
  // Search rides API call
  const searchRides = async () => {
    if (!isSearchEnabled()) {
      setError('Please select both pickup and dropoff locations');
      return;
    }
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please login to search for rides');
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get token from user object (from AuthContext)
      const token = user?.token || localStorage.getItem('token') || '';
      
      if (!token) {
        setError('Please login to search for rides');
        navigate('/login');
        return;
      }
      
      // Prepare query parameters exactly as per API spec
      const params: Record<string, any> = {
        from_lat: fromPlace?.location?.latitude || 0,
        from_lng: fromPlace?.location?.longitude || 0,
        to_lat: toPlace?.location?.latitude || 0,
        to_lng: toPlace?.location?.longitude || 0,
        date: travelDate ? travelDate.toISOString().split('T')[0] : '', // YYYY-MM-DD format
        no_of_seat: seats,
        is_full_car: false,
        sort_by: 'time_asc',
        page: 1,
        limit: 10
      };
      
      // Add preferences only if selected
      if (preferences.length > 0) {
        params.preferences = preferences.join(',');
      }
      
      // Add short location names if available
      if (fromLocation) {
        params.from_short_location = fromLocation.split(',')[0]; // Take first part of address
      }
      if (toLocation) {
        params.to_short_location = toLocation.split(',')[0]; // Take first part of address
      }
      
      console.log('API Request params:', params);
      console.log('Using token:', token.substring(0, 20) + '...'); // Log first 20 chars of token
      
      const response = await axios.get(`${BASE_URL}/api/rides/search`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.rides) {
        // Save search results to localStorage for persistence
        localStorage.setItem('searchResults', JSON.stringify(response.data));
        localStorage.setItem('searchParams', JSON.stringify({
          from: fromLocation,
          to: toLocation,
          date: travelDate,
          seats,
          preferences
        }));
        
        // Navigate to find-ride page with search results
        navigate('/find-ride', { 
          state: { 
            searchResults: response.data,
            searchParams: params
          } 
        });
      } else {
        setError('No rides found for your search criteria.');
      }
    } catch (err: any) {
      console.error('Error searching rides:', err);
      
      // Handle specific error cases
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          setError('Your session has expired. Please login again.');
          // Clear invalid token and redirect to login
          localStorage.removeItem('token');
          if (user) {
            // If using AuthContext, you might want to logout
            // logout(); // Uncomment if you have logout function
          }
          navigate('/login');
        } else if (err.response.status === 400) {
          setError('Invalid search parameters. Please check your inputs.');
        } else if (err.response.status === 404) {
          setError('No rides found for your search criteria.');
        } else {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // Request made but no response
        setError('Network error. Please check your internet connection.');
      } else {
        // Other errors
        setError('Failed to search rides. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFindRideClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/offer-ride1');
  };

  const handleOfferRideClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/offer-ride1');
  };

  // Render suggestion item
  const renderSuggestionItem = (place: Place, onClick: () => void) => (
    <div
      key={place.id}
      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
      onClick={onClick}
    >
      <div className="font-medium text-sm text-gray-800">{place.displayName.text}</div>
      <div className="text-xs text-gray-500 truncate">{place.formattedAddress}</div>
    </div>
  );

  return (
    <section className="relative bg-white pt-16 lg:pt-20 pb-16 md:pb-20 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-6 lg:mb-10">
          
          {/* Left Content */}
          <div className="space-y-4 lg:space-y-6">
            <div className="border-l-4 border-[#21409A] pl-3 lg:pl-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 italic leading-tight">
                Find Your Perfect<br />
                Ride in Minutes.
              </h1>
            </div>

            <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-xl">
              Trusted drivers, affordable trips, and a community that moves together.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleFindRideClick}
                className="bg-[#21409A] text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#21409A]/90 transition cursor-pointer"
              >
                Offer ride <FiArrowRight />
              </button>

              {/* <button
                onClick={handleOfferRideClick}
                className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
              >
                Offer ride
              </button> */}
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex justify-center lg:justify-end mt-6 lg:mt-0">
            <img
              src={carImage}
              alt="Car"
              className="w-full max-w-sm sm:max-w-md md:max-w-md lg:max-w-lg xl:max-w-xl object-contain"
            />
          </div>
        </div>

        {/* SEARCH FORM - Fixed positioning and spacing */}
        <div className="relative mt-6 lg:mt-8 px-0 sm:px-0">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 md:p-5 max-w-7xl mx-auto relative z-20">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
              
              {/* From Location with Autocomplete */}
              <div className="relative" ref={fromRef}>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 hover:border-[#21409A] transition-colors">
                  <FiMapPin className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={fromLocation}
                      onChange={(e) => {
                        setFromLocation(e.target.value);
                        debouncedFromChange(e.target.value);
                      }}
                      onFocus={() => {
                        if (fromLocation.trim().length > 2 && fromSuggestions.length > 0) {
                          setShowFromSuggestions(true);
                        }
                      }}
                      placeholder="Pickup location..."
                      className="w-full text-xs sm:text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isLocationLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-[#21409A]"></div>
                    ) : (
                      <button
                        onClick={handleUseCurrentLocation}
                        className="text-xs text-[#21409A] hover:text-[#1a347d] p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors"
                        type="button"
                        title="Use current location"
                      >
                        <FiNavigation size={12} className="sm:size-[14px]" />
                      </button>
                    )}
                    {fromLocation && (
                      <button
                        onClick={handleClearFrom}
                        className="text-gray-400 hover:text-gray-600 p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors"
                        type="button"
                      >
                        <FiX size={12} className="sm:size-[14px]" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* From Suggestions Dropdown */}
                {showFromSuggestions && fromSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 sm:max-h-60 overflow-y-auto">
                    {fromSuggestions.map((place) => 
                      renderSuggestionItem(place, () => handleSelectFromPlace(place))
                    )}
                  </div>
                )}
              </div>

              {/* To Location with Autocomplete */}
              <div className="relative" ref={toRef}>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 hover:border-[#21409A] transition-colors">
                  <FiMapPin className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => {
                        setToLocation(e.target.value);
                        debouncedToChange(e.target.value);
                      }}
                      onFocus={() => {
                        if (toLocation.trim().length > 2 && toSuggestions.length > 0) {
                          setShowToSuggestions(true);
                        }
                      }}
                      placeholder="Dropoff location..."
                      className="w-full text-xs sm:text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                  </div>
                  {toLocation && (
                    <button
                      onClick={handleClearTo}
                      className="text-gray-400 hover:text-gray-600 p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                      type="button"
                    >
                      <FiX size={12} className="sm:size-[14px]" />
                    </button>
                  )}
                </div>
                
                {/* To Suggestions Dropdown */}
                {showToSuggestions && toSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 sm:max-h-60 overflow-y-auto">
                    {toSuggestions.map((place) => 
                      renderSuggestionItem(place, () => handleSelectToPlace(place))
                    )}
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex items-center gap-2 sm:gap-3 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 hover:border-[#21409A] transition-colors">
                <FiCalendar className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                <DatePicker
                  selected={travelDate}
                  onChange={(date) => setTravelDate(date)}
                  minDate={new Date()}
                  dateFormat="EEE, MMM d"
                  className="w-full text-xs sm:text-sm outline-none bg-transparent cursor-pointer placeholder-gray-400"
                  placeholderText="Select date"
                  wrapperClassName="w-full"
                />
              </div>

              {/* Seats with Increment/Decrement */}
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 hover:border-[#21409A] transition-colors">
                <FiUser className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleDecrementSeats}
                    disabled={seats <= 1}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-gray-600 text-xs sm:text-sm">-</span>
                  </button>
                  <div className="text-center min-w-[32px] sm:min-w-[40px]">
                    <span className="text-xs sm:text-sm font-medium text-gray-800">{seats}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleIncrementSeats}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-600 text-xs sm:text-sm">+</span>
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">seat{seats !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Search Button */}
              <button 
                onClick={searchRides}
                disabled={!isSearchEnabled() || isLoading}
                className={`
                  px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition w-full cursor-pointer flex items-center justify-center gap-1 sm:gap-2
                  ${isSearchEnabled() 
                    ? 'bg-[#21409A] text-white hover:bg-[#1a347d]' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span className="ml-1 sm:ml-2">Searching...</span>
                  </>
                ) : (
                  <>
                    <FiSearch size={14} className="sm:size-[16px]" />
                    <span className="ml-1 sm:ml-2">Search Ride</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                {error}
              </div>
            )}

            {/* Filters - Preferences */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button 
                onClick={() => handlePreferenceToggle('ladies_only', 'Ladies only')}
                className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all border ${
                  preferences.includes('ladies_only') 
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:border-[#21409A] hover:text-[#21409A]'
                }`}
              >
                👩 Ladies only
                {preferences.includes('ladies_only') && <FiX size={10} className="sm:size-[12px]" />}
              </button>
              <button 
                onClick={() => handlePreferenceToggle('senior_citizen', 'Senior Citizen')}
                className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all border ${
                  preferences.includes('senior_citizen') 
                    ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:border-[#21409A] hover:text-[#21409A]'
                }`}
              >
                🧓 Senior Citizen
                {preferences.includes('senior_citizen') && <FiX size={10} className="sm:size-[12px]" />}
              </button>
              <button 
                onClick={() => handlePreferenceToggle('kids_friendly', 'Kids friendly')}
                className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all border ${
                  preferences.includes('kids_friendly') 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:border-[#21409A] hover:text-[#21409A]'
                }`}
              >
                👶 Kids friendly
                {preferences.includes('kids_friendly') && <FiX size={10} className="sm:size-[12px]" />}
              </button>
            </div>
            
            {/* Selected Preferences */}
            {preferences.length > 0 && (
              <div className="mt-3 sm:mt-4 text-xs text-gray-500 flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className="font-medium">Selected preferences:</span>
                {preferences.map(pref => {
                  const labels: Record<string, string> = {
                    'ladies_only': 'Ladies only',
                    'senior_citizen': 'Senior Citizen',
                    'kids_friendly': 'Kids friendly'
                  };
                  return (
                    <span key={pref} className="bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs">
                      {labels[pref] || pref}
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Selected Locations Info */}
            {(fromPlace || toPlace) && (
              <div className="mt-3 sm:mt-4 text-xs text-gray-500 space-y-0.5 sm:space-y-1">
                {fromPlace?.location && (
                  <div className="break-words">Pickup: {fromLocation} (Lat: {fromPlace.location.latitude.toFixed(6)}, Lng: {fromPlace.location.longitude.toFixed(6)})</div>
                )}
                {toPlace?.location && (
                  <div className="break-words">Dropoff: {toLocation} (Lat: {toPlace.location.latitude.toFixed(6)}, Lng: {toPlace.location.longitude.toFixed(6)})</div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;