import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Car, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

type RoleType = 'rider' | 'partner' | 'both';

export const OnboardingRole = () => {
  const [role, setRole] = useState<RoleType | ''>('');
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const roles: { value: RoleType; label: string; icon: any; description: string }[] = [
    { value: 'rider', label: 'Rider', icon: User, description: 'I want to find rides' },
    { value: 'partner', label: 'Partner', icon: Car, description: 'I want to offer rides' },
    { value: 'both', label: 'Both', icon: Users, description: 'I want to do both' },
  ];

  const handleNext = () => {
    if (!role) {
      toast.error('Please select your role');
      return;
    }

    updateUser({ role });
    toast.success('Role selected!');
    navigate('/onboarding/email');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/onboarding/password')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Users className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Select your role</h1>
          <p className="text-muted-foreground">How will you use OOLALALA?</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </div>

        <div className="space-y-3">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => setRole(item.value)}
                className={cn(
                  'w-full p-5 rounded-lg border-2 transition-all duration-200',
                  'hover:border-primary hover:bg-primary/5',
                  role === item.value
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-background'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-lg',
                    role === item.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className={cn(
                      'text-lg font-semibold',
                      role === item.value ? 'text-primary' : 'text-foreground'
                    )}>
                      {item.label}
                    </div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!role}
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingRole;
