import { CheckCircle2, Clock, Users, Car, MapPin, Star } from "lucide-react";
import { Ride } from "@/services/finderideapi";

interface RideCardProps {
  ride: Ride;
  onRequest: () => void;
}

const RideCard = ({ ride, onRequest }: RideCardProps) => {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: string) => {
    try {
      return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      return amount;
    }
  };

  const getRatingColor = (rating: string) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.5) return "text-green-600";
    if (numRating >= 4.0) return "text-green-500";
    if (numRating >= 3.0) return "text-yellow-600";
    if (numRating > 0) return "text-yellow-500";
    return "text-gray-400";
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Route */}
          <div className="flex items-center gap-2 text-foreground font-semibold text-lg">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{ride.searched_segment.from_stop}</span>
            <span className="text-muted-foreground mx-2">→</span>
            <span>{ride.searched_segment.to_stop}</span>
          </div>
          
          {/* Time and Date */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Depart:</span>
              <span className="text-foreground">{formatTime(ride.searched_segment.departure_time)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Arrive:</span>
              <span className="text-foreground">{formatTime(ride.searched_segment.arrival_time)}</span>
            </div>
            
            <div className="text-muted-foreground">
              <span className="font-medium">Date:</span>
              <span className="ml-1 text-foreground">{formatDate(ride.searched_segment.departure_time)}</span>
            </div>
          </div>
          
          {/* Duration and Seats */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-foreground font-medium">{ride.searched_segment.duration}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-foreground">
                <span className="font-medium">{ride.available_seats}</span> seat{ride.available_seats !== 1 ? 's' : ''} available
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm">
              <Car className="w-4 h-4 text-purple-500" />
              <span className="text-foreground">{ride.vehicle.number_plate}</span>
            </div>
          </div>
          
          {/* Driver Info */}
          <div className="mt-4 flex items-center gap-3">
            {ride.driver.profile_image_url ? (
              <img 
                src={ride.driver.profile_image_url} 
                alt={ride.driver.name}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {ride.driver.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{ride.driver.name}</span>
                {parseFloat(ride.driver.average_rating) > 0 ? (
                  <div className={`flex items-center gap-1 ${getRatingColor(ride.driver.average_rating)}`}>
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-medium">{ride.driver.average_rating}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No rating</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Driver ID: {ride.driver.user_id}
              </div>
            </div>
          </div>
          
          {/* Ride Status and Negotiable Badge */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              ride.ride_status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {ride.ride_status.charAt(0).toUpperCase() + ride.ride_status.slice(1)}
            </div>
            
            {ride.is_negotiable && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Price Negotiable
              </div>
            )}
            
            {ride.delay_info && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Possible Delay
              </div>
            )}
          </div>
          
          {/* Delay Info */}
          {ride.delay_info && (
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm text-orange-700 dark:text-orange-300">
              ⚠️ {ride.delay_info}
            </div>
          )}
        </div>
        
        {/* Price and Action */}
        <div className="flex flex-col items-end gap-4 ml-4">
          <div className="text-right">
            <div className="text-foreground font-bold text-2xl">
              ₹ {formatCurrency(ride.searched_segment.price)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">per seat</p>
          </div>
          
          {/* Show Request button only if negotiable */}
          {ride.is_negotiable ? (
            <button
              onClick={onRequest}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
            >
              Request Ride
            </button>
          ) : (
            <div className="text-xs text-muted-foreground px-4 py-2 border border-border rounded-full">
              Fixed Price
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideCard;