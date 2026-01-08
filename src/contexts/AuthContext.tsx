// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../config/api';

interface UserData {
  id?: number;
  phone: string;
  mobile_number?: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  role?: 'rider' | 'partner' | 'both';
  isOnboarded: boolean;
  isGuest?: boolean;
  token?: string;
  profile_image_url?: string | null;
  wallet_balance?: string;
  vehicle_category?: string | null;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  requestOTP: (mobileNumber: string, purpose: 'login' | 'register' | 'verify_mobile' | 'password_reset') => Promise<boolean>;
  verifyOTPAndRegister: (phone: string, otp: string, pin: string, userData?: Partial<UserData>) => Promise<boolean>;
  verifyOTPAndResetPin: (phone: string, otp: string, newPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string, confirmNewPin: string) => Promise<boolean>;
  updateUser: (data: Partial<UserData>) => void;
  completeOnboarding: () => void;
  fetchUserProfile: () => Promise<UserData | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate or get device ID
  const getOrCreateDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Get device information
  const getDeviceInfo = () => {
    return {
      device_id: getOrCreateDeviceId(),
      device_model: navigator.userAgent,
      mac_address: 'unknown',
      location_lat: 0,
      location_lng: 0
    };
  };

  // API Request Helper
  const apiRequest = async (endpoint: string, method: string, body?: any, authToken?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`API ${method} ${endpoint}: Status ${response.status}`, body);

      if (!response.ok) {
        const text = await response.text();
        console.error(`API Error ${endpoint}:`, text);
        
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (text) {
            errorMessage = text;
          }
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Request Error (${endpoint}):`, error);
      throw error;
    }
  };

  // Helper function to handle null/undefined values
  const safeValue = (value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return String(value).trim();
  };

  // Helper function to generate default name
  const generateDefaultName = () => {
    return `New${Math.floor(Math.random() * 10000)}`;
  };

  // Check for existing user data on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('userData');
        const storedToken = localStorage.getItem('authToken');
        const guestStatus = localStorage.getItem('isGuest');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          
          // Verify token validity with backend
          try {
            const response = await apiRequest('/api/auth/verify-token', 'GET', undefined, storedToken);
            
            if (response.valid) {
              setUser(userData);
              setIsAuthenticated(true);
              console.log('✅ User restored from localStorage');
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('userData');
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              console.log('❌ Token invalid, clearing storage');
            }
          } catch (error) {
            console.log('❌ Token verification failed:', error);
            // Still allow user to stay logged in, backend might be down
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else if (guestStatus === 'true') {
          setIsGuest(true);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Request OTP with correct purpose
  const requestOTP = async (
    mobileNumber: string, 
    purpose: 'login' | 'register' | 'verify_mobile' | 'password_reset'
  ): Promise<boolean> => {
    try {
      console.log('Requesting OTP for:', mobileNumber, 'purpose:', purpose);
      
      const response = await apiRequest('/api/auth/request-otp', 'POST', {
        mobile_number: mobileNumber,
        purpose
      });

      console.log('OTP Response:', response);

      if (response.message === 'OTP sent') {
        toast.success('OTP sent successfully! Check your phone.');
        return true;
      }
      
      toast.error('Failed to send OTP');
      return false;
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      toast.error(error.message || 'Failed to send OTP');
      return false;
    }
  };

  // Login with PIN - UPDATED to handle null values
  const login = async (phone: string, pin: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', phone);
      
      const deviceInfo = getDeviceInfo();
      
      const response = await apiRequest('/api/auth/login-pin', 'POST', {
        identifier: phone,
        pin_code: pin,
        device_id: deviceInfo.device_id,
        device_model: deviceInfo.device_model,
        mac_address: deviceInfo.mac_address,
        location_lat: deviceInfo.location_lat,
        location_lng: deviceInfo.location_lng
      });

      console.log('Login response:', response);

      if (response.accessToken && response.user) {
        const userData: UserData = {
          id: response.user.id,
          phone: response.user.mobile_number || phone,
          mobile_number: response.user.mobile_number || phone,
          first_name: safeValue(response.user.first_name, generateDefaultName()),
          last_name: safeValue(response.user.last_name, 'User'),
          email_address: response.user.email_address || '',
          gender: response.user.gender || null,
          date_of_birth: response.user.date_of_birth || null,
          role: response.user.role || 'rider',
          profile_image_url: response.user.profile_image_url || null,
          wallet_balance: response.user.wallet_balance || '0',
          vehicle_category: response.user.vehicle_category || null,
          isOnboarded: response.user.is_onboarded || true,
          token: response.accessToken
        };

        console.log('Parsed user data:', userData);

        setUser(userData);
        setIsAuthenticated(true);
        setIsGuest(false);
        
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('authToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        localStorage.removeItem('isGuest');

        const displayName = userData.first_name || userData.phone;
        console.log('✅ Login successful');
        toast.success(`Welcome!`);
        return true;
      }
      
      toast.error('Login failed. Invalid response from server.');
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message.includes('User not found')) {
        toast.error('User not found. Please sign up first.');
      } else if (error.message.includes('Invalid PIN')) {
        toast.error('Invalid PIN. Please try again.');
      } else if (error.message.includes('not verified')) {
        toast.error('Account not verified. Please complete registration.');
      } else if (error.message.includes('suspended')) {
        toast.error('Account is suspended. Please contact support.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
      
      return false;
    }
  };

  // Verify OTP and Register - FIXED: Handle null values properly
  const verifyOTPAndRegister = async (
    phone: string, 
    otp: string, 
    pin: string, 
    userData?: Partial<UserData>
  ): Promise<boolean> => {
    try {
      console.log('Registering user with:', { phone, otp, userData });
      
      // Prepare registration data with proper null handling
      const registrationData: any = {
        mobile_number: phone,
        otp_code: otp,
        pin_code: pin
      };

      // Handle first_name - don't send if it's null or empty
      if (userData?.first_name && userData.first_name.trim()) {
        registrationData.first_name = userData.first_name.trim();
      } else {
        // Don't send first_name at all if empty
        // Backend will handle default value
      }

      // Handle last_name - don't send if it's null or empty
      if (userData?.last_name && userData.last_name.trim()) {
        registrationData.last_name = userData.last_name.trim();
      }

      // Only include email if provided and not empty
      if (userData?.email_address && userData.email_address.trim()) {
        registrationData.email_address = userData.email_address.trim();
      }

      // Only include gender if provided and not empty
      if (userData?.gender && userData.gender.trim()) {
        registrationData.gender = userData.gender.trim();
      }

      console.log('Sending registration data:', registrationData);
      
      const response = await apiRequest('/api/auth/register-pin', 'POST', registrationData);

      console.log('Registration response:', response);

      if (response.user) {
        // Auto login after successful registration
        const loginSuccess = await login(phone, pin);
        if (loginSuccess) {
          const displayName = response.user.first_name || phone;
        
        } else {
          toast.success('Registration successful! Please login.');
        }
        return true;
      }
      
      toast.error('Registration failed');
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already registered')) {
        toast.error('This mobile number is already registered. Please login.');
      } else if (error.message.includes('Invalid OTP')) {
        toast.error('Invalid OTP. Please try again.');
      } else if (error.message.includes('expired')) {
        toast.error('OTP has expired. Please request a new one.');
      } else if (error.message.includes('"gender" is not allowed')) {
        toast.error('Registration error: Invalid field provided.');
      } else if (error.message.includes('first_name')) {
        toast.error('First name is required');
      } else if (error.message.includes('last_name')) {
        toast.error('Last name is required');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
      
      return false;
    }
  };

  // Verify OTP and Reset PIN
  const verifyOTPAndResetPin = async (phone: string, otp: string, newPin: string): Promise<boolean> => {
    try {
      console.log("Resetting PIN for:", { phone, otp, newPin });
      
      const response = await apiRequest('/api/auth/reset-pin', 'POST', {
        identifier: phone,
        otp_code: otp,
        new_pin_code: newPin
      });

      console.log('Reset PIN response:', response);

      if (response.message?.includes('successfully') || response.success) {
        toast.success('PIN reset successfully!');
        return true;
      }
      
      toast.error(response.message || 'Failed to reset PIN');
      return false;
    } catch (error: any) {
      console.error('Reset PIN error:', error);
      
      // Handle specific error messages
      if (error.message.includes('"new_pin_code" is not allowed to be empty')) {
        toast.error('Please enter a new PIN');
      } else if (error.message.includes('Invalid OTP')) {
        toast.error('Invalid OTP. Please try again.');
      } else if (error.message.includes('User not found')) {
        toast.error('User not found. Please check your mobile number.');
      } else {
        toast.error(error.message || 'Failed to reset PIN');
      }
      
      return false;
    }
  };

  // Change PIN (for authenticated users)
  const changePin = async (currentPin: string, newPin: string, confirmNewPin: string): Promise<boolean> => {
    try {
      if (!user?.token) {
        toast.error('Please login first');
        return false;
      }

      if (newPin !== confirmNewPin) {
        toast.error('New PIN and confirm PIN do not match');
        return false;
      }

      const response = await apiRequest('/api/auth/change-pin', 'POST', {
        current_pin_code: currentPin,
        new_pin_code: newPin,
        confirm_new_pin_code: confirmNewPin
      }, user.token);

      if (response.message?.includes('successfully')) {
        toast.success('PIN changed successfully!');
        return true;
      }
      
      toast.error('Failed to change PIN');
      return false;
    } catch (error: any) {
      console.error('Change PIN error:', error);
      toast.error(error.message || 'Failed to change PIN');
      return false;
    }
  };

  // Fetch user profile from backend - UPDATED to handle null values
  const fetchUserProfile = async (): Promise<UserData | null> => {
    try {
      if (!user?.token) {
        console.log('No auth token available');
        return user;
      }

      console.log('🔍 Fetching user profile...');
      
      try {
        const response = await apiRequest('/api/profile', 'GET', undefined, user.token);
        
        if (response.user) {
          const updatedUserData: UserData = {
            ...user,
            first_name: safeValue(response.user.first_name, user.first_name || generateDefaultName()),
            last_name: safeValue(response.user.last_name, user.last_name || 'User'),
            email_address: response.user.email_address || user.email_address || '',
            gender: response.user.gender || user.gender || null,
            date_of_birth: response.user.date_of_birth || user.date_of_birth || null,
            profile_image_url: response.user.profile_image_url || user.profile_image_url || null,
            wallet_balance: response.user.wallet_balance || user.wallet_balance || '0',
            vehicle_category: response.user.vehicle_category || user.vehicle_category || null,
          };
          
          setUser(updatedUserData);
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          console.log('✅ User profile updated:', updatedUserData);
          return updatedUserData;
        }
      } catch (profileError) {
        console.log('⚠️ Profile fetch failed, using cached data:', profileError);
      }
      
      return user;
      
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return user;
    }
  };

  // Update user data - UPDATED to handle null values
  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        ...data
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      console.log('User updated:', updatedUser);
    }
  };

  const completeOnboarding = () => {
    if (user) {
      const updatedUser = { 
        ...user, 
        isOnboarded: true
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      console.log('Onboarding completed:', updatedUser);
      toast.success('Profile completed successfully!');
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clear all auth-related data
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(false);
    
    // Clear localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isGuest');
    // Keep deviceId for future logins
    
    toast.success('Logged out successfully!');
    console.log('✅ User logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isGuest,
      login, 
      logout, 
      requestOTP,
      verifyOTPAndRegister,
      verifyOTPAndResetPin,
      changePin,
      updateUser, 
      completeOnboarding,
      fetchUserProfile,
      loading
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