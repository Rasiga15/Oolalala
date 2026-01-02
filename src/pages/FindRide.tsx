import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import RideCard from "@/components/Findride/RideCard";
import ConfirmRequestPanel from "@/components/Findride/ConfirmRequestPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { BASE_URL } from "@/config/api";

interface Ride {
  ride_id: number;
  ride_status: string;
  delay_info: any;
  available_seats: number;
  is_negotiable: boolean;
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

const FindRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    from: '',
    to: '',
    date: ''
  });
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  
  // Store original search parameters for creating ride request
  const [searchCoordinates, setSearchCoordinates] = useState({
    from_lat: 0,
    from_lng: 0,
    to_lat: 0,
    to_lng: 0,
    from_location_name: '',
    to_location_name: ''
  });

  // Fetch rides from API or local storage
  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get search results from location state first
        const locationState = location.state as { 
          searchResults?: any; 
          searchParams?: any;
          searchCoordinates?: any;
        };
        
        if (locationState?.searchResults) {
          // Use data from location state
          handleRidesData(locationState.searchResults);
          
          if (locationState.searchParams) {
            setSearchParams({
              from: locationState.searchParams.from_short_location || '',
              to: locationState.searchParams.to_short_location || '',
              date: locationState.searchParams.date || '',
              timeOfDay: locationState.searchParams.time_of_day || 'day',
              seats: locationState.searchParams.no_of_seat ? parseInt(locationState.searchParams.no_of_seat) : 1,
              preferences: []
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
        } else {
          // Try to get from localStorage as fallback
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
              from: parsedParams.from_short_location || '',
              to: parsedParams.to_short_location || '',
              date: parsedParams.date || '',
              timeOfDay: parsedParams.time_of_day || 'day',
              seats: parsedParams.no_of_seat ? parseInt(parsedParams.no_of_seat) : 1,
              preferences: []
            });
          } else {
            // If no stored params, redirect to home
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
            const storedParams = JSON.parse(localStorage.getItem('searchParams') || '{}');
            setSearchCoordinates({
              from_lat: parsedCoords.from_lat || 0,
              from_lng: parsedCoords.from_lng || 0,
              to_lat: parsedCoords.to_lat || 0,
              to_lng: parsedCoords.to_lng || 0,
              from_location_name: storedParams.from_short_location || '',
              to_location_name: storedParams.to_short_location || ''
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
    } else if (Array.isArray(data)) {
      setRides(data);
    } else {
      setRides([]);
    }
  };

  const handleRequest = (ride: Ride) => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to request a ride",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setSelectedRide(ride);
    setShowPanel(true);
  };

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

  const handleCreateRideRequest = async () => {
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

    // Get current search params from localStorage as backup
    const storedParams = JSON.parse(localStorage.getItem('searchParams') || '{}');

    if (!searchParams.from || !searchParams.to || !searchParams.date) {
      toast({
        title: "Missing information",
        description: "Please search for rides first with complete details",
        variant: "destructive",
      });
      return;
    }

    const { from_lat, from_lng, to_lat, to_lng } = searchCoordinates;
    
    // Check if coordinates are valid
    if (from_lat === 0 || from_lng === 0 || to_lat === 0 || to_lng === 0) {
      // Try to get coordinates from localStorage
      const storedCoords = JSON.parse(localStorage.getItem('searchCoordinates') || '{}');
      if (storedCoords.from_lat && storedCoords.from_lng && storedCoords.to_lat && storedCoords.to_lng) {
        // Update coordinates from localStorage
        setSearchCoordinates({
          ...searchCoordinates,
          from_lat: storedCoords.from_lat,
          from_lng: storedCoords.from_lng,
          to_lat: storedCoords.to_lat,
          to_lng: storedCoords.to_lng,
          from_location_name: searchParams.from || storedParams.from_short_location || '',
          to_location_name: searchParams.to || storedParams.to_short_location || ''
        });
      } else {
        toast({
          title: "Missing location data",
          description: "Location coordinates are required. Please search again from home.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsCreatingRequest(true);

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

      // Prepare the request data according to API specification
      const requestData: CreateRideRequestData = {
        from_lat: searchCoordinates.from_lat,
        from_lng: searchCoordinates.from_lng,
        from_location_name: searchParams.from || searchCoordinates.from_location_name || '',
        to_lat: searchCoordinates.to_lat,
        to_lng: searchCoordinates.to_lng,
        to_location_name: searchParams.to || searchCoordinates.to_location_name || '',
        travel_date: searchParams.date || storedParams.date || new Date().toISOString().split('T')[0],
        travel_time: searchParams.timeOfDay === 'night' ? '20:00' : '10:00',
        seats_required: searchParams.seats || storedParams.no_of_seat || 1,
        preferences: searchParams.preferences || []
      };

      console.log("Sending ride request data:", requestData);

      // Call the API to create ride request
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
        // Show the exact message from API response in toast
        const apiMessage = response.data?.message || "Ride request created successfully.";
        
        toast({
          title: "Success!",
          description: apiMessage,
        });
        
        // Navigate to home page after showing toast
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        // Show error message from API response if available
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
        // Get error message from API response
        const errorMessage = err.response.data?.message || "An error occurred";
        
        if (err.response.status === 400) {
          toast({
            title: "Invalid request",
            description: errorMessage,
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
          toast({
            title: "Validation error",
            description: errorMessage,
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
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="text-foreground hover:text-muted-foreground transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-foreground font-medium text-base sm:text-lg">Loading...</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex justify-center items-center h-48 sm:h-56 md:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/")}
              className="text-foreground hover:text-muted-foreground transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-foreground font-medium text-base sm:text-lg">Error</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-destructive mb-2 sm:mb-3">{error}</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/")}
                className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-[2px] text-sm sm:text-base font-medium hover:bg-primary/90 transition-colors flex-1"
              >
                Search Again
              </button>
              <button
                onClick={handleCreateRideRequest}
                disabled={isCreatingRequest}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-[2px] text-sm sm:text-base font-medium transition-colors flex-1 ${
                  isCreatingRequest 
                    ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                    : 'bg-[#21409A] text-white hover:bg-[#21409A]/90'
                }`}
              >
                {isCreatingRequest ? 'Creating Request...' : 'Create Ride Request'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="text-foreground hover:text-muted-foreground transition-colors p-1"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-foreground font-medium text-sm sm:text-base lg:text-lg truncate">
              {getRouteTitle()}
            </h1>
            {searchParams.date && (
              <p className="text-muted-foreground text-xs sm:text-sm truncate">
                {formatDate(searchParams.date)}
              </p>
            )}
          </div>
          {rides.length > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {rides.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">No rides found</h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or create a ride request to be notified when matching rides become available
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/")}
                className="bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 rounded-[2px] text-sm sm:text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Search Again
              </button>
              <button
                onClick={handleCreateRideRequest}
                disabled={isCreatingRequest}
                className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-[2px] text-sm sm:text-base font-medium transition-colors ${
                  isCreatingRequest 
                    ? 'bg-[#21409A]/50 text-white cursor-not-allowed' 
                    : 'bg-[#21409A] text-white hover:bg-[#21409A]/90'
                }`}
              >
                {isCreatingRequest ? 'Creating Request...' : 'Create Ride Request'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="flex-1 space-y-3 sm:space-y-4">
              {rides.map((ride, index) => (
                <div
                  key={`${ride.ride_id}-${index}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-fade-in"
                >
                  <RideCard
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
                    onRequest={() => handleRequest(ride)}
                  />
                </div>
              ))}
            </div>

            {showPanel && selectedRide && (
              <div className="hidden lg:block lg:w-[360px] xl:w-[400px] 2xl:w-[420px]">
                <div className="sticky top-6">
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
          </div>
        )}
      </main>

      {showPanel && selectedRide && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
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
    </div>
  );
};

export default FindRide;