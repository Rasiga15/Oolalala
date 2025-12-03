import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';

export const OnboardingName = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState({ firstName: '', lastName: '' });
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handleNext = () => {
    const newErrors = { firstName: '', lastName: '' };
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (newErrors.firstName || newErrors.lastName) {
      setErrors(newErrors);
      toast.error('Please fill in all fields');
      return;
    }

    updateUser({ firstName: firstName.trim(), lastName: lastName.trim() });
    toast.success('Name saved!');
    navigate('/onboarding/dob');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">What is your name?</h1>
          <p className="text-muted-foreground">Let's get to know you better</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setErrors({ ...errors, firstName: '' });
            }}
            error={errors.firstName}
          />
          <Input
            type="text"
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setErrors({ ...errors, lastName: '' });
            }}
            error={errors.lastName}
          />
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleNext}
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingName;
