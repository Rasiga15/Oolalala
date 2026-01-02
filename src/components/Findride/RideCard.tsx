import { CheckCircle2, Star, Sun, Moon } from "lucide-react";

interface RideCardProps {
  ride_id: number;
  from: string;
  to: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  available_seats: number;
  driverName: string;
  driverRating: string;
  driverImage: string;
  isVerified: boolean;
  vehicleNumber: string;
  remarks: string;
  price: number;
  is_negotiable: boolean;
  onRequest: () => void;
  // Add time_of_day prop
  time_of_day?: 'day' | 'night';
}

const RideCard = ({
  ride_id,
  from,
  to,
  departure_time,
  arrival_time,
  duration,
  available_seats,
  driverName,
  driverRating,
  driverImage,
  isVerified,
  vehicleNumber,
  remarks,
  price,
  is_negotiable,
  onRequest,
  time_of_day = 'day', // Default value
}: RideCardProps) => {
  
  // Helper function to determine if it's day or night based on departure time
  const getTimeOfDayFromTime = (timeStr: string): 'day' | 'night' => {
    if (!timeStr) return 'day';
    
    try {
      // Parse time like "14:30" or "2:30 PM"
      let hour = 12;
      
      // Check if time is in 12-hour format with AM/PM
      if (timeStr.toLowerCase().includes('pm') || timeStr.toLowerCase().includes('am')) {
        const match = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
        if (match) {
          hour = parseInt(match[1]);
          const isPM = match[3].toUpperCase() === 'PM';
          
          // Convert to 24-hour format
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
        }
      } else {
        // 24-hour format like "14:30"
        const [hours] = timeStr.split(':');
        hour = parseInt(hours);
      }
      
      // Determine day/night: 6 AM to 6 PM is day, otherwise night
      return (hour >= 6 && hour < 18) ? 'day' : 'night';
    } catch (error) {
      console.error('Error parsing time:', error);
      return 'day'; // Default to day
    }
  };

  // Determine time of day to display
  const displayTimeOfDay = time_of_day || getTimeOfDayFromTime(departure_time);

  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Route Information */}
          <div className="flex items-center gap-2 text-foreground font-medium text-base">
            <span>{from}</span>
            <span className="text-muted-foreground">→</span>
            <span>{to}</span>
            
            {/* Time of Day Indicator */}
            <div className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              displayTimeOfDay === 'day' 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {displayTimeOfDay === 'day' ? (
                <>
                  <Sun className="w-3 h-3" />
                  <span>Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3" />
                  <span>Night</span>
                </>
              )}
            </div>
          </div>
          
          {/* Time and Duration */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{departure_time}</span> • {arrival_time}
            </div>
            <div className="text-muted-foreground">
              Duration: <span className="font-medium text-foreground">{duration}</span>
            </div>
          </div>
          
          {/* Available Seats */}
          <p className="text-muted-foreground text-sm mt-2">
            Available Seats: <span className="font-medium text-foreground">{available_seats}</span>
          </p>
          
          {/* Driver Information */}
          <div className="flex items-center gap-3 mt-3">
            {driverImage ? (
              <img 
                src={driverImage} 
                alt={driverName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">{driverName.charAt(0)}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-medium text-sm">{driverName}</span>
                {isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-accent fill-accent stroke-card" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {parseFloat(driverRating).toFixed(1)} • {vehicleNumber}
                </span>
              </div>
            </div>
          </div>
          
          {/* Remarks */}
          {remarks && (
            <p className="text-muted-foreground text-sm mt-2">
              Preferences: <span className="text-foreground">{remarks}</span>
            </p>
          )}
          
          {/* Price Negotiation Info */}
          {is_negotiable && (
            <p className="text-xs text-blue-500 mt-2">
              Price is negotiable
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-4">
          {/* Price */}
          <div className="text-right">
            <span className="text-foreground font-semibold text-xl">
              ₹ {price.toLocaleString()}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">per seat</p>
          </div>
          
          {/* Request Button */}
          <button
            onClick={onRequest}
            disabled={available_seats === 0}
            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-colors ${
              available_seats === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {available_seats === 0 ? 'No Seats' : 'Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideCard;