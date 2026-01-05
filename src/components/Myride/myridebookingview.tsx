import React, { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBookingsForRide, formatBookingStatus, Booking } from '../../services/bookingsviewapi';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronLeft, PlayCircle, Check, Copy } from 'lucide-react';
import VerifyTripOtp from '../Starttrip/VerifyTripOtp';

interface BookingCardProps {
  booking: Booking;
  onClick?: (bookingId: number) => void;
  onVerifyPickup?: (bookingId: number) => void;
  onVerifyDrop?: (bookingId: number) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  onClick, 
  onVerifyPickup,
  onVerifyDrop 
}) => {
  const { user } = useAuth();
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'completed':
        return 'bg-green-100 text-green-600 border-green-300';
      case 'Confirmed':
      case 'confirmed':
        return 'bg-blue-100 text-blue-600 border-blue-300';
      case 'Ongoing':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-600 border-yellow-300';
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

  const handleVerifyPickup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerifyPickup) {
      onVerifyPickup(booking.booking_id);
    }
  };

  const handleVerifyDrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerifyDrop) {
      onVerifyDrop(booking.booking_id);
    }
  };

  // Check if we should show the Verify Pickup OTP button
  const shouldShowVerifyPickupButton = () => {
    // Only show for driver role
    if (booking.your_current_role !== 'driver') return false;
    
    // Show when booking_status is 'confirmed' and ride_details.status is 'ongoing'
    return booking.booking_status === 'confirmed' && 
           booking.ride_details.status === 'ongoing';
  };

  // Check if we should show the Complete Ride button
  const shouldShowCompleteRideButton = () => {
    // Only show for driver role
    if (booking.your_current_role !== 'driver') return false;
    
    // Show when booking_status is 'ongoing'
    return booking.booking_status === 'ongoing';
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
      
      {/* Action Buttons based on booking status */}
      {(shouldShowVerifyPickupButton() || shouldShowCompleteRideButton()) && (
        <div className="mt-4 pt-4 border-t border-border">
          {shouldShowVerifyPickupButton() && (
            <button
              onClick={handleVerifyPickup}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors mb-2 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify Pickup OTP
            </button>
          )}
          
          {shouldShowCompleteRideButton() && (
            <button
              onClick={handleVerifyDrop}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete Ride
            </button>
          )}
          
          {/* Show OTP information */}
          {/* {shouldShowVerifyPickupButton() && booking.pickup_otp && (
            <div className="text-xs text-gray-500 mt-2 text-center">
              Passenger Pickup OTP: <span className="font-bold">{booking.pickup_otp}</span>
            </div>
          )} */}
          
          {shouldShowCompleteRideButton() && booking.drop_otp && (
            <div className="text-xs text-gray-500 mt-2 text-center">
              Passenger Drop OTP: <span className="font-bold">{booking.drop_otp}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Additional details */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs mb-1">Booking No:</span>
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
        <div className="mt-2 text-xs text-gray-500">
          Role: <span className="font-medium">{booking.your_current_role}</span> | 
          Ride Status: <span className="font-medium">{booking.ride_details.status}</span>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const ToastNotification = ({ 
  message, 
  type = 'success',
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error';
  onClose: () => void;
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!visible) return null;
  
  const bgColor = type === 'success' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${bgColor} border rounded-lg p-4 shadow-lg max-w-sm`}>
        <div className="flex items-center gap-3">
          {type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className={`${textColor} text-sm font-medium`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ 
  show, 
  onClose, 
  dropOtp 
}: { 
  show: boolean; 
  onClose: () => void; 
  dropOtp: string;
}) => {
  const [copied, setCopied] = useState(false);
  
  if (!show) return null;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dropOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy OTP:', err);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Success Message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Pickup Verified Successfully!
          </h3>
          
          <p className="text-gray-600 mb-6">
            Drop OTP for passenger: 
          </p>
          
          {/* OTP Display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Share this OTP with passenger at drop location</p>
            <p className="text-3xl font-bold text-blue-700 tracking-wider font-mono">
              {dropOtp}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy OTP
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
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
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('confirmed');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0
  });

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [otpType, setOtpType] = useState<'pickup' | 'drop'>('pickup');

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dropOtp, setDropOtp] = useState('');

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

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

  const handleStartTrip = () => {
    // Navigate to Your Trips page with the rideData
    navigate('/your-trips', {
      state: {
        bookingData: bookings.length > 0 ? bookings[0] : null,
        rideId: rideId,
        rideData: rideData,
        tripInfo: rideData || {
          route: {
            from: { name: 'Location A', time: new Date().toISOString() },
            to: { name: 'Location B', time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }
          }
        }
      }
    });
  };

  const handleBookingCardClick = (bookingId: number) => {
    navigate('/riderequestdetails', {
      state: {
        bookingId: bookingId,
        rideId: rideId,
        rideData: rideData,
        fromMyRideBookings: true
      }
    });
  };

  const handleVerifyPickup = (bookingId: number) => {
    setCurrentBookingId(bookingId);
    setOtpType('pickup');
    setShowOtpModal(true);
  };

  const handleVerifyDrop = (bookingId: number) => {
    setCurrentBookingId(bookingId);
    setOtpType('drop');
    setShowOtpModal(true);
  };

  const handleOtpSuccess = (data: any) => {
    console.log('OTP verification successful:', data);
    
    // Refresh bookings after successful verification
    fetchBookings();
    
    if (otpType === 'pickup' && data.dropOtp) {
      // Show success modal with drop OTP
      setDropOtp(data.dropOtp);
      setShowSuccessModal(true);
    } else if (otpType === 'drop') {
      // Show toast notification for drop OTP
      setToastMessage('Ride completed successfully!');
      setToastType('success');
      setShowToast(true);
    }
    
    // Close OTP modal
    setShowOtpModal(false);
    setCurrentBookingId(null);
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
    setCurrentBookingId(null);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setDropOtp('');
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
      {/* OTP Verification Modal */}
      {showOtpModal && currentBookingId && (
        <VerifyTripOtp
          bookingId={currentBookingId}
          otpType={otpType}
          onSuccess={handleOtpSuccess}
          onClose={handleOtpModalClose}
        />
      )}
      
      {/* Success Modal for pickup OTP */}
      <SuccessModal 
        show={showSuccessModal} 
        onClose={handleSuccessModalClose} 
        dropOtp={dropOtp}
      />
      
      {/* Toast Notification for drop OTP */}
      {showToast && (
        <ToastNotification 
          message={toastMessage} 
          type={toastType}
          onClose={handleToastClose}
        />
      )}

      {/* Header with Back Button and Start Trip Button */}
      <div className="pt-6 pb-4 border-b-0 border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {/* Start Trip Button - ALWAYS SHOW on confirmed tab */}
            {activeTab === 'confirmed' && (
              <button
                onClick={handleStartTrip}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <PlayCircle className="h-5 w-5" />
                Start Trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="pt-6 pb-4">
        <div className="max-w-7xl mx-auto px-4">
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
      
      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Stats Summary - Only show on confirmed tab */}
        {activeTab === 'confirmed' && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {stats.confirmed > 0 ? 'Ready to Start' : 'No confirmed bookings'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.confirmed} booking{stats.confirmed !== 1 ? 's' : ''} confirmed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.confirmed > 0 
                    ? 'All riders have confirmed their bookings' 
                    : 'You can still start the trip without confirmed bookings'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Fare</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{bookings.reduce((sum, booking) => sum + parseFloat(booking.final_fare), 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Show message when there are bookings with ongoing ride status */}
            {bookings.some(b => b.booking_status === 'confirmed' && b.ride_details.status === 'ongoing') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium mb-1">Trip Started</p>
                    <p className="text-sm text-blue-700">
                      Click "Verify Pickup OTP" on each booking card to verify passenger pickup.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show message when there are ongoing bookings */}
            {bookings.some(b => b.booking_status === 'ongoing') && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-medium mb-1">Ride in Progress</p>
                    <p className="text-sm text-yellow-700">
                      Click "Complete Ride" to verify drop OTP and finish the trip.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Start Trip Info Banner - Show when no bookings */}
            {stats.confirmed === 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      You can start the trip even without confirmed bookings. The countdown timer will show until departure time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking) => (
                  <div key={booking.booking_id} className="w-full">
                    <BookingCard 
                      booking={booking} 
                      onClick={handleBookingCardClick}
                      onVerifyPickup={handleVerifyPickup}
                      onVerifyDrop={handleVerifyDrop}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Empty state for no bookings
              <div className="text-center py-12">
                <div className="bg-muted/30 rounded-lg p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    No {activeTab} bookings found for this ride
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeTab === 'confirmed' 
                      ? 'You can still start the trip. Click "Start Trip" button above.' 
                      : 'Wait for riders to confirm their bookings.'}
                  </p>
                  <button
                    onClick={fetchBookings}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
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