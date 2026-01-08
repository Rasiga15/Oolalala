// components/Myride/ridecard.tsx
import { Calendar, Clock, MapPin, Car, ChevronRight, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RideOffer } from "@/services/myrideapi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { CancelConfirmationPopup } from "@/components/common/CancelOfferConfirmationPopup";
import { cancelRideOffer } from "@/services/myrideapi";
import { toast } from "sonner";

// Format date function
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time function
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

// Get status display text
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'published':
      return 'Published';
    case 'draft':
      return 'Draft';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Check if ride can be cancelled
const canCancelRide = (rideStatus: string): boolean => {
  // Allow cancellation for published and draft rides only
  return rideStatus === 'published' || rideStatus === 'draft';
};

interface RideCardProps {
  ride: RideOffer;
  isSelected: boolean;
  onSelect: () => void;
  onRideCancelled?: (rideId: number) => void;
}

export function RideCard({ ride, isSelected, onSelect, onRideCancelled }: RideCardProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    onSelect();
  };

  const handleBookingButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't navigate if ride is cancelled
    if (ride.ride_status === 'cancelled') return;
    
    navigate('/my-rides-booking-view', {
      state: {
        rideId: ride.ride_id,
        rideData: {
          start_address: ride.start_address,
          end_address: ride.end_address,
          travel_datetime: ride.travel_datetime,
          available_seats: ride.available_seats,
          total_seats: ride.total_seats,
          vehicle: ride.vehicle
        }
      }
    });
  };

  const handleMoreButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    setError(null);
    setShowCancelPopup(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setIsCancelling(true);
      setError(null);
      
      await cancelRideOffer(ride.ride_id);
      
      toast.success("Trip cancelled successfully!");
      
      // Update ride status locally
      ride.ride_status = 'cancelled';
      
      // Notify parent component
      if (onRideCancelled) {
        onRideCancelled(ride.ride_id);
      }
      
      setShowCancelPopup(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to cancel trip";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelPopupClose = () => {
    if (!isCancelling) {
      setShowCancelPopup(false);
      setError(null);
    }
  };

  const canCancel = canCancelRide(ride.ride_status);
  const isCancelled = ride.ride_status === 'cancelled';

  return (
    <>
      <div
        className={cn(
          "group rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md cursor-pointer relative",
          isSelected 
            ? "border-primary border-2 bg-primary/10 shadow-sm ring-2 ring-primary/20"
            : "border-border hover:border-primary/30",
          isCancelled && "opacity-75"
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          {/* Left side - Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                {/* FIXED: Using start_location_name and end_location_name instead of full addresses */}
                <h3 className={cn(
                  "text-base font-semibold truncate",
                  isSelected ? "text-primary font-bold" : "text-foreground",
                  isCancelled && "line-through"
                )}>
                  {ride.start_location_name} → {ride.end_location_name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getStatusBadgeVariant(ride.ride_status)}
                  className={cn(
                    isSelected ? "ring-1 ring-primary/30" : "",
                    isCancelled && "bg-red-100 text-red-800 hover:bg-red-100"
                  )}
                >
                  {getStatusDisplay(ride.ride_status)}
                </Badge>
                
                {/* 3-dot Menu Button */}
                {canCancel && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={handleMoreButtonClick}
                      className={cn(
                        "p-1.5 rounded-full transition-colors hover:bg-gray-100",
                        dropdownOpen && "bg-gray-100"
                      )}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={handleCancelClick}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Trip
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-2 text-sm mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground",
                  isCancelled && "text-gray-400"
                )} />
                <span className={cn(
                  isSelected ? "text-foreground font-medium" : "text-muted-foreground",
                  isCancelled && "text-gray-500"
                )}>
                  {formatDate(ride.travel_datetime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground",
                  isCancelled && "text-gray-400"
                )} />
                <span className={cn(
                  isSelected ? "text-foreground font-medium" : "text-muted-foreground",
                  isCancelled && "text-gray-500"
                )}>
                  {formatTime(ride.travel_datetime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground",
                  isCancelled && "text-gray-400"
                )} />
                <span className={cn(
                  isSelected ? "text-foreground font-medium" : "text-muted-foreground",
                  isCancelled && "text-gray-500"
                )}>
                  {ride.total_seats} Seats
                </span>
              </div>
            </div>

            {/* Vehicle Info & Available Seats */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  isSelected ? "bg-primary/20" : "bg-muted",
                  isCancelled && "bg-gray-100"
                )}>
                  <Car className={cn(
                    "h-4 w-4",
                    isSelected ? "text-primary" : "text-muted-foreground",
                    isCancelled && "text-gray-400"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium truncate",
                  isSelected ? "text-primary font-semibold" : "text-foreground",
                  isCancelled && "text-gray-500"
                )}>
                  {ride.vehicle.number_plate}
                </span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary font-semibold" : "text-foreground",
                  isCancelled && "text-gray-500"
                )}>
                  Available: {ride.available_seats}/{ride.total_seats}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking View Button - Hidden when cancelled */}
        {!isCancelled && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={handleBookingButtonClick}
              className={cn(
                "py-1 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap",
                isSelected 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Booking View
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Popup */}
      <CancelConfirmationPopup
        isOpen={showCancelPopup}
        onClose={handleCancelPopupClose}
        onConfirm={handleCancelConfirm}
        rideId={ride.ride_id}
        startAddress={ride.start_address}
        endAddress={ride.end_address}
        travelDate={ride.travel_datetime}
        isLoading={isCancelling}
        error={error}
      />
    </>
  );
}