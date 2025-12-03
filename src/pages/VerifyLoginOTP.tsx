// src/components/VerifyLoginOTP.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export const VerifyLoginOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login, fcmToken, deviceId, isFcmSupported } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsVerifying(true);

    const phone = sessionStorage.getItem('loginPhone');
    if (!phone) {
      toast.error('Session expired. Please login again');
      navigate('/login');
      return;
    }

    try {
      console.log('Before login - FCM Status:', {
        isFcmSupported,
        hasFcmToken: !!fcmToken,
        deviceId
      });

      // Login user
      await login(phone);
      sessionStorage.removeItem('loginPhone');
      
      console.log('After login - FCM Status:', {
        hasFcmToken: !!fcmToken,
        deviceId
      });
      
      toast.success('Login successful!');
      navigate('/onboarding/name');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Enter OTP</h1>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to your mobile number
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none transition-all"
              />
            ))}
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleVerifyOTP}
            disabled={otp.some((digit) => !digit) || isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify & Login'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <button
            onClick={() => toast.info('OTP resent successfully!')}
            className="w-full text-center text-sm text-primary hover:underline"
          >
            Didn't receive OTP? Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyLoginOTP;