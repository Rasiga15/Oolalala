// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setPhoneError('');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setPin(value);
      setPinError('');
    }
  };

  const handleLogin = async () => {
    let isValid = true;

    // Validate phone
    if (phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      toast.error('Invalid mobile number');
      isValid = false;
    }

    // Validate PIN (6 digits)
    if (pin.length !== 6) {
      setPinError('Please enter a valid 6-digit PIN');
      toast.error('Invalid PIN');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const loginSuccess = await login(phone, pin);
      
      if (loginSuccess) {
        // Navigate to home page on successful login
        navigate('/');
      }
      // If login fails, error is shown by the login function
      
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Welcome to OOLALALA</h1>
          <p className="text-muted-foreground">Enter your mobile number and PIN to login</p>
        </div>

        <div className="space-y-6">
          {/* Mobile Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mobile Number</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className={`w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  phoneError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
            <p className="text-xs text-muted-foreground">
              {phone.length}/10 digits
            </p>
          </div>

          {/* PIN Input (6 digits) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">PIN (6 digits)</label>
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
            <p className="text-xs text-muted-foreground">
              {pin.length}/6 digits
            </p>
          </div>

          {/* Login Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleLogin}
            disabled={phone.length !== 10 || pin.length !== 6 || isLoading}
          >
            <Lock className="h-5 w-5 mr-2" />
            {isLoading ? 'Logging in...' : 'Login'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          {/* New User? Signup and Forgot Password in same row */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleSignup}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              New user? Signup
            </button>
            
            <button
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Forgot PIN?
            </button>
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