import { X, Calendar, Clock, Car, MapPin, CheckCircle, AlertCircle, Navigation, Users } from "lucide-react";
import { RideDetails as RideDetailsType } from "@/services/myrideapi";

// Format date and time
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return { formattedDate, formattedTime };
};

// Format time for stop arrival/departure
const formatStopTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Get status icon and color
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'published':
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'Published'
      };
    case 'draft':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        text: 'Draft'
      };
    case 'completed':
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        text: 'Completed'
      };
    case 'cancelled':
      return {
        icon: <X className="h-4 w-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Cancelled'
      };
    default:
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        text: status
      };
  }
};

// Component for displaying fare between stops
const FareDisplay = ({ fares, fromStopId, toStopId }: { fares: any[], fromStopId: number, toStopId: number }) => {
  const fare = fares.find(f => 
    (f.from_stop_id === fromStopId && f.to_stop_id === toStopId) ||
    (f.from_stop_id === fromStopId && !f.to_stop_id && !toStopId)
  );
  
  if (!fare) return null;
  
  return (
    <div className="mt-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Fare: ₹{fare.fare}</span>
      {fare.total_distance_km && fare.total_distance_km !== "0.00" && (
        <span className="ml-2">• Distance: {fare.total_distance_km} km</span>
      )}
    </div>
  );
};

interface RideDetailsProps {
  ride: RideDetailsType | null;
  onClose: () => void;
}

export function RideDetails({ ride, onClose }: RideDetailsProps) {
  if (!ride) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">No ride details available</p>
      </div>
    );
  }

  const { formattedDate, formattedTime } = formatDateTime(ride.travel_datetime);
  const statusInfo = getStatusInfo(ride.ride_status);

  // Sort stops by stop_order
  const sortedStops = [...(ride.stops || [])].sort((a, b) => a.stop_order - b.stop_order);

  // Calculate total distance if available
  const totalDistance = ride.total_distance || 
    (sortedStops.length > 1 && sortedStops[sortedStops.length - 1].total_duration !== "0" ? 
      sortedStops[sortedStops.length - 1].total_duration : null);

  return (
    <div className="animate-slide-in-right flex h-full flex-col bg-card relative">
      {/* Header with Close Button */}
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card p-5">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {ride.start_address} → {ride.end_address}
            </h2>
            <button
              onClick={onClose}
              className="ml-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors lg:hidden"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Status Badge */}
          <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${statusInfo.bgColor}`}>
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          
          {/* Date and Time */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formattedTime}</span>
            </div>
            {totalDistance && (
              <div className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4" />
                <span>{totalDistance} km</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden lg:flex ml-4 h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Ride Information */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-primary mb-3">
            Ride Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Seats</span>
              <span className="font-medium text-foreground">{ride.total_seats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Seats</span>
              <span className="font-medium text-foreground">{ride.available_seats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instant Confirmation</span>
              <span className="font-medium text-foreground">
                {ride.instant_confirmed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Negotiable</span>
              <span className="font-medium text-foreground">
                {ride.is_negotiable ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Full Car</span>
              <span className="font-medium text-foreground">
                {ride.is_full_car ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        <div className="border-t my-4" />

        {/* Stops Details */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-primary mb-3">
            Route Stops ({sortedStops.length})
          </h3>
          <div className="space-y-4">
            {sortedStops.map((stop, index) => (
              <div key={stop.stop_id} className="relative">
                {/* Stop indicator line */}
                {index < sortedStops.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-300"></div>
                )}
                
                <div className="flex gap-3">
                  {/* Stop number circle */}
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {stop.stop_order}
                  </div>
                  
                  {/* Stop details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {stop.stop_name || `Stop ${stop.stop_order}`}
                        </h4>
                        <div className="flex items-start gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <p className="flex-1">{stop.address}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Arrival: {formatStopTime(stop.arrival_datetime)}</span>
                          </div>
                          {stop.departure_datetime && (
                            <div className="flex items-center gap-1">
                              <span>Departure: {formatStopTime(stop.departure_datetime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show fare for this stop to next stop if available */}
                      {index < sortedStops.length - 1 && (
                        <div className="text-right">
                          <FareDisplay 
                            fares={ride.fares || []} 
                            fromStopId={stop.stop_id} 
                            toStopId={sortedStops[index + 1].stop_id} 
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Show base fare for this stop (if it's the starting point) */}
                    {stop.stop_order === 1 && ride.base_fare && (
                      <div className="mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                        Total Fare: ₹{ride.base_fare}
                      </div>
                    )}
                    
                    {/* Stop duration if available */}
                    {stop.total_duration && stop.total_duration !== "0" && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Duration: {stop.total_duration} {stop.total_duration.includes(':') ? '' : 'hours'}
                      </div>
                    )}
                    
                    {/* Coordinates */}
                    <div className="mt-1 text-xs text-muted-foreground">
                      Coordinates: {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total Distance Summary */}
          {totalDistance && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Total Distance</span>
                </div>
                <span className="font-bold text-foreground">{totalDistance} km</span>
              </div>
              {ride.total_duration && (
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Estimated Duration</span>
                  <span>{ride.total_duration}</span>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="border-t my-4" />

        {/* Vehicle Details */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-primary mb-3">
            Vehicle Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ride.vehicle.number_plate}
                </p>
                {ride.vehicle.model && (
                  <p className="text-xs text-muted-foreground">
                    Model: {ride.vehicle.model}
                  </p>
                )}
                {ride.vehicle.brand && (
                  <p className="text-xs text-muted-foreground">
                    Brand: {ride.vehicle.brand}
                  </p>
                )}
                {ride.vehicle.seating_capacity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Seats: {ride.vehicle.seating_capacity}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Fare Summary */}
        <div className="border-t my-4" />
        <section>
          <h3 className="text-sm font-semibold text-primary mb-3">
            Fare Summary
          </h3>
          <div className="space-y-3">
            {/* Base Fare */}
            {ride.base_fare && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Base Fare</span>
                <span className="font-bold text-foreground">₹{ride.base_fare}</span>
              </div>
            )}
            
            {/* Individual stop fares */}
            {ride.fares && ride.fares.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Segment Fares:</p>
                {ride.fares.map((fare, index) => (
                  <div key={fare.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {index + 1}. Segment {fare.from_stop_id} → {fare.to_stop_id}
                    </span>
                    <span className="font-medium text-foreground">₹{fare.fare}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Created Info */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Created on {new Date(ride.created_at).toLocaleDateString()} • 
          Created by {ride.ride_created_by}
        </p>
        {ride.stops && ride.stops.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Route has {ride.stops.length} stops
          </p>
        )}
      </div>
    </div>
  );
}