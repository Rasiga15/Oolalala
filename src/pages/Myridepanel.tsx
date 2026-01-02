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
import { Loader2 } from "lucide-react";

export function MyRidesPanel() {
  const navigate = useNavigate();
  const [selectedRide, setSelectedRide] = useState<RideDetailsType | null>(null);
  const [rides, setRides] = useState<RideOffer[]>([]);
  const [filter, setFilter] = useState<string>("all"); // Keep filter in state but don't show in UI
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
      navigate("/login");
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
      if (err.message?.includes("token")) navigate("/login");
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
    // Navigate to booking view page
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

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Ride List */}
        <div className="flex h-full w-full flex-col lg:w-1/2">
          {/* Removed Filter Select from UI */}
          
          {/* Ride Cards List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rides.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No rides found
              </p>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <RideCard
                    key={ride.ride_id}
                    ride={ride}
                    isSelected={selectedRideId === ride.ride_id}
                    onSelect={() => handleRideSelect(ride.ride_id)}
                   
                  />
                ))}
              </div>
            )}
          </div>
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
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a ride to view details
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}