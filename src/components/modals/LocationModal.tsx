import { MapPin, Navigation } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';
import { Button } from '../common/Button';

export const LocationModal = () => {
  const { showLocationModal, requestLocation } = useLocation();

  if (!showLocationModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <Navigation className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Enable Location Access</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use OOLALALA and find rides near you, we need access to your location. 
              This helps us show you the best available rides in your area.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-left text-foreground">
                Your location is required to access all features and pages
              </p>
            </div>
          </div>

          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={requestLocation}
          >
            <Navigation className="h-5 w-5 mr-2" />
            Enable Location
          </Button>

          <p className="text-xs text-muted-foreground">
            You can change this anytime in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
};
