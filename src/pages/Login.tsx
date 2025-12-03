import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  const handleGetOTP = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      toast.error('Invalid mobile number');
      return;
    }

    setIsLoading(true);

    try {
      // Send phone number to backend to request OTP
      const response = await sendPhoneToBackend(phone);
      
      if (response.success) {
        // Store phone temporarily for OTP verification
        sessionStorage.setItem('loginPhone', phone);
        toast.success('OTP sent successfully!');
        navigate('/verify-login-otp');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate backend API call to send OTP
  const sendPhoneToBackend = async (phone: string) => {
    // Replace this with your actual backend API call
    return new Promise<{ success: boolean }>((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} login coming soon!`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Welcome to OOLALALA</h1>
          <p className="text-muted-foreground">Enter your mobile number to continue</p>
        </div>

        <div className="space-y-6">
          <div>
            <Input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Enter 10-digit mobile number"
              error={error}
              maxLength={10}
              className="text-lg"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {phone.length}/10 digits
            </p>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleGetOTP}
            disabled={phone.length !== 10 || isLoading}
          >
            <Phone className="h-5 w-5 mr-2" />
            {isLoading ? 'Sending...' : 'Get OTP'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSocialLogin('Google')}
              className="w-full"
            >
              <FcGoogle className="h-6 w-6 mr-2" />
              Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSocialLogin('Apple')}
              className="w-full"
            >
              <FaApple className="h-6 w-6 mr-2" />
              Apple
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;