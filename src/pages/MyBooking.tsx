// components/MyBookings/MyBookings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser, FiChevronLeft, FiLoader, FiMoreVertical } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getMyBookings, 
  getBookingStats, 
  formatBookingDate, 
  formatCurrency, 
  getStatusInfo 
} from '@/services/mybookings';
import { Booking, BookingStatus } from '@/types/bookings';
import { BASE_URL } from '@/config/api';
import axios from 'axios';
import CancelConfirmationPopup from '@/components/common/CancelConfirmationPopup'; 
type TabType = 'upcoming' | 'passed';

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.token) {
      fetchBookings();
    }
  }, [activeTab, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getMyBookings(activeTab, 1, 10, user?.token);
      
      if (response.success && response.data) {
        setBookings(response.data.bookings);
      } else {
        setError(response.error || 'Failed to fetch bookings');
        setBookings([]);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (bookingId: number, e?: React.MouseEvent) => {
    // Don't navigate if clicking the dropdown
    if (e && (e.target as HTMLElement).closest('.dropdown-trigger')) {
      return;
    }
    
    navigate(`/riderequestdetails`, {
      state: { 
        bookingId, 
        tab: activeTab,
        fromMyBookings: true 
      }
    });
  };

  const handleCancelClick = (bookingId: number, bookingNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBookingId(bookingId);
    setSelectedBookingNumber(bookingNumber);
    setCancelModalOpen(true);
    setDropdownOpen(null); // Close dropdown
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId || !user?.token) return;
    
    try {
      setIsCancelling(true);
      setCancelError(null);
      
      const response = await axios.post(
        `${BASE_URL}/api/bookings/${selectedBookingId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'accept': '*/*'
          }
        }
      );

      if (response.status === 200) {
        // Update the booking status locally
        setBookings(prev => prev.map(booking => 
          booking.booking_id === selectedBookingId 
            ? { ...booking, booking_status: 'cancelled' as BookingStatus }
            : booking
        ));
        
        // Close modal
        setCancelModalOpen(false);
        setSelectedBookingId(null);
        setSelectedBookingNumber('');
      }
    } catch (err: any) {
      setCancelError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to cancel booking. Please try again.'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleDropdown = (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === bookingId ? null : bookingId);
  };

  const renderStatusBadge = (status: BookingStatus) => {
    const { className, label } = getStatusInfo(status);
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const getProfileImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/150';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cancel Confirmation Popup */}
      <CancelConfirmationPopup
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedBookingId(null);
          setSelectedBookingNumber('');
          setCancelError(null);
        }}
        onConfirm={handleCancelBooking}
        bookingId={selectedBookingId || 0}
        bookingNumber={selectedBookingNumber}
        isLoading={isCancelling}
        error={cancelError}
      />

      {/* Main Content */}
      <main className="w-full">
        {/* Tabs */}
        <div className="flex items-center justify-center mb-6 pt-4">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
            <Button
              variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('upcoming')}
              className={`rounded-full px-6 ${activeTab === 'upcoming' ? '' : 'hover:bg-gray-200'}`}
            >
              Upcoming
            </Button>
            <Button
              variant={activeTab === 'passed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('passed')}
              className={`rounded-full px-6 ${activeTab === 'passed' ? '' : 'hover:bg-gray-200'}`}
            >
              Past
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-600">Loading bookings...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="px-4">
            <div className="bg-white rounded-xl p-6 text-center max-w-md mx-auto">
              <p className="text-red-500 mb-3">{error}</p>
              <Button
                variant="default"
                size="sm"
                onClick={fetchBookings}
                className="rounded-full"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Booking Cards Container - 2 cards per row */}
        {!loading && !error && (
          <div className="px-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaCar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No {activeTab} bookings found</h3>
                <p className="text-sm text-gray-500">You don't have any {activeTab} bookings at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((booking) => {
                  const { date, time } = formatBookingDate(booking.ride_details.travel_datetime);
                  const isRider = booking.your_current_role === 'rider';
                  const otherPerson = isRider ? booking.driver_details : booking.rider_details;
                  const canCancel = activeTab === 'upcoming' && 
                    ['confirmed', 'negotiation_pending', 'payment_pending'].includes(booking.booking_status);
                  
                  return (
                    <div 
                      key={booking.booking_id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] relative"
                      onClick={(e) => handleBookingClick(booking.booking_id, e)}
                    >
                      {/* 3-dot Menu for Cancellation */}
                      {canCancel && (
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={(e) => toggleDropdown(booking.booking_id, e)}
                            className="dropdown-trigger p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {dropdownOpen === booking.booking_id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={(e) => handleCancelClick(booking.booking_id, booking.booking_number, e)}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                              >
                                Cancel Booking
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status and Price Row */}
                      <div className="flex items-start justify-between mb-3 pr-8">
                        <div className="flex flex-col gap-1">
                          {renderStatusBadge(booking.booking_status)}
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{booking.booking_number}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(booking.final_fare)}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">Final Fare</p>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="mb-3">
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {booking.route.from.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatBookingDate(booking.route.from.time).date} at {formatBookingDate(booking.route.from.time).time}
                            </p>
                          </div>
                        </div>
                        
                        <div className="h-3 w-px ml-1 bg-gray-200"></div>
                        
                        <div className="flex items-start gap-2 mt-1">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {booking.route.to.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatBookingDate(booking.route.to.time).date} at {formatBookingDate(booking.route.to.time).time}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Date and Seats */}
                      <div className="flex items-center justify-between text-gray-500 text-xs mb-3">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{date} at {time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FiUser className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{booking.seats_booked} Seat{booking.seats_booked > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 pt-2 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Profile Image */}
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex-shrink-0">
                              <img 
                                src={getProfileImageUrl(otherPerson.profile_image_url)}
                                alt={otherPerson.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/150';
                                }}
                              />
                            </div>
                            
                            {/* Name and Role */}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {otherPerson.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {isRider ? 'Driver' : 'Rider'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Distance */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              {parseFloat(booking.route.distance).toFixed(1)} km
                            </p>
                            <p className="text-xs text-gray-500">Distance</p>
                          </div>
                        </div>
                      </div>

                      {/* OTP Information if available */}
                      {(booking.pickup_otp || booking.drop_otp) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            {booking.pickup_otp && (
                              <div className="text-center flex-1">
                                <p className="font-medium text-gray-600">Pickup OTP</p>
                                <p className="text-base font-bold text-blue-600">{booking.pickup_otp}</p>
                              </div>
                            )}
                            {booking.drop_otp && (
                              <div className="text-center flex-1">
                                <p className="font-medium text-gray-600">Drop OTP</p>
                                <p className="text-base font-bold text-green-600">{booking.drop_otp}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;