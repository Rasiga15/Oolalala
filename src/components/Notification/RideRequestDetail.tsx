// RideRequestDetail.tsx
import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiMapPin, FiCalendar, FiClock, FiNavigation } from 'react-icons/fi';
import { FaCar, FaCheck, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  respondToBooking, 
  counterRespondToBooking,
  getBookingDetails 
} from '@/services/notificationApi';

const RideRequestDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [newFare, setNewFare] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'negotiate' | null>(null);
  const [showNegotiateForm, setShowNegotiateForm] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setIsLoading(true);
        
        // Get booking ID from location state or URL params
        const bookingId = location.state?.bookingId || 
                         location.state?.bookingDetails?.booking_id ||
                         location.state?.bookingId ||
                         (location.pathname.split('/').pop());

        if (!bookingId) {
          toast({
            title: "No Booking ID",
            description: "Booking information not found",
            variant: "destructive"
          });
          navigate(-1);
          return;
        }

        console.log('Fetching booking data for ID:', bookingId);
        
        // Fetch booking details
        const details = await getBookingDetails(Number(bookingId));
        setBookingData(details);
        
        // Set new fare to current final fare for negotiation
        if (details.final_fare) {
          setNewFare(details.final_fare.toString());
        }
        
      } catch (error: any) {
        console.error('Error fetching booking details:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load booking details",
          variant: "destructive"
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingData();
  }, [location.state, navigate, toast]);

  // Handle accept action
  const handleAccept = async () => {
    if (!bookingData?.booking_id) return;

    try {
      setIsProcessing(true);
      setActionType('accept');

      if (bookingData.your_current_role === 'rider') {
        // Rider counter response
        const response = await counterRespondToBooking(bookingData.booking_id, 'accept');
        toast({
          title: "Success",
          description: response.message || "Booking accepted successfully",
        });
      } else {
        // Driver/Partner response - Accept with current fare
        const response = await respondToBooking(
          bookingData.booking_id, 
          'accept',
          bookingData.final_fare ? parseFloat(bookingData.final_fare) : undefined,
          remarks || undefined
        );
        toast({
          title: "Success",
          description: response.message || "Booking accepted successfully",
        });
      }
      
      // Navigate back after success
      setTimeout(() => navigate(-1), 1500);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!bookingData?.booking_id) return;

    try {
      setIsProcessing(true);
      setActionType('reject');

      if (bookingData.your_current_role === 'rider') {
        // Rider counter response
        const response = await counterRespondToBooking(bookingData.booking_id, 'decline');
        toast({
          title: "Booking Declined",
          description: response.message || "Booking declined successfully",
        });
      } else {
        // Driver/Partner response
        const response = await respondToBooking(bookingData.booking_id, 'reject');
        toast({
          title: "Booking Rejected",
          description: response.message || "Booking rejected successfully",
        });
      }
      
      // Navigate back after success
      setTimeout(() => navigate(-1), 1500);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // Handle negotiate action (only for driver/partner)
  const handleNegotiate = async () => {
    if (!bookingData?.booking_id || !newFare) {
      toast({
        title: "Invalid Fare",
        description: "Please enter a valid fare amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setActionType('negotiate');

      // Convert fare to number
      const negotiatedFare = parseFloat(newFare);
      
      if (isNaN(negotiatedFare) || negotiatedFare <= 0) {
        toast({
          title: "Invalid Fare",
          description: "Please enter a valid positive fare amount",
          variant: "destructive"
        });
        return;
      }

      // For driver/partner only
      if (bookingData.your_current_role !== 'rider') {
        // Use "negotiate" action instead of "accept" with new fare
        const response = await respondToBooking(
          bookingData.booking_id,
          'negotiate', // Use negotiate action
          negotiatedFare,
          remarks || "Can you do " + negotiatedFare
        );
        
        toast({
          title: "Counter Offer Sent",
          description: response.message || "Your counter offer has been sent to the rider",
        });
        
        // Navigate back after success
        setTimeout(() => navigate(-1), 1500);
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send counter offer",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
      setShowNegotiateForm(false);
    }
  };

  // Toggle negotiate form
  const toggleNegotiateForm = () => {
    setShowNegotiateForm(!showNegotiateForm);
    if (!newFare && bookingData?.final_fare) {
      setNewFare(bookingData.final_fare.toString());
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21409A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ride request details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load booking data</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#21409A] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate fare difference
  const baseFare = parseFloat(bookingData.total_fare) || 0;
  const negotiatedFare = parseFloat(bookingData.final_fare) || baseFare;
  const difference = Math.abs(negotiatedFare - baseFare);

  // Check if it's user's turn
  const isMyTurn = bookingData.is_my_turn || false;
  const userRole = bookingData.your_current_role || 'partner';

  // Prepare passengers array
  const passengers = bookingData.rider_details ? [{
    id: '1',
    name: bookingData.rider_details.name || 'Unknown Rider',
    phone: bookingData.rider_details.mobile_number || 'Not available'
  }] : [];

  // Prepare vehicle data
  const vehicle = bookingData.vehicle_details ? {
    name: `${bookingData.vehicle_details.brand || ''} ${bookingData.vehicle_details.model || ''}`.trim(),
    number: bookingData.vehicle_details.number_plate || 'Not available',
    color: bookingData.vehicle_details.color || ''
  } : {
    name: 'Vehicle details not available',
    number: 'Not available',
    color: ''
  };

  // Prepare driver data
  const driver = bookingData.driver_details ? {
    name: bookingData.driver_details.name || 'Unknown Driver',
    phone: bookingData.driver_details.mobile_number || 'Not available',
    rating: bookingData.driver_details.average_rating || '0.00'
  } : null;

  // Prepare negotiation history
  const negotiationHistory = bookingData.negotiation_history?.map((item: any, index: number) => ({
    id: (index + 1).toString(),
    type: item.by === 'driver' || item.by === 'partner' ? 'driver' : 'passenger',
    amount: item.amount || 0,
    remarks: item.remarks,
    timestamp: item.timestamp
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header>
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors m-4"
        >
          <FiChevronLeft className="text-2xl text-gray-700" />
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto ">
        {/* Turn Indicator */}
       

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - 55% width */}
          <div className="lg:w-[55%] space-y-6">
            {/* Ride Request Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ride Request</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Booking ID: {bookingData.booking_number || `#${bookingData.booking_id}`}
                </p>
              </div>
              <span className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-sm font-medium border ${
                bookingData.booking_status === 'negotiation_pending' 
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : bookingData.booking_status === 'payment_pending'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {bookingData.booking_status ? bookingData.booking_status.replace(/_/g, ' ') : 'New Request'}
              </span>
            </div>

            {/* Fare Card */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Base Fare</p>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                    ₹{baseFare.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div className="text-left sm:text-right">
                    <p className="text-gray-500 text-sm">Negotiated Fare</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                      ₹{negotiatedFare.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-green-600 text-sm font-medium">Difference</p>
                    <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                      ₹{difference.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Details</h3>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="space-y-4">
                  {/* From */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FiNavigation className="text-[#21409A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-sm">From:</p>
                      <p className="text-gray-900 font-semibold truncate">
                        {bookingData.route?.from?.address || bookingData.route?.from?.name || 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-sm">To:</p>
                      <p className="text-gray-900 font-semibold truncate">
                        {bookingData.route?.to?.address || bookingData.route?.to?.name || 'Location not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Info Row */}
                <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FiCalendar className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.ride_details?.travel_datetime ? 
                       formatDate(bookingData.ride_details.travel_datetime) : 
                       'Date not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FiNavigation className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.route?.distance ? `${bookingData.route.distance} km` : 'Distance calculating...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FiClock className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.ride_details?.travel_datetime ? 
                       formatTime(bookingData.ride_details.travel_datetime) : 
                       'Time not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FiClock className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.route?.duration ? bookingData.route.duration : 'Duration calculating...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Negotiation History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Negotiation History</h3>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                {negotiationHistory.length > 0 ? (
                  <div className="space-y-4">
                    {negotiationHistory.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            item.type === 'driver' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-sm sm:text-base">
                            <span className="font-semibold capitalize">{item.type}:</span>
                            <span className="ml-2 font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                          </p>
                          {item.remarks && (
                            <p className="text-gray-500 text-xs sm:text-sm mt-1 italic">
                              "{item.remarks}"
                            </p>
                          )}
                          {item.timestamp && (
                            <p className="text-gray-400 text-xs mt-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No negotiation history available</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 45% width */}
          <div className="lg:w-[45%] space-y-6">
            {/* Passenger Details */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Passenger Details</h3>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 w-full">
                {passengers.length > 0 ? (
                  passengers.map((passenger) => (
                    <div key={passenger.id} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-medium">
                            {passenger.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate text-sm">
                            {passenger.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {passenger.phone}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                        Rider
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-2 text-sm">
                    Passenger details not available
                  </p>
                )}
              </div>
            </div>

            {/* Driver Details (if available) */}
            {driver && (
              <div className="w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Driver Details</h3>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaCar className="text-green-600 text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {driver.name}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {driver.phone}
                      </p>
                      <p className="text-yellow-600 text-xs mt-1">
                        ⭐ {driver.rating} Rating
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Details */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Details</h3>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FaCar className="text-[#21409A] text-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {vehicle.name}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {vehicle.number}
                    </p>
                    {vehicle.color && (
                      <p className="text-gray-500 text-xs truncate">
                        Color: {vehicle.color}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            {isMyTurn && (
              <div className="w-full space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Action Required
                </h3>
                
                {/* Negotiate Fare (only for driver/partner) */}
                {userRole !== 'rider' && showNegotiateForm && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full">
                    <h4 className="font-medium text-gray-700 mb-3">Make a Counter Offer</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Counter Fare (₹)</label>
                        <input
                          type="number"
                          value={newFare}
                          onChange={(e) => setNewFare(e.target.value)}
                          placeholder="Enter counter fare amount"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21409A]/20 focus:border-[#21409A] text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Remarks (Optional)</label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g., Can you do this fare?"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#21409A]/20 focus:border-[#21409A] text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={toggleNegotiateForm}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNegotiate}
                        disabled={isProcessing || !newFare}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                          isProcessing && actionType === 'negotiate'
                            ? 'bg-yellow-500 text-white cursor-wait'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        } ${!newFare ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing && actionType === 'negotiate' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaExchangeAlt className="text-sm" />
                            Send Counter Offer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`flex gap-3 ${showNegotiateForm ? 'pt-2' : 'pt-4'} w-full`}>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      isProcessing && actionType === 'reject'
                        ? 'bg-red-500 text-white cursor-wait'
                        : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isProcessing && actionType === 'reject' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        Declining...
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-sm" />
                        {userRole === 'rider' ? 'Decline' : 'Reject'}
                      </>
                    )}
                  </button>
                  
                  {userRole !== 'rider' && !showNegotiateForm && (
                    <button
                      onClick={toggleNegotiateForm}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-yellow-600"
                    >
                      <FaExchangeAlt className="text-sm" />
                      Negotiate
                    </button>
                  )}
                  
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      isProcessing && actionType === 'accept'
                        ? 'bg-green-500 text-white cursor-wait'
                        : 'bg-[#21409A] text-white hover:bg-[#1a347a]'
                    }`}
                  >
                    {isProcessing && actionType === 'accept' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <FaCheck className="text-sm" />
                        Accept
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Accept/Reject for rider */}
                {userRole === 'rider' && (
                  <div className="mt-4 text-center">
                    <p className="text-gray-500 text-sm">
                      As a rider, you can only accept or decline the current offer
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status Message if not user's turn */}
            {!isMyTurn && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-gray-600 text-center">
                  Waiting for the other party to respond...
                </p>
                <p className="text-gray-500 text-sm text-center mt-1">
                  Current turn: <span className="font-medium capitalize">{bookingData.current_turn || 'unknown'}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RideRequestDetail;