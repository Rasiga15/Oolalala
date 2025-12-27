import { CheckCircle2 } from "lucide-react";
import { Star } from "lucide-react";

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
}: RideCardProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Route Information */}
          <div className="flex items-center gap-2 text-foreground font-medium text-base">
            <span>{from}</span>
            <span className="text-muted-foreground">→</span>
            <span>{to}</span>
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