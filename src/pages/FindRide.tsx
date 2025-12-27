import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import RideCard from "@/components/Findride/RideCard";
import ConfirmRequestPanel from "@/components/Findride/ConfirmRequestPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

  // Fetch rides from API or local storage
  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get search results from location state first
        const locationState = location.state as { searchResults?: any; searchParams?: any };
        
        if (locationState?.searchResults) {
          // Use data from location state
          handleRidesData(locationState.searchResults);
          if (locationState.searchParams) {
            setSearchParams(locationState.searchParams);
          }
        } else {
          // Try to get from localStorage as fallback
          const storedResults = localStorage.getItem('searchResults');
          const storedParams = localStorage.getItem('searchParams');
          
          if (storedResults) {
            const parsedResults = JSON.parse(storedResults);
            handleRidesData(parsedResults);
          }
          
          if (storedParams) {
            const parsedParams = JSON.parse(storedParams);
            setSearchParams(parsedParams);
          } else {
            // If no stored params, redirect to home
            toast({
              title: "No search data found",
              description: "Please search for rides from the home page",
              variant: "destructive"
            });
            navigate("/");
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides. Please try searching again.");
        toast({
          title: "Error loading rides",
          description: "Please try searching again",
          variant: "destructive"
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
      toast({
        title: "No rides found",
        description: "Try adjusting your search criteria",
      });
    }
  };

  const handleRequest = (ride: Ride) => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to request a ride",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    console.log("Selected ride ID:", ride.ride_id); // Debug log
    setSelectedRide(ride);
    setShowPanel(true);
  };

  const handleBookingSuccess = (bookingData: BookingSuccessData) => {
    toast({
      title: "Booking Request Sent!",
      description: `Booking number: ${bookingData.booking_number}. Status: ${bookingData.booking_status}`,
    });
    
    // Update available seats locally
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

  // Format date for display
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

  // Format time for display
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get route title
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

  // Loading state
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

  // Error state
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
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Search Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {rides.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">No rides found</h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or search for a different route
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Search Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Rides List */}
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

            {/* Confirm Panel - Desktop */}
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

      {/* Mobile Panel Overlay */}
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