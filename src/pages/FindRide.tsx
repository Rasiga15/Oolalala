import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Loader2, MapPin, Clock, Users, Car, Calendar, Navigation } from "lucide-react";
import RideCard from "@/components/Findride/RideCard";
import ConfirmRequestPanel from "@/components/Findride/ConfirmRequestPanel";
import { useToast } from "@/hooks/use-toast";
import { searchRides, bookRide, Ride, BookingRequestPayload } from "@/services/finderideapi";
import { useAuth } from "@/contexts/AuthContext";

const FindRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInfo, setSearchInfo] = useState({
    from: "Tenkasi",
    to: "Chennai",
    date: ""
  });

  // Get search params from location state or URL
  useEffect(() => {
    console.log('📱 FindRide component mounted');
    console.log('📍 Location state:', location.state);
    console.log('🔍 Location search:', location.search);
    
    const params = new URLSearchParams(location.search);
    
    // Set default values or get from location
    const from = location.state?.from || params.get('from') || 'Tenkasi';
    const to = location.state?.to || params.get('to') || 'Chennai';
    
    // Get date - required by API
    let date = location.state?.date || params.get('date');
    if (!date) {
      // If no date provided, use tomorrow's date as default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    }
    
    console.log('🔎 Search params:', { from, to, date });
    
    setSearchInfo({ from, to, date });
    
    // Start fetching rides
    fetchRides(date);
  }, [location]);

  const fetchRides = async (date: string) => {
    try {
      setLoading(true);
      setRides([]); // Clear previous rides
      
      console.log('🚀 Fetching rides for date:', date);
      
      // Call the search API
      const result = await searchRides(date);
      console.log('📊 Search result:', result);
      
      if (result.success && result.data) {
        const ridesData = result.data.rides || [];
        console.log('🎯 Rides data received:', ridesData);
        setRides(ridesData);
        
        // Show toast notification
        if (ridesData.length > 0) {
          toast({
            title: "✅ Rides Found!",
            description: `Found ${ridesData.length} ride${ridesData.length === 1 ? '' : 's'} available`,
          });
        } else {
          toast({
            title: "ℹ️ No Rides Found",
            description: "No rides available for the selected date",
          });
        }
      } else {
        console.error('❌ Search failed:', result.message);
        toast({
          title: "❌ Search Failed",
          description: result.message || "Could not fetch rides. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      toast({
        title: "⚠️ Network Error",
        description: "Please check your internet connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = (ride: Ride) => {
    console.log('👉 Requesting ride ID:', ride.ride_id);
    
    if (!user) {
      toast({
        title: "🔐 Login Required",
        description: "Please login to book a ride",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setSelectedRide(ride);
    setShowPanel(true);
  };

  const handleConfirm = async (option: string, remarks: string) => {
    if (!selectedRide || !user) return;

    try {
      console.log('✅ Confirming booking for ride:', selectedRide.ride_id);
      
      const payload: BookingRequestPayload = {
        seats_booked: 1,
        boarding_stop_id: selectedRide.searched_segment.boarding_stop_id,
        drop_stop_id: selectedRide.searched_segment.drop_stop_id,
        negotiated_fare: parseFloat(selectedRide.searched_segment.price),
        remarks: remarks || "Requesting ride"
      };

      console.log('📦 Booking payload:', payload);
      
      // Call the bookRide API
      const result = await bookRide(selectedRide.ride_id, payload);
      
      if (result.success && result.data) {
        const bookingData = result.data.booking;
        
        toast({
          title: "✅ Request Sent Successfully!",
          description: result.data.message || "Your ride request has been sent",
        });
        
        toast({
          title: "📋 Booking Details",
          description: `Booking Number: ${bookingData.booking_number}`,
        });
        
        console.log('🎉 Booking successful:', bookingData);
        
        // Optionally navigate to bookings page or show booking confirmation
        // navigate(`/bookings/${bookingData.id}`);
        
      } else {
        toast({
          title: "❌ Booking Failed",
          description: result.message || "Failed to book ride. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Booking error:', error);
      toast({
        title: "⚠️ Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowPanel(false);
      setSelectedRide(null);
    }
  };

  const handleClose = () => {
    setShowPanel(false);
    setSelectedRide(null);
  };

  const handleRetrySearch = () => {
    console.log('🔄 Retrying search...');
    fetchRides(searchInfo.date);
  };

  const handleModifySearch = () => {
    navigate('/search', { 
      state: { 
        from: searchInfo.from, 
        to: searchInfo.to,
        date: searchInfo.date
      } 
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Debug: Log rides state changes
  useEffect(() => {
    console.log('🔄 Rides state updated:', rides);
  }, [rides]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-foreground hover:text-muted-foreground transition-colors p-1"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h1 className="text-foreground font-medium text-lg">
                  {searchInfo.from} → {searchInfo.to}
                </h1>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDisplayDate(searchInfo.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleModifySearch}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
            >
              Modify
            </button>
            <button
              onClick={handleRetrySearch}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
            </div>
            <span className="text-foreground font-medium text-lg mb-2">Searching for rides...</span>
            <p className="text-muted-foreground text-center">
              Looking for rides from <span className="font-medium text-foreground">{searchInfo.from}</span> to <span className="font-medium text-foreground">{searchInfo.to}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Please wait while we fetch available rides
            </p>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-foreground font-medium text-lg">
                    {rides.length} {rides.length === 1 ? 'Ride' : 'Rides'} Available
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Found rides for {formatDisplayDate(searchInfo.date)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing all available rides
                </div>
              </div>
            </div>

            {/* Rides List */}
            {rides.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="space-y-4">
                    {rides.map((ride, index) => (
                      <div
                        key={ride.ride_id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <RideCard
                          ride={ride}
                          onRequest={() => handleRequest(ride)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Panel - Desktop */}
                <div className="hidden lg:block w-[360px]">
                  {showPanel && selectedRide && (
                    <div className="sticky top-24">
                      <ConfirmRequestPanel
                        price={parseFloat(selectedRide.searched_segment.price)}
                        onClose={handleClose}
                        onConfirm={handleConfirm}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Car className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-medium text-xl mb-3">No rides available</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Sorry, we couldn't find any rides from <span className="font-medium text-foreground">{searchInfo.from}</span> to <span className="font-medium text-foreground">{searchInfo.to}</span> for {formatDisplayDate(searchInfo.date)}.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={handleRetrySearch}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleModifySearch}
                    className="border border-border hover:bg-accent px-8 py-3 rounded-full text-sm font-medium transition-colors"
                  >
                    Change Date
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Panel Overlay */}
      {showPanel && selectedRide && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <ConfirmRequestPanel
              price={parseFloat(selectedRide.searched_segment.price)}
              onClose={handleClose}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindRide;