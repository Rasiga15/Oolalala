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
  time_of_day,
}: RideCardProps) => {
  
  const getProfileImageUrl = () => {
    if (!driverImage) return '';
    
    if (driverImage.startsWith('http://') || driverImage.startsWith('https://')) {
      return driverImage;
    }
    
    if (driverImage.startsWith('/uploads/')) {
      return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${driverImage}`;
    }
    
    return driverImage;
  };

  const getDisplayTimeOfDay = (): 'day' | 'night' => {
    if (time_of_day) {
      return time_of_day.toLowerCase() === 'night' ? 'night' : 'day';
    }
    
    return 'day';
  };

  const displayTimeOfDay = getDisplayTimeOfDay();
  const profileImageUrl = getProfileImageUrl();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex-1">
          {/* Route Information */}
          <div className="flex flex-wrap items-center gap-2 text-gray-900 font-semibold text-lg mb-3">
            <span className="truncate max-w-[120px] sm:max-w-[200px]">{from}</span>
            <span className="text-gray-400 shrink-0">→</span>
            <span className="truncate max-w-[120px] sm:max-w-[200px]">{to}</span>
          </div>
          
          {/* Time of Day Badge */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
              displayTimeOfDay === 'day' 
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-800 border border-yellow-200 shadow-sm' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200 shadow-sm'
            }`}>
              {displayTimeOfDay === 'day' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Day Ride</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-600" />
                  <span>Night Ride</span>
                </>
              )}
            </div>
          </div>
          
          {/* Time and Duration */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-sm">{departure_time}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-700 text-sm">{arrival_time}</span>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              Duration: <span className="font-semibold text-gray-900">{duration}</span>
            </div>
          </div>
          
          {/* Available Seats & Price Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
              <span className="text-gray-600 text-sm">Available Seats: </span>
              <span className="font-bold text-gray-900 text-sm">{available_seats}</span>
            </div>
            
            {is_negotiable && (
              <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <span className="text-xs font-medium text-blue-700">Price Negotiable</span>
              </div>
            )}
          </div>
          
          {/* Driver Information */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="relative">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt={driverName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-10 h-10 rounded-full bg-[#21409A] flex items-center justify-center';
                      fallback.innerHTML = `<span class="text-white font-bold text-sm">${driverName.charAt(0)}</span>`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#21409A] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{driverName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-semibold text-sm truncate">{driverName}</span>
                {isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500 stroke-white shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-900">
                    {parseFloat(driverRating).toFixed(1)}
                  </span>
                </div>
                <div className="hidden sm:block text-gray-400 text-xs">•</div>
                <div className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700 truncate max-w-[120px]">
                  {vehicleNumber}
                </div>
              </div>
            </div>
          </div>
          
          {/* Remarks - Shows preferences */}
          {remarks && remarks !== 'No special remarks' && remarks.trim() !== '' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Preferences:</p>
              <p className="text-sm text-gray-800 font-medium">{remarks}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-stretch lg:items-end gap-4 min-w-[140px]">
          {/* Price */}
          <div className="text-right">
            <div className="text-gray-900 font-bold text-2xl lg:text-3xl">
              ₹ {price.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">per seat</p>
          </div>
          
          {/* Request Button */}
          <button
            onClick={onRequest}
            disabled={available_seats === 0}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full lg:w-auto ${
              available_seats === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#21409A] hover:bg-[#1a347d] text-white shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            {available_seats === 0 ? 'No Seats Available' : 'Request Ride'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideCard;