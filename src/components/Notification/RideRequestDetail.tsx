import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiMapPin, FiCalendar, FiClock, FiNavigation, FiDownload } from 'react-icons/fi';
import { FaCar, FaCheck, FaTimes, FaExchangeAlt, FaUser, FaStar } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  respondToBooking, 
  counterRespondToBooking,
  getBookingDetails 
} from '@/services/notificationApi';
import axios from 'axios';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [driverVerificationDetails, setDriverVerificationDetails] = useState<any>(null);
  
  // Base URL for images (update this with your actual base URL)
  const BASE_URL = 'https://api-dev.oolalala.com';

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  };

  // Fetch driver verification details
  const fetchDriverVerificationDetails = async (driverId: number) => {
    try {
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken') || 
                   sessionStorage.getItem('authToken') || 
                   sessionStorage.getItem('accessToken') || '';
      
      const response = await axios.get(
        `${BASE_URL}/api/drivers/${driverId}/verification`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      setDriverVerificationDetails(response.data);
    } catch (error) {
      console.error('Error fetching driver verification details:', error);
      setDriverVerificationDetails(null);
    }
  };

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

        // Fetch driver verification details if user is rider and booking is completed
        if (details.your_current_role === 'rider' && 
            details.booking_status === 'completed' &&
            details.driver_details?.id) {
          await fetchDriverVerificationDetails(details.driver_details.id);
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
        // Use "negotiate" action
        const response = await respondToBooking(
          bookingData.booking_id,
          'negotiate',
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

  // Handle Pay Now action with Razorpay integration
  const handlePayNow = async () => {
    if (!bookingData) {
      toast({
        title: "Error",
        description: "Booking data not available",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoadingPayment(true);
      
      toast({
        title: "Payment Initiated",
        description: "Redirecting to payment gateway...",
      });
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Get Razorpay credentials from booking data
      const razorpayOrderId = bookingData.payment_details?.razorpay_order_id;
      const razorpayKeyId = bookingData.payment_details?.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const amount = bookingData.payment_details?.amount || bookingData.final_fare;
      const currency = bookingData.payment_details?.currency || 'INR';

      if (!razorpayOrderId) {
        toast({
          title: "Error",
          description: "Payment order ID not found",
          variant: "destructive"
        });
        return;
      }

      if (!razorpayKeyId) {
        toast({
          title: "Error",
          description: "Razorpay key not configured",
          variant: "destructive"
        });
        return;
      }

      // Prepare options for Razorpay
      const options = {
        key: razorpayKeyId,
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise
        currency: currency,
        name: "Ride Booking Payment",
        description: `Payment for booking ${bookingData.booking_number || bookingData.booking_id}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          
          toast({
            title: "Payment Successful",
            description: `Payment ID: ${response.razorpay_payment_id}`,
          });

          navigate('/riderequestdetails', { 
            state: { 
              bookingId: bookingData.booking_id,
              paymentId: response.razorpay_payment_id 
            } 
          });
        },
        prefill: {
          name: bookingData.rider_details?.name || "Customer",
          email: "success@razorpay.com", 
          contact: bookingData.rider_details?.mobile_number || ""
        },
        notes: {
          booking_id: bookingData.booking_id.toString(),
          booking_number: bookingData.booking_number,
          type: "ride_booking"
        },
        theme: {
          color: "#21409A"
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled by user",
              variant: "default"
            });
          }
        }
      };

      // Initialize and open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Handle Rate Trip button click
  const handleRateTrip = () => {
    if (!bookingData?.booking_id) {
      toast({
        title: "Error",
        description: "Booking ID not found",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to trip rating page with state instead of URL parameter
    navigate('/trip-rating', {
      state: {
        bookingId: bookingData.booking_id,
        driverDetails: bookingData.driver_details,
        rideDetails: bookingData.ride_details,
        bookingData: bookingData // Pass the entire booking data if needed
      }
    });
  };

  // Handle Download Invoice
  const handleDownloadInvoice = async () => {
    if (!bookingData?.booking_id) {
      toast({
        title: "Error",
        description: "Booking ID not found",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDownloadingInvoice(true);
      
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken') || 
                   sessionStorage.getItem('authToken') || 
                   sessionStorage.getItem('accessToken') || '';
      
      const url = `${BASE_URL}/api/bookings/${bookingData.booking_id}/invoice`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingData.booking_number || bookingData.booking_id}.pdf`);
      link.setAttribute('target', '_blank');
      
      // Add authorization header through custom header method
      // Note: This might not work for direct downloads. We'll use fetch instead.
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
      
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingInvoice(false);
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

  // Construct full image URL
  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('//')) return `https:${path}`;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Helper function to determine what details to show based on your conditions
  const shouldShowDetails = () => {
    if (!bookingData) return { showDriver: false, showPassenger: false, showVehicle: false };

    const { booking_status, your_current_role } = bookingData;
    const isConfirmed = booking_status === 'confirmed';
    const isRider = your_current_role === 'rider';
    const isDriverOrPartner = your_current_role === 'driver' || your_current_role === 'partner';

    // Condition 1: booking_status = confirmed && your_current_role = rider
    // => Show driver details and vehicle details, NOT show passenger/rider details
    if (isConfirmed && isRider) {
      return {
        showDriver: true,
        showPassenger: false,
        showVehicle: true
      };
    }

    // Condition 2: booking_status = any (except confirmed) && your_current_role = rider
    // => NOT show driver details, passenger/rider details, vehicle details
    if (!isConfirmed && isRider) {
      return {
        showDriver: false,
        showPassenger: false,
        showVehicle: false
      };
    }

    // Condition 3: booking_status = confirmed && your_current_role = driver or partner
    // => Show passenger details and vehicle details, NOT show driver details
    if (isConfirmed && isDriverOrPartner) {
      return {
        showDriver: false,
        showPassenger: true,
        showVehicle: true
      };
    }

    // Condition 4: booking_status = any (except confirmed) && your_current_role = driver or partner
    // => NOT show driver details, passenger/rider details, vehicle details
    if (!isConfirmed && isDriverOrPartner) {
      return {
        showDriver: false,
        showPassenger: false,
        showVehicle: false
      };
    }

    // Default: show nothing
    return {
      showDriver: false,
      showPassenger: false,
      showVehicle: false
    };
  };

  // Calculate fare difference
  const calculateFareDifference = () => {
    const baseFare = parseFloat(bookingData?.total_fare) || 0;
    const negotiatedFare = parseFloat(bookingData?.final_fare) || baseFare;
    return Math.abs(negotiatedFare - baseFare);
  };

  // Check if it's user's turn
  const isMyTurn = bookingData?.is_my_turn || false;
  const userRole = bookingData?.your_current_role || 'partner';

  // Check if Pay Now button should be shown
  const showPayNowButton = 
    bookingData?.booking_status === 'payment_pending' && 
    bookingData?.your_current_role === 'rider';

  // Check if Rate Trip and Download Invoice buttons should be shown
  const showRateAndInvoiceButtons = 
    bookingData?.booking_status === 'completed' && 
    bookingData?.your_current_role === 'rider';

  // Get what to show based on conditions
  const detailsToShow = shouldShowDetails();

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
            className="px-4 py-2 bg-[#21409A] text-white rounded text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate fares
  const baseFare = parseFloat(bookingData.total_fare) || 0;
  const negotiatedFare = parseFloat(bookingData.final_fare) || baseFare;
  const difference = calculateFareDifference();

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
          className="p-2 hover:bg-gray-100 rounded-full transition-colors m-2"
        >
          <FiChevronLeft className="text-xl text-gray-700" />
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 pb-4">
        {/* Turn Indicator */}
        {isMyTurn && (
          <div className="mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-xs">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium text-sm">
                    It's your turn to respond!
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Please accept, decline, or negotiate the offer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Column - 55% width */}
          <div className="lg:w-[55%] space-y-4">
            {/* Ride Request Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ride Request</h2>
                <p className="text-gray-500 text-xs mt-1">
                  Booking ID: {bookingData.booking_number || `#${bookingData.booking_id}`}
                </p>
              </div>
              <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-medium border ${
                bookingData.booking_status === 'negotiation_pending' 
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : bookingData.booking_status === 'payment_pending'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : bookingData.booking_status === 'confirmed'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : bookingData.booking_status === 'completed'
                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {bookingData.booking_status ? bookingData.booking_status.replace(/_/g, ' ') : 'New Request'}
              </span>
            </div>

            {/* Fare Card */}
            <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-gray-500 text-xs">Base Fare</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                    ₹{baseFare.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-gray-500 text-xs">Negotiated Fare</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                      ₹{negotiatedFare.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-green-600 text-xs font-medium">Difference</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-600 mt-1">
                      ₹{difference.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Route Details</h3>
              <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
                <div className="space-y-3">
                  {/* From */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FiNavigation className="text-[#21409A] text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-xs">From:</p>
                      <p className="text-gray-900 font-semibold truncate text-sm">
                        {bookingData.route?.from?.name || 'Location not specified'}
                      </p>
                      {bookingData.route?.from?.time && (
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(bookingData.route.from.time)} at {formatTime(bookingData.route.from.time)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="text-green-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-xs">To:</p>
                      <p className="text-gray-900 font-semibold truncate text-sm">
                        {bookingData.route?.to?.name || 'Location not specified'}
                      </p>
                      {bookingData.route?.to?.time && (
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(bookingData.route.to.time)} at {formatTime(bookingData.route.to.time)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trip Info Row */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <FiCalendar className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.ride_details?.travel_datetime ? 
                       formatDate(bookingData.ride_details.travel_datetime) : 
                       'Date not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <FiNavigation className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.route?.distance ? `${bookingData.route.distance} km` : 'Distance calculating...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <FiClock className="text-gray-400" />
                    <span className="whitespace-nowrap">
                      {bookingData.ride_details?.travel_datetime ? 
                       formatTime(bookingData.ride_details.travel_datetime) : 
                       'Time not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
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
              <h3 className="text-base font-semibold text-gray-900 mb-2">Negotiation History</h3>
              <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
                {negotiationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {negotiationHistory.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.type === 'driver' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-xs sm:text-sm">
                            <span className="font-semibold capitalize">{item.type}:</span>
                            <span className="ml-1 font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                          </p>
                          {item.remarks && (
                            <p className="text-gray-500 text-xs mt-1 italic">
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
                  <p className="text-gray-500 text-center py-3 text-sm">No negotiation history available</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 45% width */}
          <div className="lg:w-[45%] space-y-4">
            {/* Notes Section - Show only when booking_status is 'confirmed' and user is rider */}
            {bookingData.booking_status === 'confirmed' &&
  bookingData.your_current_role === 'rider' && (
    <div className="w-full">
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        Important Notes
      </h3>

      <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
        <p className="text-red-600 text-xs font-medium mb-2">
          🚨 Important:
        </p>

        <ul className="text-gray-600 text-xs space-y-1 pl-4">
          <li className="list-disc">
            Verify the driver details, vehicle number, and OTP before your ride.
          </li>

          <li className="list-disc">
            If the driver or vehicle details do not match, do not board the
            vehicle and contact customer support immediately.
          </li>

          <li className="list-disc font-medium text-gray-700">
            Your safety is our priority.
          </li>

          <li className="list-disc text-red-500 font-medium">
            After OTP verification, the platform will not be responsible for any
            personal disputes, losses, or incidents during the ride.
          </li>
        </ul>
      </div>
    </div>
)}


            {/* Passenger Details - Show only when conditions met */}
            {detailsToShow.showPassenger && bookingData.rider_details && (
              <div className="w-full">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Passenger Details</h3>
                <div className="bg-white rounded p-3 shadow-sm border border-gray-100 space-y-3 w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="relative">
                        {bookingData.rider_details.profile_image_url ? (
                          <img 
                            src={getFullImageUrl(bookingData.rider_details.profile_image_url)}
                            alt={bookingData.rider_details.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FaUser className="text-blue-600 text-xs" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-sm">
                          {bookingData.rider_details.name || 'Unknown Rider'}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {bookingData.rider_details.mobile_number || 'Not available'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                      Rider
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Details - Show only when conditions met */}
            {detailsToShow.showDriver && bookingData.driver_details && (
              <div className="w-full">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Driver Details</h3>
                <div className="bg-white rounded p-3 shadow-sm border border-gray-100 w-full">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {bookingData.driver_details.profile_image_url ? (
                        <img 
                          src={getFullImageUrl(bookingData.driver_details.profile_image_url)}
                          alt={bookingData.driver_details.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FaCar className="text-green-600 text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {bookingData.driver_details.name || 'Unknown Driver'}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {bookingData.driver_details.mobile_number || 'Not available'}
                      </p>
                      <p className="text-yellow-600 text-xs mt-1">
                        ⭐ {bookingData.driver_details.average_rating || '0.00'} Rating
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Details - Show only when conditions met */}
            {detailsToShow.showVehicle && bookingData.vehicle_details && (
              <div className="w-full">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Vehicle Details</h3>
                <div className="bg-white rounded p-3 shadow-sm border border-gray-100 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FaCar className="text-[#21409A] text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {bookingData.vehicle_details.brand || ''} {bookingData.vehicle_details.model || ''}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {bookingData.vehicle_details.number_plate || 'Not available'}
                      </p>
                      {bookingData.vehicle_details.color && (
                        <p className="text-gray-500 text-xs truncate">
                          Color: {bookingData.vehicle_details.color}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message when no details are shown */}
            {!detailsToShow.showDriver && !detailsToShow.showPassenger && !detailsToShow.showVehicle && (
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-gray-600 text-center text-xs">
                  {bookingData.booking_status === 'confirmed' 
                    ? 'Details are only shown to specific roles for confirmed bookings.'
                    : 'Details are hidden for non-confirmed booking statuses.'}
                </p>
              </div>
            )}

            {/* Driver Verification Card - Show only when user is rider and booking is completed */}
            {bookingData.booking_status === 'completed' && 
             bookingData.your_current_role === 'rider' &&
             driverVerificationDetails && (
              <div className="w-full">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Driver Verification</h3>
                <div className="bg-white rounded p-3 shadow-sm border border-gray-100 w-full">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs">License Verified</p>
                        <p className={`text-sm font-medium ${driverVerificationDetails.license_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {driverVerificationDetails.license_verified ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Vehicle Verified</p>
                        <p className={`text-sm font-medium ${driverVerificationDetails.vehicle_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {driverVerificationDetails.vehicle_verified ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-gray-500 text-xs mb-1">Verification Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${driverVerificationDetails.verification_status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <p className="text-sm font-medium capitalize">
                          {driverVerificationDetails.verification_status || 'Not verified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Trip and Download Invoice Buttons - Show only when booking is completed and user is rider */}
            {showRateAndInvoiceButtons && (
              <div className="w-full space-y-3">
                <h3 className="text-base font-semibold text-gray-900">Trip Completed</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRateTrip}
                    className="w-full px-3 py-2 bg-[#21409A] text-white rounded font-medium flex items-center justify-center gap-2 text-sm hover:bg-[#1a347a] transition-colors"
                  >
                    <FaStar className="text-xs" />
                    Rate This Driver
                  </button>
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                    className={`w-full px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded font-medium flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors ${
                      isDownloadingInvoice ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isDownloadingInvoice ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FiDownload className="text-xs" />
                        Download Invoice
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-xs text-center">
                  Your trip has been completed. Please rate your driver and download your invoice.
                </p>
              </div>
            )}

            {/* Action Section */}
            {isMyTurn && !showRateAndInvoiceButtons && (
              <div className="w-full space-y-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Your Action Required
                </h3>
                
                {/* Negotiate Fare (only for driver/partner) */}
                {userRole !== 'rider' && showNegotiateForm && (
                  <div className="bg-white rounded p-3 shadow-sm border border-gray-100 w-full">
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Make a Counter Offer</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Counter Fare (₹)</label>
                        <input
                          type="number"
                          value={newFare}
                          onChange={(e) => setNewFare(e.target.value)}
                          placeholder="Enter counter fare amount"
                          className="w-full px-3 py-2 border border-gray-200 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#21409A]/20 focus:border-[#21409A] text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Remarks (Optional)</label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g., Can you do this fare?"
                          className="w-full px-3 py-2 border border-gray-200 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#21409A]/20 focus:border-[#21409A] text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={toggleNegotiateForm}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNegotiate}
                        disabled={isProcessing || !newFare}
                        className={`flex-1 px-3 py-2 rounded font-medium flex items-center justify-center gap-1 text-sm ${
                          isProcessing && actionType === 'negotiate'
                            ? 'bg-yellow-500 text-white cursor-wait'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        } ${!newFare ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing && actionType === 'negotiate' ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaExchangeAlt className="text-xs" />
                            Send Counter Offer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`flex gap-2 ${showNegotiateForm ? 'pt-1' : 'pt-3'} w-full`}>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className={`flex-1 px-3 py-2 rounded font-medium flex items-center justify-center gap-1 text-sm ${
                      isProcessing && actionType === 'reject'
                        ? 'bg-red-500 text-white cursor-wait'
                        : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isProcessing && actionType === 'reject' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        Declining...
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-xs" />
                        {userRole === 'rider' ? 'Decline' : 'Reject'}
                      </>
                    )}
                  </button>
                  
                  {userRole !== 'rider' && !showNegotiateForm && (
                    <button
                      onClick={toggleNegotiateForm}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded font-medium flex items-center justify-center gap-1 text-sm hover:bg-yellow-600"
                    >
                      <FaExchangeAlt className="text-xs" />
                      Negotiate
                    </button>
                  )}
                  
                  <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className={`flex-1 px-3 py-2 rounded font-medium flex items-center justify-center gap-1 text-sm ${
                      isProcessing && actionType === 'accept'
                        ? 'bg-green-500 text-white cursor-wait'
                        : 'bg-[#21409A] text-white hover:bg-[#1a347a]'
                    }`}
                  >
                    {isProcessing && actionType === 'accept' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <FaCheck className="text-xs" />
                        Accept
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Accept/Reject for rider */}
                {userRole === 'rider' && (
                  <div className="mt-3 text-center">
                    <p className="text-gray-500 text-xs">
                      As a rider, you can only accept or decline the current offer
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pay Now Button - Show only when booking_status is payment_pending and user is rider */}
            {showPayNowButton && (
              <div className="w-full">
                <button
                  onClick={handlePayNow}
                  disabled={isLoadingPayment}
                  className={`w-full px-3 py-2 bg-[#21409A] text-white rounded font-medium transition-colors text-center flex items-center justify-center gap-1 text-sm ${
                    isLoadingPayment ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#1a347a]'
                  }`}
                >
                  {isLoadingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
                
                {/* Test Card Information */}
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800 font-medium mb-1">Test Card Details:</p>
                  <p className="text-xs text-yellow-700">
                    Card Number: 4111 1111 1111 1111<br />
                    Expiry: 12/34 | CVV: 123<br />
                    Email: success@razorpay.com
                  </p>
                </div>
              </div>
            )}

            {/* Status Message if not user's turn and not completed booking */}
            {!isMyTurn && !showPayNowButton && !showRateAndInvoiceButtons && (
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-gray-600 text-center text-sm">
                  Waiting for the other party to respond...
                </p>
                <p className="text-gray-500 text-xs text-center mt-1">
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