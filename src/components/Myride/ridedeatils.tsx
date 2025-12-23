import { X, Calendar, Clock, Users, Car, MapPin, CheckCircle, AlertCircle } from "lucide-react";
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

        {/* Location Details */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-primary mb-3">
            Location Details
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Start Location</h4>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">{ride.start_address}</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {ride.start_lat.toFixed(6)}, Lng: {ride.start_lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">End Location</h4>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">{ride.end_address}</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {ride.end_lat.toFixed(6)}, Lng: {ride.end_lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
              </div>
            </div>
          </div>
        </section>

        {/* Fare */}
        {ride.base_fare && (
          <>
            <div className="border-t my-4" />
            <section>
              <h3 className="text-sm font-semibold text-primary mb-3">
                Fare Details
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Base Fare</span>
                  <span className="font-bold text-foreground">₹{ride.base_fare}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Created Info */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Created on {new Date(ride.created_at).toLocaleDateString()} • 
          Created by {ride.ride_created_by}
        </p>
      </div>
    </div>
  );
}