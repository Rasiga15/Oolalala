import React, { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBookingsForRide, formatBookingStatus, Booking } from '../../services/bookingsviewapi';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  onClick?: (bookingId: number) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick }) => {
  const { user } = useAuth();
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-600 border-green-300';
      case 'Negotiating':
      case 'negotiation_pending':
      case 'payment_pending':
        return 'bg-orange-100 text-orange-600 border-orange-300';
      case 'auto_declined':
      case 'cancelled':
        return 'bg-red-100 text-red-600 border-red-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  // Determine which user details to show based on user role
  const displayUser = booking.your_current_role === 'partner' 
    ? booking.rider_details 
    : booking.driver_details;

  // Fixed: Use import.meta.env for Vite or window.location.origin
  const getImageUrl = (profileImagePath: string) => {
    if (!profileImagePath) return null;
    
    // If it's already a full URL, return as is
    if (profileImagePath.startsWith('http')) {
      return profileImagePath;
    }
    
    // For relative paths, construct the full URL
    // Using window.location.origin as fallback
    const baseUrl = 'https://api-dev.oolalala.com'; 
    return `${baseUrl}${profileImagePath}`;
  };

  const imageUrl = displayUser.profile_image_url 
    ? getImageUrl(displayUser.profile_image_url)
    : null;

  const handleCardClick = () => {
    if (onClick) {
      onClick(booking.booking_id);
    }
  };

  return (
    <div 
      className="bg-card rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow w-full cursor-pointer hover:border-primary/50"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl}
                alt={displayUser.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-muted-foreground text-lg">👤</span>';
                  }
                }}
              />
            ) : (
              <span className="text-muted-foreground text-lg">👤</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-primary bg-card" />
              <span className="text-sm font-medium text-foreground">
                {booking.route.from.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-muted-foreground bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {booking.route.to.name}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(booking.booking_status)}`}>
          {formatBookingStatus(booking.booking_status)}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">{displayUser.name}</p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <FiStar className="text-yellow-500 fill-yellow-500" size={14} />
            <span className="text-sm">4.5</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">
            ₹{parseFloat(booking.final_fare).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {booking.seats_booked} seat{booking.seats_booked !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      {/* Additional details */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
          
            <p className="font-medium truncate text-foreground">{booking.booking_number}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-xs mb-1">Date:</span>
            <p className="font-medium text-foreground">
              {new Date(booking.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Ride ID: {booking.ride_details.ride_id}</span>
          <span>Travel: {new Date(booking.ride_details.travel_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    </div>
  );
};

const MyRideBookingView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Get rideId from location state
  const rideId = location.state?.rideId;
  const rideData = location.state?.rideData;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0
  });

  useEffect(() => {
    if (!rideId || !isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [rideId, activeTab]);

  const fetchBookings = async () => {
    if (!rideId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch both pending and confirmed to show stats
      const [pendingResponse, confirmedResponse] = await Promise.all([
        getBookingsForRide(rideId, 'pending', 1, 50),
        getBookingsForRide(rideId, 'confirmed', 1, 50)
      ]);
      
      setStats({
        total: pendingResponse.totalItems + confirmedResponse.totalItems,
        pending: pendingResponse.totalItems,
        confirmed: confirmedResponse.totalItems
      });
      
      // Set bookings based on active tab
      const response = activeTab === 'pending' ? pendingResponse : confirmedResponse;
      setBookings(response.bookings);
      
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'pending' | 'confirmed') => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBookingCardClick = (bookingId: number) => {
    // Navigate to rider request details page with bookingId
    navigate('/riderequestdetails', {
      state: {
        bookingId: bookingId,
        rideId: rideId,
        rideData: rideData,
        fromMyRideBookings: true
      }
    });
  };

  if (!rideId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No ride selected. Please go back and select a ride.</p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Stats and Tabs */}
      <div className="pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-4 relative">
          {/* ✅ Back Button – Left Corner */}
          <button
            onClick={handleBackClick}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          {/* Tabs */}
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-1 flex gap-1">
              <button
                onClick={() => handleTabChange('pending')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'pending'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => handleTabChange('confirmed')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'confirmed'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Confirmed ({stats.confirmed})
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
     
     
      {/* Content - 2 cards per row on all screens */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium mb-2">Error Loading Bookings</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={fetchBookings}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <div key={booking.booking_id} className="w-full">
                  <BookingCard 
                    booking={booking} 
                    onClick={handleBookingCardClick}
                  />
                </div>
              ))}
            </div>
            
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-muted/30 rounded-lg p-8 max-w-md mx-auto">
                  <p className="text-muted-foreground">
                    No {activeTab} bookings found for this ride
                  </p>
                  <button
                    onClick={fetchBookings}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyRideBookingView;