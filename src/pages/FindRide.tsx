import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { FiSun, FiMoon } from "react-icons/fi";
import RideCard from "@/components/Findride/RideCard";
import ConfirmRequestPanel from "@/components/Findride/ConfirmRequestPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { BASE_URL } from "@/config/api";
import { getUserDocuments } from "@/services/documentApi";

interface Ride {
  ride_id: number;
  ride_status: string;
  delay_info: any;
  available_seats: number;
  is_negotiable: boolean;
  time_of_day: 'day' | 'night';
  full_ride_details: {
    from: string | null;
    to: string | null;
    starts_at: string;
  };
  searched_segment: {
    from_stop: string;
    to_stop: string;
    boarding_stop_id: number;
    drop_stop_id: number;
    departure_time: string;
    arrival_time: string;
    duration: string;
    price: string;
  };
  driver: {
    user_id: number;
    name: string;
    average_rating: string;
    profile_image_url: string;
  };
  vehicle: {
    number_plate: string;
    ownership_type: string;
  };
  preferences: string[];
}

interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  timeOfDay?: 'day' | 'night';
  seats?: number;
  preferences?: string[];
}

interface BookingSuccessData {
  booking_number: string;
  booking_status: string;
  final_fare: number;
  ride_post_id: string;
}

interface CreateRideRequestData {
  from_lat: number;
  from_lng: number;
  from_location_name: string;
  to_lat: number;
  to_lng: number;
  to_location_name: string;
  travel_date: string;
  travel_time: string;
  seats_required: number;
  preferences?: number[];
}

interface Document {
  id: number;
  documentType: string;
  documentNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

const PREFERENCE_MAPPING: { [key: string]: number } = {
  "Ladies only": 12,
  "Kids Only": 11,
  "Senior Citizen": 18,
  "Kids friendly": 11,
  "Female Driver Preferred": 10,
  "Male Passengers Only": 13,
  "All Genders Welcome": 14,
  "Pet-Friendly Ride": 9,
  "Smoke-Free Vehicle": 17,
  "1 Luggage Per Person": 15,
  "2 Luggage Per Person": 16,
  "Extra Luggage Space": 8,
  "Wheelchair Accessible": 7,
  "Silent Ride Preferred": 4,
  "Conversation Welcome": 5,
  "AC Temperature Control": 6,
  "Email Updates": 1,
  "SMS Alerts": 2,
  "Push Notifications": 3,
};

const FindRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const requestInProgress = useRef(false);
  
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'day' | 'night'>('day');
  const [searchCoordinates, setSearchCoordinates] = useState({
    from_lat: 0,
    from_lng: 0,
    to_lat: 0,
    to_lng: 0,
    from_location_name: '',
    to_location_name: ''
  });
  const [searchPreferences, setSearchPreferences] = useState<string[]>([]);
  const [additionalSearchParams, setAdditionalSearchParams] = useState<any>({});

  const [showIdProofPopup, setShowIdProofPopup] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [isCheckingIdProof, setIsCheckingIdProof] = useState(false);
  
  // Add ref to track if ID check is already in progress
  const idCheckInProgress = useRef(false);
  // Cache for documents to prevent multiple API calls
  const documentsCache = useRef<Document[] | null>(null);
  const cacheTimestamp = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Optimized ID Proof check with caching and debouncing
  const checkIdProofVerification = useCallback(async (forceRefresh = false): Promise<boolean> => {
    if (!isAuthenticated || !user?.token) return false;

    // Check if already checking
    if (idCheckInProgress.current) {
      console.log("ID check already in progress");
      return false;
    }

    // Check cache if not forcing refresh
    if (!forceRefresh && documentsCache.current && cacheTimestamp.current) {
      const now = Date.now();
      const cacheAge = now - cacheTimestamp.current;
      if (cacheAge < CACHE_DURATION) {
        setUserDocuments(documentsCache.current);
        const hasVerifiedDocument = documentsCache.current.some(
          doc => doc.verificationStatus === 'verified'
        );
        return hasVerifiedDocument;
      }
    }

    setIsCheckingIdProof(true);
    idCheckInProgress.current = true;

    try {
      const documents = await getUserDocuments(user.token);
      
      // Update cache
      documentsCache.current = documents;
      cacheTimestamp.current = Date.now();
      
      setUserDocuments(documents);
      
      const hasVerifiedDocument = documents.some(
        doc => doc.verificationStatus === 'verified'
      );
      
      return hasVerifiedDocument;
    } catch (error) {
      console.error('Error checking ID proof:', error);
      return false;
    } finally {
      setIsCheckingIdProof(false);
      idCheckInProgress.current = false;
    }
  }, [isAuthenticated, user?.token]);

