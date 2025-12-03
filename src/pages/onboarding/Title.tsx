import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

type TitleType = 'Mr' | 'Miss' | 'Madam';

export const OnboardingTitle = () => {
  const [title, setTitle] = useState<TitleType | ''>('');
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const titles: { value: TitleType; label: string }[] = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Madam', label: 'Madam' },
  ];

  const handleNext = () => {
    if (!title) {
      toast.error('Please select how you would like to be addressed');
      return;
    }

    updateUser({ title });
    toast.success('Title saved!');
    navigate('/onboarding/password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <button
          onClick={() => navigate('/onboarding/dob')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <UserCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">How would you like to be addressed?</h1>
          <p className="text-muted-foreground">Choose your preferred title</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </div>

        <div className="space-y-3">
          {titles.map((item) => (
            <button
              key={item.value}
              onClick={() => setTitle(item.value)}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary hover:bg-primary/5',
                title === item.value
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-background'
              )}
            >
              <span className={cn(
                'text-lg font-semibold',
                title === item.value ? 'text-primary' : 'text-foreground'
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!title}
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingTitle;
