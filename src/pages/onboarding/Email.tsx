import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';

export const OnboardingEmail = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateUser, completeOnboarding } = useAuth();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleComplete = () => {
    // Email is optional
    if (email && !validateEmail(email)) {
      setError('Please enter a valid email address');
      toast.error('Invalid email address');
      return;
    }

    if (email) {
      updateUser({ email });
    }
    
    completeOnboarding();
    navigate('/');
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/onboarding/role')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Add your email</h1>
          <p className="text-muted-foreground">
            Optional - Get ride updates and offers via email
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            label="Email Address (Optional)"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            error={error}
          />

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                No password required for email. You can skip this step and add it later in your profile.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleComplete}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Complete Setup
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleSkip}
          >
            Skip for now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingEmail;