  // Single handler for all actions with ID proof check
  const handleActionWithIdProofCheck = useCallback(async (
    action: 'request' | 'create',
    ride?: Ride
  ): Promise<void> => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to perform this action",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Check ID proof verification
    const hasVerifiedIdProof = await checkIdProofVerification();
    
    if (!hasVerifiedIdProof) {
      setShowIdProofPopup(true);
      return;
    }
    
    // Proceed with the action if verified
    if (action === 'request' && ride) {
      setSelectedRide(ride);
      setShowPanel(true);
    } else if (action === 'create') {
      await handleCreateRideRequest();
    }
  }, [isAuthenticated, navigate, toast, checkIdProofVerification]);

  // Handle Request Ride button click
  const handleRequest = (ride: Ride) => {
    handleActionWithIdProofCheck('request', ride);
  };

  // Handle Create Ride Request button click
  const handleCreateRideRequestWithIdCheck = () => {
    handleActionWithIdProofCheck('create');
  };

  const handleVerifyIdProof = () => {
    setShowIdProofPopup(false);
    navigate("/id-proof");
  };

  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const locationState = location.state as { 
          searchResults?: any; 
          searchParams?: any;
          searchCoordinates?: any;
          preferences?: string[];
          travel_date?: string;
          travel_time?: string;
          seats_required?: number;
        };
        
        if (locationState?.searchResults) {
          handleRidesData(locationState.searchResults);
          
          if (locationState.searchParams) {
            setSearchParams({
              from: locationState.searchParams.from_short_location || '',
              to: locationState.searchParams.to_short_location || '',
              date: locationState.searchParams.date || '',
              seats: locationState.searchParams.no_of_seat ? parseInt(locationState.searchParams.no_of_seat) : 1,
              preferences: locationState.preferences || []
            });
            
            setAdditionalSearchParams({
              travel_date: locationState.searchParams.date || '',
              travel_time: locationState.searchParams.time || '20:00',
              seats_required: locationState.searchParams.no_of_seat ? parseInt(locationState.searchParams.no_of_seat) : 1
            });
          }
          
          if (locationState.searchCoordinates) {
            setSearchCoordinates({
              from_lat: locationState.searchCoordinates.from_lat || 0,
              from_lng: locationState.searchCoordinates.from_lng || 0,
              to_lat: locationState.searchCoordinates.to_lat || 0,
              to_lng: locationState.searchCoordinates.to_lng || 0,
              from_location_name: locationState.searchParams?.from_short_location || '',
              to_location_name: locationState.searchParams?.to_short_location || ''
            });
          }
          
          if (locationState.preferences) {
            setSearchPreferences(locationState.preferences);
          }
        } else {
          const storedResults = localStorage.getItem('searchResults');
          const storedParams = localStorage.getItem('searchParams');
          const storedCoords = localStorage.getItem('searchCoordinates');
          
          if (storedResults) {
            const parsedResults = JSON.parse(storedResults);
            handleRidesData(parsedResults);
          }
          
          if (storedParams) {
            const parsedParams = JSON.parse(storedParams);
            setSearchParams({
              from: parsedParams.from || '',
              to: parsedParams.to || '',
              date: parsedParams.date || '',
              seats: parsedParams.seats || 1,
              preferences: parsedParams.preferences || []
            });
            
            setAdditionalSearchParams({
              travel_date: parsedParams.date || '',
              travel_time: parsedParams.time || '20:00',
              seats_required: parsedParams.seats || 1
            });
            
            if (parsedParams.preferences) {
              setSearchPreferences(parsedParams.preferences);
            }
          } else {
            toast({
              title: "No search data found",
              description: "Please search for rides from the home page",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          if (storedCoords) {
            const parsedCoords = JSON.parse(storedCoords);
            setSearchCoordinates({
              from_lat: parsedCoords.from_lat || 0,
              from_lng: parsedCoords.from_lng || 0,
              to_lat: parsedCoords.to_lat || 0,
              to_lng: parsedCoords.to_lng || 0,
              from_location_name: searchParams.from || '',
              to_location_name: searchParams.to || ''
            });
          }
        }
      } catch (err) {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides. Please try searching again.");
        toast({
          title: "Error loading rides",
          description: "Please try searching again",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRides();
  }, [location.state, navigate, toast]);

  const handleRidesData = (data: any) => {
    if (data && data.rides && Array.isArray(data.rides)) {
      setRides(data.rides);
      setFilteredRides(data.rides);
      if (data.rides.length > 0 && data.rides[0].time_of_day) {
        setTimeOfDayFilter(data.rides[0].time_of_day);
      }
    } else if (Array.isArray(data)) {
      setRides(data);
      setFilteredRides(data);
    } else {
      setRides([]);
      setFilteredRides([]);
    }
  };

  useEffect(() => {
    if (timeOfDayFilter) {
      const filtered = rides.filter(ride => 
        ride.time_of_day?.toLowerCase() === timeOfDayFilter.toLowerCase()
      );
      setFilteredRides(filtered);
    } else {
      setFilteredRides(rides);
    }
  }, [timeOfDayFilter, rides]);

  const handleBookingSuccess = (bookingData: BookingSuccessData) => {
    toast({
      title: "Booking Request Sent!",
      description: `Booking number: ${bookingData.booking_number}. Status: ${bookingData.booking_status}`,
    });
    
    if (selectedRide) {
      setRides(prevRides => 
        prevRides.map(ride => 
          ride.ride_id === selectedRide.ride_id 
            ? { ...ride, available_seats: ride.available_seats - 1 }
            : ride
        )
      );
    }
    
    setShowPanel(false);
    setSelectedRide(null);
  };

  const handleClose = () => {
    setShowPanel(false);
    setSelectedRide(null);
  };

  const convertPreferencesToIds = (preferenceNames: string[]): number[] => {
    return preferenceNames
      .map(pref => PREFERENCE_MAPPING[pref])
      .filter(id => id !== undefined) as number[];
  };

  const handleCreateRideRequest = async () => {
    if (requestInProgress.current || isCreatingRequest) {
      console.log("Request already in progress, ignoring click");
      return;
    }
    
    console.log("Create Ride Request button clicked");
    
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to create a ride request",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const storedParams = JSON.parse(localStorage.getItem('searchParams') || '{}');

    if (!searchCoordinates.from_lat || !searchCoordinates.from_lng || 
        !searchCoordinates.to_lat || !searchCoordinates.to_lng) {
      toast({
        title: "Missing location data",
        description: "Please search again from the home page",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRequest(true);
    requestInProgress.current = true;

    try {
      const token = user?.token || localStorage.getItem('token') || '';
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please login to create a ride request",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      let travelTime = '10:00';
      
      if (additionalSearchParams.travel_time) {
        travelTime = additionalSearchParams.travel_time;
      } else if (timeOfDayFilter === 'night') {
        travelTime = '20:00';
      }

      const preferenceIds = convertPreferencesToIds(searchPreferences);
      console.log("Converted preference IDs:", preferenceIds);

      const requestData: CreateRideRequestData = {
        from_lat: searchCoordinates.from_lat,
        from_lng: searchCoordinates.from_lng,
        from_location_name: searchParams.from || searchCoordinates.from_location_name || 'Pickup Location',
        to_lat: searchCoordinates.to_lat,
        to_lng: searchCoordinates.to_lng,
        to_location_name: searchParams.to || searchCoordinates.to_location_name || 'Dropoff Location',
        travel_date: searchParams.date || additionalSearchParams.travel_date || storedParams.date || new Date().toISOString().split('T')[0],
        travel_time: travelTime,
        seats_required: searchParams.seats || additionalSearchParams.seats_required || storedParams.seats || 1,
        preferences: preferenceIds.length > 0 ? preferenceIds : undefined
      };

      console.log("Sending ride request data:", JSON.stringify(requestData, null, 2));

      const response = await axios.post(
        `${BASE_URL}/api/rides/request`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log("API Response:", response.data);

      if (response.status === 201) {
        const apiMessage = response.data?.message || "Ride request created successfully!";
        
        toast({
          title: "Success!",
          description: apiMessage,
        });
        
        localStorage.removeItem('searchResults');
        localStorage.removeItem('searchParams');
        localStorage.removeItem('searchCoordinates');
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const errorMessage = response.data?.message || "Failed to create ride request";
        toast({
          title: "Request failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error creating ride request:", err);
      
      if (err.response) {
        const errorMessage = err.response.data?.message || "An error occurred";
        
        if (err.response.status === 400) {
          toast({
            title: "Invalid request",
            description: err.response.data?.detail || errorMessage,
            variant: "destructive",
          });
        } else if (err.response.status === 401) {
          toast({
            title: "Authentication failed",
            description: errorMessage,
            variant: "destructive",
          });
          navigate("/login");
        } else if (err.response.status === 422) {
          let validationError = "Validation error";
          if (err.response.data.errors) {
            const errors = Object.entries(err.response.data.errors)
              .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
              .join('; ');
            validationError = errors;
          }
          toast({
            title: "Validation error",
            description: validationError,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Server error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else if (err.request) {
        toast({
          title: "Network error",
          description: "Please check your internet connection",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create ride request. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreatingRequest(false);
      requestInProgress.current = false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return dateString;
    }
  };

  const getRouteTitle = () => {
    if (searchParams.from && searchParams.to) {
      return `${searchParams.from} → ${searchParams.to}`;
    }
    
    if (rides.length > 0) {
      const firstRide = rides[0];
      return `${firstRide.searched_segment.from_stop} → ${firstRide.searched_segment.to_stop}`;
    }
    
    return "Search Results";
  };

  const renderSearchPreferences = () => {
    if (searchPreferences.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1.5 mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <span className="text-xs text-gray-500">Search Preferences:</span>
        {searchPreferences.map((pref, index) => (
          <span 
            key={index} 
            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
          >
            {pref}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-gray-900 transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-gray-900 font-medium text-base">Loading...</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#21409A]"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-gray-900 transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-gray-900 font-medium text-base">Error</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-700 mb-2">{error}</h2>
            {renderSearchPreferences()}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/")}
                className="bg-[#21409A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a347d] transition-colors flex-1"
              >
                Search Again
              </button>
              <button
                onClick={handleCreateRideRequestWithIdCheck}
                disabled={isCreatingRequest || requestInProgress.current || isCheckingIdProof}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 ${
                  isCreatingRequest || requestInProgress.current || isCheckingIdProof
                    ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                    : 'bg-[#21409A] text-white hover:bg-[#1a347d]'
                }`}
              >
                {isCheckingIdProof ? 'Checking...' : (isCreatingRequest ? 'Creating...' : 'Create Ride Request')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="text-gray-700 hover:text-gray-900 transition-colors p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 font-medium text-sm sm:text-base truncate">
              {getRouteTitle()}
            </h1>
            {searchParams.date && (
              <p className="text-gray-500 text-xs truncate">
                {formatDate(searchParams.date)}
              </p>
            )}
          </div>
        </div>
      </header>

      {renderSearchPreferences()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-gray-700">Filter by Time</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeOfDayFilter('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                timeOfDayFilter === 'day' 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiSun size={16} className={timeOfDayFilter === 'day' ? 'text-yellow-600' : 'text-gray-400'} />
              <span>Day</span>
            </button>
            <button
              onClick={() => setTimeOfDayFilter('night')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                timeOfDayFilter === 'night' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiMoon size={16} className={timeOfDayFilter === 'night' ? 'text-blue-600' : 'text-gray-400'} />
              <span>Night</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {filteredRides.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No {timeOfDayFilter} rides found
            </h2>
            {renderSearchPreferences()}
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              Try switching to {timeOfDayFilter === 'day' ? 'night' : 'day'} rides or create a ride request to be notified when matching rides become available
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setTimeOfDayFilter(timeOfDayFilter === 'day' ? 'night' : 'day')}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Show {timeOfDayFilter === 'day' ? 'Night' : 'Day'} Rides
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Search Again
              </button>
              <button
                onClick={handleCreateRideRequestWithIdCheck}
                disabled={isCreatingRequest || requestInProgress.current || isCheckingIdProof}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCreatingRequest || requestInProgress.current || isCheckingIdProof
                    ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                    : 'bg-[#21409A] text-white hover:bg-[#1a347d]'
                }`}
              >
                {isCheckingIdProof ? 'Checking...' : (isCreatingRequest ? 'Creating Request...' : 'Create Ride Request')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-4">
              {filteredRides.map((ride) => (
                <RideCard
                  key={ride.ride_id}
                  ride_id={ride.ride_id}
                  from={ride.searched_segment.from_stop}
                  to={ride.searched_segment.to_stop}
                  departure_time={formatTime(ride.searched_segment.departure_time)}
                  arrival_time={formatTime(ride.searched_segment.arrival_time)}
                  duration={ride.searched_segment.duration}
                  available_seats={ride.available_seats}
                  driverName={ride.driver.name}
                  driverRating={ride.driver.average_rating}
                  driverImage={ride.driver.profile_image_url}
                  isVerified={parseFloat(ride.driver.average_rating) >= 4.0}
                  vehicleNumber={ride.vehicle.number_plate}
                  remarks={ride.preferences.join(', ') || 'No special remarks'}
                  price={parseFloat(ride.searched_segment.price)}
                  is_negotiable={ride.is_negotiable}
                  time_of_day={ride.time_of_day}
                  onRequest={() => handleRequest(ride)}
                />
              ))}
            </div>

            <div className="lg:hidden mt-4">
              <button
                onClick={handleCreateRideRequestWithIdCheck}
                disabled={isCreatingRequest || requestInProgress.current || isCheckingIdProof}
                className={`w-full px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isCreatingRequest || requestInProgress.current || isCheckingIdProof
                    ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                    : 'bg-[#21409A] text-white hover:bg-[#1a347d] shadow-md'
                }`}
              >
                {isCheckingIdProof ? 'Checking...' : (isCreatingRequest ? 'Creating Ride Request...' : 'Create Ride Request')}
              </button>
            </div>

            {showPanel && selectedRide && (
              <div className="hidden lg:block lg:w-[360px]">
                <div className="sticky top-4">
                  <ConfirmRequestPanel
                    rideId={selectedRide.ride_id}
                    price={parseFloat(selectedRide.searched_segment.price)}
                    isNegotiable={selectedRide.is_negotiable}
                    availableSeats={selectedRide.available_seats}
                    boardingStopId={selectedRide.searched_segment.boarding_stop_id}
                    dropStopId={selectedRide.searched_segment.drop_stop_id}
                    onClose={handleClose}
                    onSuccess={handleBookingSuccess}
                  />
                </div>
              </div>
            )}

            <div className="hidden lg:block lg:w-[360px]">
              <div className="sticky top-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">No suitable ride?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create a ride request and get notified when drivers offer matching rides.
                  </p>
                  <button
                    onClick={handleCreateRideRequestWithIdCheck}
                    disabled={isCreatingRequest || requestInProgress.current || isCheckingIdProof}
                    className={`w-full px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isCreatingRequest || requestInProgress.current || isCheckingIdProof
                        ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                        : 'bg-[#21409A] text-white hover:bg-[#1a347d] shadow-md'
                    }`}
                  >
                    {isCheckingIdProof ? 'Checking...' : (isCreatingRequest ? 'Creating Ride Request...' : 'Create Ride Request')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showPanel && selectedRide && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <ConfirmRequestPanel
              rideId={selectedRide.ride_id}
              price={parseFloat(selectedRide.searched_segment.price)}
              isNegotiable={selectedRide.is_negotiable}
              availableSeats={selectedRide.available_seats}
              boardingStopId={selectedRide.searched_segment.boarding_stop_id}
              dropStopId={selectedRide.searched_segment.drop_stop_id}
              onClose={handleClose}
              onSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}

      {showIdProofPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg 
                  className="h-6 w-6 text-yellow-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ID Proof Verification Required
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                You need to verify your ID proof before requesting a ride. Please upload and verify your Aadhaar or Driving License.
              </p>

              <div className="space-y-4">
                {userDocuments.length > 0 ? (
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Documents:</p>
                    <div className="space-y-2">
                      {userDocuments.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              {doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Driving License'}
                            </span>
                            <p className="text-xs text-gray-500">
                              {doc.documentNumber} • 
                              <span className={`ml-1 ${
                                doc.verificationStatus === 'verified' 
                                  ? 'text-green-600' 
                                  : doc.verificationStatus === 'pending'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}>
                                {doc.verificationStatus.charAt(0).toUpperCase() + doc.verificationStatus.slice(1)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No ID documents uploaded yet.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setShowIdProofPopup(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyIdProof}
                    className="flex-1 px-4 py-2.5 bg-[#21409A] text-white rounded-lg text-sm font-medium hover:bg-[#1a347d] transition-colors"
                  >
                    Verify ID Proof
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindRide;