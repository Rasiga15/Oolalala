// src/pages/SetPin.tsx
import { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export const SetPin = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyOTPAndRegister, verifyOTPAndResetPin } = useAuth();

  // Check if session data exists on component mount
  useEffect(() => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');
    const otpCode = sessionStorage.getItem('otpCode');
    
    if (!signupPhone && !resetPhone) {
      toast.error('Session expired. Please start again.');
      navigate('/signup');
    }
    
    if (!otpCode) {
      toast.error('OTP not found. Please verify OTP again.');
      navigate('/verify-login-otp');
    }
  }, [navigate]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setPin(value);
      setPinError('');
    }
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setConfirmPin(value);
      setConfirmPinError('');
    }
  };

  const handleSetPin = async () => {
    let isValid = true;

    if (pin.length !== 6) {
      setPinError('Please enter a valid 6-digit PIN');
      toast.error('Invalid PIN');
      isValid = false;
    }

    if (confirmPin.length !== 6) {
      setConfirmPinError('Please confirm your 6-digit PIN');
      toast.error('Invalid confirmation PIN');
      isValid = false;
    }

    if (pin !== confirmPin) {
      setConfirmPinError('PINs do not match');
      toast.error('PINs do not match');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const signupPhone = sessionStorage.getItem('signupPhone');
      const resetPhone = sessionStorage.getItem('resetPhone');
      const otpCode = sessionStorage.getItem('otpCode');
      const phone = signupPhone || resetPhone;

      if (!phone || !otpCode) {
        toast.error('Session expired. Please start again.');
        navigate('/signup');
        return;
      }

      let success = false;

      if (signupPhone) {
        let firstname = sessionStorage.getItem('signupFirstname');
        let lastname = sessionStorage.getItem('signupLastname');

        if (!firstname) {
          const randomNum = Math.floor(Math.random() * 10000);
          firstname = `New${randomNum}`;
          lastname = 'User';
        }

        success = await verifyOTPAndRegister(phone, otpCode, pin, {
          first_name: firstname,
          last_name: lastname,
        });
      } else if (resetPhone) {
        success = await verifyOTPAndResetPin(phone, otpCode, pin);
      }

      if (success) {
        sessionStorage.removeItem('otpCode');

        toast.success('PIN set successfully!');

        // ✅ FIXED: ALWAYS redirect to login page after PIN set/reset
        navigate('/login');

        // Clear reset flow
        sessionStorage.removeItem('resetPhone');
        sessionStorage.removeItem('signupFirstname');
        sessionStorage.removeItem('signupLastname');
        sessionStorage.removeItem('signupPhone');
      }
    } catch (error: any) {
      console.error('Error setting PIN:', error);
      
      if (error.message.includes('expired')) {
        toast.error('OTP has expired. Please request a new one.');
        navigate('/verify-login-otp');
      } else {
        toast.error(error.message || 'Failed to set PIN. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');

    if (signupPhone) return "Set Your PIN";
    else if (resetPhone) return "Reset Your PIN";
    else return "Set PIN";
  };

  const getDescription = () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');

    if (signupPhone) return "Create a 6-digit PIN for secure login";
    else if (resetPhone) return "Create a new 6-digit PIN for your account";
    else return "Create a 6-digit PIN";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/verify-login-otp')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">{getTitle()}</h1>
          <p className="text-muted-foreground">{getDescription()}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New PIN (6 digits)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className={`w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  pinError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {pinError && <p className="text-red-500 text-sm mt-1">{pinError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirm PIN (6 digits)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPin}
                onChange={handleConfirmPinChange}
                placeholder="Re-enter 6-digit PIN"
                maxLength={6}
                className={`w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  confirmPinError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {confirmPinError && <p className="text-red-500 text-sm mt-1">{confirmPinError}</p>}
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleSetPin}
            disabled={pin.length !== 6 || confirmPin.length !== 6 || isLoading}
          >
            <Lock className="h-5 w-5 mr-2" />
            {isLoading ? 'Processing...' : 'Continue'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetPin;