import React, { useState, useEffect, useRef } from 'react';
import { FiShield, FiX, FiCheck, FiArrowRight } from 'react-icons/fi';
import { verifyPickupOtp, verifyDropOtp } from '../../services/bookingsviewapi';

interface VerifyTripOtpProps {
  bookingId: number;
  otpType: 'pickup' | 'drop';
  onSuccess?: (data: any) => void;
  onClose: () => void;
  otpValue?: string; // Optional: if we want to show OTP to driver
}

const VerifyTripOtp: React.FC<VerifyTripOtpProps> = ({ 
  bookingId, 
  otpType, 
  onSuccess, 
  onClose,
  otpValue 
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If we have a predefined OTP value (for display only), show it
  const displayOtp = otpValue || '';

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Enter key to submit
    if (e.key === 'Enter' && index === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 4) {
      setError('Please enter 4-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (otpType === 'pickup') {
        const response = await verifyPickupOtp(bookingId, {
          pickup_otp: otpValue,
          started_lat: 0,
          started_lng: 0
        });
        
        setSuccessData(response);
        setSuccess(true);
        
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        const response = await verifyDropOtp(bookingId, {
          drop_otp: otpValue,
          completed_lat: 0,
          completed_lng: 0
        });
        
        setSuccessData(response);
        setSuccess(true);
        
        if (onSuccess) {
          onSuccess(response);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP. Please check the OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDrop = () => {
    onClose();
    // The parent component can handle what to do next
  };

  const handleCompleteRide = () => {
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeIn">
        {/* Close button - only show when not loading */}
        {!loading && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}

        {/* Success State */}
        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <FiCheck className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {otpType === 'pickup' ? 'Pickup Verified!' : 'Ride Completed!'}
            </h1>
            
            <p className="text-gray-500 text-center mb-8">
              {otpType === 'pickup' 
                ? 'Pickup OTP verified successfully. Ride is now ongoing.'
                : 'Drop OTP verified successfully. Ride completed and partner payout processed.'}
            </p>

            {otpType === 'pickup' && successData?.dropOtp && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiShield className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">
                    Drop OTP for passenger
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {successData.dropOtp.split('').map((digit: string, index: number) => (
                    <div
                      key={index}
                      className="w-14 h-14 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-2xl font-bold text-blue-900"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 text-center">
                  Share this OTP with passenger at drop location
                </p>
              </div>
            )}

            <div className="space-y-3">
              {otpType === 'pickup' ? (
                <button
                  onClick={handleContinueToDrop}
                  className="w-full py-3.5 bg-[#21409A] text-white font-semibold rounded-full hover:bg-[#1a3378] transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Drop
                  <FiArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleCompleteRide}
                  className="w-full py-3.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        ) : (
          // OTP Entry State
          <>
            {/* Shield Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FiShield className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {otpType === 'pickup' ? 'Verify Pickup OTP' : 'Verify Drop OTP'}
            </h1>
            <p className="text-gray-500 text-center mb-8">
              {otpType === 'pickup' 
                ? 'Enter the 4-digit OTP provided by the passenger.'
                : 'Enter the 4-digit OTP provided by the rider.'}
            </p>

            {/* OTP Display (if provided) */}
            {displayOtp && otpType === 'pickup' && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2 text-center">
                  Passenger Pickup OTP
                </p>
                <div className="flex justify-center gap-3">
                  {displayOtp.split('').map((digit, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold text-gray-700"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OTP Inputs - 4 digits only */}
            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-16 h-16 border-2 rounded-xl text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent transition-all ${
                    error ? 'border-red-300' : 'border-gray-200'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  disabled={loading || !!displayOtp}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || otp.join('').length !== 4}
              className={`w-full py-3.5 font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${
                loading || otp.join('').length !== 4
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#21409A] text-white hover:bg-[#1a3378]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                'Submit'
              )}
            </button>

            {/* Helper text */}
            <p className="text-center text-xs text-gray-400 mt-4">
              {otpType === 'pickup' 
                ? 'Ask the passenger for their pickup OTP'
                : 'Ask the rider for their drop OTP'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyTripOtp;