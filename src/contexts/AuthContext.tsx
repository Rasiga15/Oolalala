// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { messaging, VAPID_KEY } from '../config/firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';

interface UserData {
  phone: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  title?: 'Mr' | 'Miss' | 'Madam';
  password?: string;
  role?: 'rider' | 'partner' | 'both';
  email?: string;
  isOnboarded: boolean;
  isGuest?: boolean;
  fcmToken?: string;
  deviceId?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  enterGuestMode: () => Promise<void>;
  updateUser: (data: Partial<UserData>) => void;
  completeOnboarding: () => void;
  fcmToken: string | null;
  deviceId: string | null;
  isFcmSupported: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isFcmSupported, setIsFcmSupported] = useState(false);

  // Generate or get device ID
  const getOrCreateDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Check FCM support and initialize
  useEffect(() => {
    const initializeAppData = async () => {
      // Set device ID first
      const storedDeviceId = getOrCreateDeviceId();
      setDeviceId(storedDeviceId);

      // Check for existing user data
      const storedUser = localStorage.getItem('userData');
      const guestStatus = localStorage.getItem('isGuest');
      const storedFcmToken = localStorage.getItem('fcmToken');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      if (guestStatus === 'true') {
        setIsGuest(true);
        setIsAuthenticated(true);
      }

      if (storedFcmToken) {
        setFcmToken(storedFcmToken);
      }

      // Check FCM support
      try {
        const supported = await isSupported();
        setIsFcmSupported(supported);
        
        if (supported && messaging) {
          console.log('FCM is supported, initializing...');
          await initializeFCM();
        } else {
          console.warn('FCM is not supported in this environment');
        }
      } catch (error) {
        console.error('Error checking FCM support:', error);
        setIsFcmSupported(false);
      }
      
      console.log('App initialized with:', {
        user: storedUser ? JSON.parse(storedUser) : null,
        fcmToken: storedFcmToken,
        deviceId: storedDeviceId,
        isFcmSupported
      });
    };

    initializeAppData();
  }, []);

  // Initialize FCM with proper error handling
  const initializeFCM = async (): Promise<string | null> => {
    if (!messaging) {
      console.log('Messaging not available');
      return null;
    }

    try {
      console.log('Starting FCM initialization...');

      // Check for existing token first
      const existingToken = localStorage.getItem('fcmToken');
      if (existingToken) {
        console.log('Using existing FCM token');
        setFcmToken(existingToken);
        
        // Set up foreground message listener
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          toast.info(payload.notification?.title || 'New notification');
        });
        
        return existingToken;
      }

      // Register service worker
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered successfully');

        // Wait for service worker to be ready
        if (registration.installing) {
          await new Promise<void>((resolve) => {
            const worker = registration.installing;
            if (worker) {
              worker.addEventListener('statechange', () => {
                if (worker.state === 'activated') {
                  resolve();
                }
              });
            } else {
              resolve();
            }
          });
        }
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        return null;
      }

      // Request notification permission
      let permission = Notification.permission;
      if (permission === 'default') {
        console.log('Requesting notification permission...');
        permission = await Notification.requestPermission();
      }
      console.log('Notification permission:', permission);

      if (permission !== 'granted') {
        console.log('Notification permission not granted:', permission);
        return null;
      }

      console.log('Getting FCM token...');
      
      // Get FCM token
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        console.log('FCM token obtained successfully');
        setFcmToken(currentToken);
        localStorage.setItem('fcmToken', currentToken);
        
        // Set up foreground message listener
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          toast.info(payload.notification?.title || 'New notification');
        });
        
        return currentToken;
      } else {
        console.log('No FCM token available - check VAPID key configuration');
        return null;
      }
    } catch (error) {
      console.error('Error in FCM initialization:', error);
      return null;
    }
  };

  // Get FCM token with retry mechanism
  const getFcmTokenWithRetry = async (retries = 2): Promise<string | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`FCM token attempt ${i + 1}/${retries}`);
        const token = await initializeFCM();
        if (token) {
          console.log('FCM token obtained successfully');
          return token;
        }
        
        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`FCM token attempt ${i + 1} failed:`, error);
      }
    }
    
    console.log('All FCM token attempts failed');
    return null;
  };

  const login = async (phone: string) => {
    try {
      console.log('Starting login process for phone:', phone);
      
      // Get FCM token (but don't block login if it fails)
      let token = fcmToken;
      if (!token) {
        console.log('No existing FCM token, attempting to get one...');
        token = await getFcmTokenWithRetry();
      }

      const userData: UserData = {
        phone,
        isOnboarded: false,
        isGuest: false,
        fcmToken: token || undefined,
        deviceId: deviceId || undefined,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.removeItem('isGuest');

      console.log('User logged in successfully with:', {
        phone,
        fcmToken: token ? 'Yes' : 'No',
        deviceId
      });

      // Send user data to backend (non-blocking)
      sendUserDataToBackend(userData);

    } catch (error) {
      console.error('Login error:', error);
      // Even if FCM fails, continue with login
      const userData: UserData = {
        phone,
        isOnboarded: false,
        isGuest: false,
        deviceId: deviceId || undefined,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.removeItem('isGuest');
    }
  };

  const enterGuestMode = async () => {
    try {
      let token = fcmToken;
      if (!token) {
        token = await getFcmTokenWithRetry();
      }

      const guestUser: UserData = {
        phone: 'guest',
        isOnboarded: true,
        isGuest: true,
        fcmToken: token || undefined,
        deviceId: deviceId || undefined,
      };
      
      setUser(guestUser);
      setIsAuthenticated(true);
      setIsGuest(true);
      localStorage.setItem('userData', JSON.stringify(guestUser));
      localStorage.setItem('isGuest', 'true');
      
      console.log('Guest mode entered with:', {
        fcmToken: token ? 'Yes' : 'No',
        deviceId
      });

      sendUserDataToBackend(guestUser);
      toast.success('Entering guest mode');
    } catch (error) {
      console.error('Guest mode error:', error);
      // Fallback without FCM token
      const guestUser: UserData = {
        phone: 'guest',
        isOnboarded: true,
        isGuest: true,
        deviceId: deviceId || undefined,
      };
      
      setUser(guestUser);
      setIsAuthenticated(true);
      setIsGuest(true);
      localStorage.setItem('userData', JSON.stringify(guestUser));
      localStorage.setItem('isGuest', 'true');
      toast.success('Entering guest mode');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(false);
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('fcmToken');
    toast.success('Logged out successfully');
  };

  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      sendUserDataToBackend(updatedUser);
    }
  };

  const completeOnboarding = () => {
    if (user) {
      const updatedUser = { ...user, isOnboarded: true };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      sendUserDataToBackend(updatedUser);
      toast.success('Profile completed successfully!');
    }
  };

  // Function to send user data to backend
  const sendUserDataToBackend = async (userData: UserData) => {
    try {
      console.log('Sending user data to backend:', {
        phone: userData.phone,
        fcmToken: userData.fcmToken,
        deviceId: userData.deviceId,
        isGuest: userData.isGuest,
        isOnboarded: userData.isOnboarded,
        timestamp: new Date().toISOString()
      });

      // TODO: Replace with your actual backend endpoint
      // const response = await fetch('https://your-backend.com/api/users/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData)
      // });

      console.log('User data synced with backend successfully');
    } catch (error) {
      console.error('Error syncing user data with backend:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isGuest,
      login, 
      logout, 
      enterGuestMode,
      updateUser, 
      completeOnboarding,
      fcmToken,
      deviceId,
      isFcmSupported
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};