import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RideCard } from "@/components/Myride/ridecard";
import { RideDetails } from "@/components/Myride/ridedeatils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { getMyRideOffers, getRideOfferDetails, RideDetails as RideDetailsType, RideOffer, isAuthenticated } from "@/services/myrideapi";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";

export function MyRidesPanel() {
  const navigate = useNavigate();
  const [selectedRide, setSelectedRide] = useState<RideDetailsType | null>(null);
  const [rides, setRides] = useState<RideOffer[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Please login to view your rides");
      navigate("/login");
      return;
    }
    
    fetchRides();
  }, [filter, currentPage, navigate]);

  // Set default selected ride when rides are loaded
  useEffect(() => {
    if (rides.length > 0 && !selectedRide && !isMobile) {
      // Always select the first ride by default on desktop
      fetchRideDetails(rides[0].ride_id);
    }
  }, [rides, isMobile, selectedRide]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      
      const response = await getMyRideOffers(currentPage, 10, filter === "all" ? undefined : filter);
      
      setRides(response.rideOffers);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      
    } catch (error: any) {
      console.error("Error fetching rides:", error);
      toast.error(error.message || "Failed to fetch rides");
      
      // If token error, redirect to login
      if (error.message.includes('No authentication token') || error.message.includes('token')) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRideDetails = async (rideId: number) => {
    try {
      setDetailsLoading(true);
      
      const details = await getRideOfferDetails(rideId);
      setSelectedRide(details);
    } catch (error: any) {
      console.error("Error fetching ride details:", error);
      toast.error(error.message || "Failed to fetch ride details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRideSelect = useCallback((ride: RideOffer) => {
    // For both mobile and desktop, fetch full details
    fetchRideDetails(ride.ride_id);
  }, []);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
    // Clear selection when filter changes
    setSelectedRide(null);
  };

  const handleCloseDetails = () => {
    setSelectedRide(null);
  };

  // Filter rides based on current filter
  const filteredRides = filter === "all" 
    ? rides 
    : rides.filter(ride => ride.ride_status === filter);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="pt-16">
        <div className="flex h-[calc(100vh-64px)] animate-fade-in">
          {/* Left Panel - Ride List */}
          <div className={`flex h-full flex-col border-r border-border ${isMobile ? 'w-full' : 'w-full lg:w-1/2'}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-4 lg:p-6 gap-4 sm:gap-0">
              <div className="flex items-center gap-3">
                {/* Left Arrow Button */}
                <button 
                  onClick={() => navigate('/')} 
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
                
                <div>
                  <h1 className="text-lg font-bold text-foreground lg:text-xl">
                    Your Ride Offers
                  </h1>
                  {totalItems > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: {totalItems} rides
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rides</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ride List */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-5">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your rides...</p>
                  </div>
                </div>
              ) : filteredRides.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      No rides found
                    </p>
                    {filter !== "all" && (
                      <button
                        onClick={() => setFilter("all")}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        View all rides
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRides.map((ride) => (
                    <RideCard
                      key={ride.ride_id}
                      ride={ride}
                      isSelected={selectedRide?.ride_id === ride.ride_id}
                      onClick={() => handleRideSelect(ride)}
                    />
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-accent transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-accent transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Ride Details (Desktop Only) */}
          {!isMobile && (
            <div className="hidden h-full w-1/2 lg:block">
              {detailsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading ride details...</p>
                  </div>
                </div>
              ) : selectedRide ? (
                <RideDetails
                  ride={selectedRide}
                  onClose={handleCloseDetails}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg
                      className="h-8 w-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Ride
                  </h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Click on any ride from the list to view detailed information
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing {rides.length} of {totalItems} rides
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Details Modal */}
          {selectedRide && isMobile && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={handleCloseDetails}
              />
              <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-auto rounded-t-2xl bg-card shadow-xl animate-in slide-in-from-bottom duration-300">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm px-4 py-3">
                  <h3 className="text-lg font-semibold text-foreground">Ride Details</h3>
                  <button
                    onClick={handleCloseDetails}
                    className="rounded-full p-2 hover:bg-accent transition-colors"
                    aria-label="Close details"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <RideDetails
                  ride={selectedRide}
                  onClose={handleCloseDetails}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}