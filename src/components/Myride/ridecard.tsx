import { Calendar, Clock, MapPin, Car, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RideOffer } from "@/services/myrideapi";
import { useNavigate } from "react-router-dom";

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

interface RideCardProps {
  ride: RideOffer;
  isSelected: boolean;
  onSelect: () => void;
}

export function RideCard({ ride, isSelected, onSelect }: RideCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    onSelect();
  };

  const handleBookingButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to bookings view with ride data
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

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md cursor-pointer relative",
        isSelected 
          ? "border-primary border-2 bg-primary/10 shadow-sm ring-2 ring-primary/20"
          : "border-border hover:border-primary/30"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        {/* Left side - Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className={cn(
                "text-base font-semibold truncate",
                isSelected ? "text-primary font-bold" : "text-foreground"
              )}>
                {ride.start_address} → {ride.end_address}
              </h3>
            </div>
            <Badge 
              variant={getStatusBadgeVariant(ride.ride_status)}
              className={isSelected ? "ring-1 ring-primary/30" : ""}
            >
              {getStatusDisplay(ride.ride_status)}
            </Badge>
          </div>

          {/* Trip Details */}
          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className={cn(
                "h-3.5 w-3.5 flex-shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={isSelected ? "text-foreground font-medium" : "text-muted-foreground"}>
                {formatDate(ride.travel_datetime)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className={cn(
                "h-3.5 w-3.5 flex-shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={isSelected ? "text-foreground font-medium" : "text-muted-foreground"}>
                {formatTime(ride.travel_datetime)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className={cn(
                "h-3.5 w-3.5 flex-shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={isSelected ? "text-foreground font-medium" : "text-muted-foreground"}>
                {ride.total_seats} Seats
              </span>
            </div>
          </div>

          {/* Vehicle Info & Available Seats */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                isSelected ? "bg-primary/20" : "bg-muted"
              )}>
                <Car className={cn(
                  "h-4 w-4",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-sm font-medium truncate",
                isSelected ? "text-primary font-semibold" : "text-foreground"
              )}>
                {ride.vehicle.number_plate}
              </span>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-sm font-medium",
                isSelected ? "text-primary font-semibold" : "text-foreground"
              )}>
                Available: {ride.available_seats}/{ride.total_seats}
              </span>
            </div>
          </div>
        </div>

        {/* Booking View Button */}
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
      </div>
    </div>
  );
}