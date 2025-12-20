// src/pages/VerifyLoginOTP.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export const VerifyLoginOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { requestOTP } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canResend && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [canResend, resendTimer]);

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

    try {
      const signupPhone = sessionStorage.getItem('signupPhone');
      const resetPhone = sessionStorage.getItem('resetPhone');
      const phone = signupPhone || resetPhone;

      if (!phone) {
        toast.error('Session expired. Please start again.');
        navigate('/signup');
        return;
      }

      // Store OTP in session for SetPin page
      sessionStorage.setItem('otpCode', otpValue);

      // Navigate to SetPin page
      navigate('/set-pin');
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');
    const phone = signupPhone || resetPhone;

    if (!phone) {
      toast.error('Session expired. Please start again.');
      navigate('/signup');
      return;
    }

    try {
      const purpose = signupPhone ? 'register' : 'password_reset';
      const success = await requestOTP(phone, purpose);
      
      if (success) {
        setCanResend(false);
        setResendTimer(30);
        toast.success('OTP resent successfully!');
      } else {
        toast.error('Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const handleBack = () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');
    
    if (signupPhone) {
      navigate('/signup');
    } else if (resetPhone) {
      navigate('/forgot-password');
    } else {
      navigate('/login');
    }
  };

  const getTitle = () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');
    
    if (signupPhone) {
      return "Verify Signup OTP";
    } else if (resetPhone) {
      return "Verify Reset OTP";
    } else {
      return "Enter OTP";
    }
  };

  const getMessage = () => {
    const signupPhone = sessionStorage.getItem('signupPhone');
    const resetPhone = sessionStorage.getItem('resetPhone');
    const phone = signupPhone || resetPhone;
    
    // Show last 4 digits of phone number
    const maskedPhone = phone ? `${phone.slice(0, 3)}XXXX${phone.slice(7)}` : '';
    
    if (signupPhone) {
      return `We've sent a 6-digit code to ${maskedPhone} to verify your signup`;
    } else if (resetPhone) {
      return `We've sent a 6-digit code to ${maskedPhone} to reset your PIN`;
    } else {
      return "We've sent a 6-digit code to your mobile number";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <div className="h-10 w-10 flex items-center justify-center text-2xl">🔐</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">{getTitle()}</h1>
          <p className="text-muted-foreground">
            {getMessage()}
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
            {isVerifying ? 'Verifying...' : 'Continue'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <div className="text-center space-y-2">
            <button
              onClick={handleResendOTP}
              disabled={!canResend}
              className={`text-sm ${canResend ? 'text-primary hover:underline' : 'text-muted-foreground'}`}
            >
              {canResend ? "Didn't receive OTP? Resend" : `Resend OTP in ${resendTimer}s`}
            </button>
            <p className="text-xs text-muted-foreground">
              OTP is valid for 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLoginOTP;