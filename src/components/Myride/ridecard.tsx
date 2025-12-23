import { Calendar, Clock, MapPin, Car, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RideOffer } from "@/services/myrideapi";

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
  onClick: () => void;
}

export function RideCard({ ride, isSelected, onClick }: RideCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md",
        isSelected 
          ? "border-primary/30 bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between">
        {/* Route Header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground truncate">
                {ride.start_address} → {ride.end_address}
              </h3>
            </div>
            <Badge variant={getStatusBadgeVariant(ride.ride_status)}>
              {getStatusDisplay(ride.ride_status)}
            </Badge>
          </div>

          {/* Trip Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{formatDate(ride.travel_datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{formatTime(ride.travel_datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{ride.total_seats} Seats</span>
            </div>
          </div>

          {/* Vehicle Info & Available Seats */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                <Car className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground truncate">
                {ride.vehicle.number_plate}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-foreground">
                Available: {ride.available_seats}/{ride.total_seats}
              </span>
            </div>
          </div>
        </div>
        
        {/* Mobile Chevron */}
        <div className="ml-2 lg:hidden">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}