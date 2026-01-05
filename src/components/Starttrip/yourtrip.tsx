// components/YourTrips/YourTrips.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { FaPlay, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { startTrip } from '@/services/startTripApi';

const YourTrips: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get booking data from navigation state
  const bookingData = location.state?.bookingData || null;
  
  // State for API call
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());
  // Add custom toast state
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null);

  function calculateTimeLeft() {
    if (!bookingData?.ride_details?.travel_datetime) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const tripTime = new Date(bookingData.ride_details.travel_datetime).getTime();
    const now = new Date().getTime();
    const difference = tripTime - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalSeconds: difference / 1000 };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingData]);

  // Auto hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Format digits for display
  const formatDigit = (num: number): string => num.toString().padStart(2, '0');
  
  const daysDigit1 = timeLeft.days >= 10 ? formatDigit(timeLeft.days)[0] : '0';
  const daysDigit2 = timeLeft.days >= 10 ? formatDigit(timeLeft.days)[1] : formatDigit(timeLeft.days)[0];
  
  const hoursDigit1 = formatDigit(timeLeft.hours)[0];
  const hoursDigit2 = formatDigit(timeLeft.hours)[1];
  
  const minutesDigit1 = formatDigit(timeLeft.minutes)[0];
  const minutesDigit2 = formatDigit(timeLeft.minutes)[1];
  
  const secondsDisplay = formatDigit(timeLeft.seconds);

  const handleStartTrip = async () => {
    console.log('🚀 handleStartTrip called');
    
    if (!bookingData) {
      showCustomToast('Error', 'No booking data found.', 'error');
      return;
    }

    if (!user?.token) {
      showCustomToast('Error', 'Please login to start your trip.', 'error');
      return;
    }

    const rideId = bookingData.ride_details?.ride_id;
    
    if (!rideId) {
      showCustomToast('Error', 'Ride ID not found.', 'error');
      return;
    }

    const numericRideId = Number(rideId);
    if (isNaN(numericRideId) || numericRideId <= 0) {
      showCustomToast('Error', 'Invalid Ride ID.', 'error');
      return;
    }

    setIsStartingTrip(true);

    try {
      console.log('📞 Calling API with rideId:', numericRideId);
      
      const response = await startTrip(numericRideId, user.token);
      
      console.log('✅ API Response:', response);
      
      if (response.success) {
        showCustomToast('Success! 🎉', response.data?.message || 'Trip started successfully!', 'success');
      } else {
        // Get error message
        const errorMessage = getErrorMessage(response);
        console.log('❌ Error message:', errorMessage);
        showCustomToast('Error', errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('💥 Unexpected error:', error);
      showCustomToast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setIsStartingTrip(false);
    }
  };

  const getErrorMessage = (response: any): string => {
    if (typeof response.error === 'string') {
      return response.error;
    }
    if (response.error?.message) {
      return response.error.message;
    }
    if (response.message) {
      return response.message;
    }
    return 'Failed to start trip.';
  };

  const showCustomToast = (title: string, description: string, type: 'success' | 'error') => {
    console.log('🎯 Showing custom toast:', { title, description, type });
    setToastMessage({ title, description, type });
  };

  const isButtonDisabled = isStartingTrip || !bookingData || !user?.token;

  return (
    <div className="min-h-screen bg-gray-500-50 overflow-x-hidden relative">
      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center justify-between p-4 rounded-lg shadow-lg max-w-md ${
            toastMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex-1">
              <div className="font-semibold">{toastMessage.title}</div>
              <div className="text-sm mt-1">{toastMessage.description}</div>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-50 pt-4 pb-2">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">Your Start Trip</h2>
          <p className="text-gray-500 text-xs sm:text-sm md:text-base">Upcoming ride countdown</p>
        </div>

        {/* Countdown Timer */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                  <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{daysDigit1}</span>
                  </div>
                  <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{daysDigit2}</span>
                  </div>
                </div>
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">— Days —</span>
              </div>
              {timeLeft.days > 0 && (
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A] hidden sm:inline-block">:</span>
              )}
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{hoursDigit1}</span>
              </div>
              <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{hoursDigit2}</span>
              </div>
            </div>
            <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">— Hours —</span>
          </div>

          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">:</span>

          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{minutesDigit1}</span>
              </div>
              <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{minutesDigit2}</span>
              </div>
            </div>
            <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">— Minutes —</span>
          </div>

          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">:</span>

          <div className="flex flex-col items-center">
            <div className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 lg:w-16 lg:h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#21409A]">{secondsDisplay}</span>
            </div>
            <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">— Seconds —</span>
          </div>
        </div>

        {/* Start Trip Button */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <button
            onClick={handleStartTrip}
            disabled={isButtonDisabled}
            className={`px-6 sm:px-8 md:px-12 lg:px-16 py-2.5 sm:py-3 md:py-4 font-semibold text-xs sm:text-sm md:text-base rounded-full flex items-center gap-1.5 sm:gap-2 md:gap-3 shadow-lg transition-all ${
              !isButtonDisabled
                ? 'bg-[#21409A] text-white hover:bg-[#1a357a] active:scale-[0.98] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isStartingTrip ? (
              <>
                <span className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></span>
                Starting Trip...
              </>
            ) : (
              <>
                Start Trip
                <FaPlay className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
              </>
            )}
          </button>
        </div>

        {/* Trip Info */}
        {bookingData && (
          <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">Trip Details</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 md:gap-6">
              <div className="flex items-start gap-2 flex-1 w-full sm:w-auto">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 mt-1 sm:mt-1.5 rounded-full bg-blue-500"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{bookingData.route.from.name}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mt-0.5">
                    {new Date(bookingData.route.from.time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(bookingData.route.from.time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="text-gray-400 text-sm sm:text-base md:text-lg flex items-center justify-center h-full my-1 sm:my-0">
                <span className="rotate-90 sm:rotate-0">→</span>
              </div>

              <div className="flex items-start gap-2 flex-1 w-full sm:w-auto sm:justify-end">
                <div className="flex-1 min-w-0 text-right sm:text-left">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{bookingData.route.to.name}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mt-0.5">
                    {new Date(bookingData.route.to.time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(bookingData.route.to.time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 mt-1 sm:mt-1.5 rounded-full bg-green-500"></div>
              </div>
            </div>
            
            {bookingData.ride_details?.ride_id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500">
                  Ride ID: <span className="font-semibold text-gray-700">{bookingData.ride_details.ride_id}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add CSS for animation */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YourTrips;