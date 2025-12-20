// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

export const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { requestOTP } = useAuth();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  const handleResetPIN = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      toast.error('Invalid mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const success = await requestOTP(phone, 'password_reset');
      
      if (success) {
        sessionStorage.setItem('resetPhone', phone);
        navigate('/verify-login-otp');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Login
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Reset PIN</h1>
          <p className="text-muted-foreground">Enter your mobile number to reset your PIN</p>
        </div>

        <div className="space-y-6">
          <div>
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
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              {phone.length}/10 digits
            </p>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleResetPIN}
            disabled={phone.length !== 10 || isLoading}
          >
            <Phone className="h-5 w-5 mr-2" />
            {isLoading ? 'Sending...' : 'Get OTP'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your PIN?{" "}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Login here
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          We'll send an OTP to verify your identity
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;