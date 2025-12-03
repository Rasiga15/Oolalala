import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  hasLocationPermission: boolean;
  showLocationModal: boolean;
  requestLocation: () => void;
  closeLocationModal: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);

  useEffect(() => {
    checkLocationPermission();

    // Check location permission every 3 seconds
    const interval = setInterval(checkLocationPermission, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setHasLocationPermission(true);
          setShowLocationModal(false);
        } else {
          setHasLocationPermission(false);
          setShowLocationModal(true);
        }
      }).catch(() => {
        // Fallback: try to get current position
        navigator.geolocation.getCurrentPosition(
          () => {
            setHasLocationPermission(true);
            setShowLocationModal(false);
          },
          () => {
            setHasLocationPermission(false);
            setShowLocationModal(true);
          }
        );
      });
    }
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setHasLocationPermission(true);
          setShowLocationModal(false);
        },
        (error) => {
          console.error('Location permission denied:', error);
          setHasLocationPermission(false);
          setShowLocationModal(true);
        }
      );
    }
  };

  const closeLocationModal = () => {
    if (hasLocationPermission) {
      setShowLocationModal(false);
    }
  };

  return (
    <LocationContext.Provider value={{ hasLocationPermission, showLocationModal, requestLocation, closeLocationModal }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
