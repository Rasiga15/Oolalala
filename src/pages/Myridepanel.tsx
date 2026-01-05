// MyRidesPanel.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RideCard } from "@/components/Myride/ridecard";
import { RideDetails } from "@/components/Myride/ridedeatils";
import {
  getMyRideOffers,
  getRideOfferDetails,
  RideDetails as RideDetailsType,
  RideOffer,
  isAuthenticated,
} from "@/services/myrideapi";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Car } from "lucide-react";

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
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Please login to view your rides");
      navigate("/auth/login");
      return;
    }
    fetchRides();
  }, [filter, currentPage]);

  useEffect(() => {
    if (rides.length > 0 && !selectedRideId && !isMobile) {
      const firstRideId = rides[0].ride_id;
      setSelectedRideId(firstRideId);
      fetchRideDetails(firstRideId);
    }
  }, [rides, isMobile]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await getMyRideOffers(
        currentPage,
        10,
        filter === "all" ? undefined : filter
      );
      setRides(res.rideOffers);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch rides");
      if (err.message?.includes("token")) navigate("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchRideDetails = async (rideId: number) => {
    try {
      setDetailsLoading(true);
      setSelectedRideId(rideId);
      const details = await getRideOfferDetails(rideId);
      setSelectedRide(details);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch ride details");
      setSelectedRideId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRideSelect = (rideId: number) => {
    setSelectedRideId(rideId);
    fetchRideDetails(rideId);
  };

  const handleBookingView = (rideId: number) => {
    navigate("/my-rides-booking-view", { state: { rideId } });
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
    setSelectedRide(null);
    setSelectedRideId(null);
  };

  const handleCloseDetails = () => {
    setSelectedRide(null);
    setSelectedRideId(null);
  };

  // Handle ride cancellation
  const handleRideCancelled = (rideId: number) => {
    // Update the ride in the list
    setRides(prevRides => 
      prevRides.map(ride => 
        ride.ride_id === rideId 
          ? { ...ride, ride_status: 'cancelled' }
          : ride
      )
    );

    // If the cancelled ride was selected, update details
    if (selectedRideId === rideId) {
      setSelectedRide(prev => 
        prev ? { ...prev, ride_status: 'cancelled' } : null
      );
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 4; // Show max 4 page numbers
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 2) {
        startPage = 1;
        endPage = maxVisiblePages;
      }
      // Adjust if we're near the end
      else if (currentPage >= totalPages - 1) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Ride List */}
        <div className="flex h-full w-full flex-col lg:w-1/2">
          {/* Filter Tabs */}
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Rides
              </button>
              <button
                onClick={() => handleFilterChange("published")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === "published"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Published
              </button>
              <button
                onClick={() => handleFilterChange("completed")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === "completed"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => handleFilterChange("cancelled")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === "cancelled"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {/* Ride Cards Container with Scroll */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rides.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  No rides found
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {filter === "all" 
                    ? "You haven't created any rides yet. Start by creating your first ride offer!"
                    : `No ${filter} rides found. Try changing the filter.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <RideCard
                    key={ride.ride_id}
                    ride={ride}
                    isSelected={selectedRideId === ride.ride_id}
                    onSelect={() => handleRideSelect(ride.ride_id)}
                    onRideCancelled={handleRideCancelled}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination Component - Only show if there are pages */}
          {totalPages > 1 && (
            <div className="sticky bottom-0 bg-background border-t px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} rides
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  {generatePageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Ride Details */}
        {!isMobile && (
          <div className="hidden h-full w-1/2 border-l lg:block">
            {detailsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedRide ? (
              <RideDetails ride={selectedRide} onClose={handleCloseDetails} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Select a ride
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Choose a ride from the list to view detailed information
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}