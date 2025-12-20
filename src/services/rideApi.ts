// services/rideApi.ts - CORRECTED VERSION
const BASE_URL = 'http://18.61.216.57:4500/api';

export interface Stop {
  stop_name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface FareSegment {
  from_stop_order: number;
  to_stop_order: number;
  fare: number;
  from_stop_name?: string;
  to_stop_name?: string;
}

export interface OfferRidePayload {
  origin: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  vehicle_id: number;
  seat_quantity: number;
  departureTime: string; // ISO string
  fare_details: {
    baseFare: number;
  };
  isNegotiable: boolean;
  is_full_car: boolean;
  status: 'published' | 'draft';
  stops: Stop[];
  fares: FareSegment[];
  route_polyline?: string;
  selected_route_id?: number;
  total_distance?: number;
  total_duration?: number;
}

export interface OfferRideResponse {
  instant_confirmed: boolean;
  activated_at: string;
  record_status: string;
  ride_id: number;
  partner_id: number;
  driver_id: number | null;
  vehicle_id: number;
  start_address: string;
  start_lat: number;
  start_lng: number;
  end_address: string;
  end_lat: number;
  end_lng: number;
  travel_datetime: string;
  total_seats: number;
  available_seats: number;
  is_negotiable: boolean;
  is_full_car: boolean;
  ride_status: string;
  draft_at: string;
  published_at: string;
  ride_created_by: string;
  created_by: number;
  created_at: string;
}

// Get auth token from localStorage or context
const getAuthToken = (): string | null => {
  // Try multiple possible token storage locations
  const tokenSources = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    sessionStorage.getItem('authToken'),
    sessionStorage.getItem('token')
  ];
  
  // Return the first valid token found
  for (const token of tokenSources) {
    if (token && token !== 'undefined' && token !== 'null') {
      // If we found a token in old location, migrate to new location
      if (token === localStorage.getItem('token') || token === sessionStorage.getItem('token')) {
        localStorage.setItem('authToken', token);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      console.log('Token found:', token.substring(0, 20) + '...');
      return token;
    }
  }
  
  console.log('No auth token found in any storage location');
  return null;
};

// Clear auth tokens (for logout)
export const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

// API request helper
const apiRequest = async (endpoint: string, method: string, body?: any, requiresAuth = true) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (requiresAuth) {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      clearAuthTokens();
      throw new Error('Your session has expired. Please login again.');
    }
    
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`API ${method} ${url}`, { requiresAuth, body });

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`API Response ${endpoint}:`, response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Details:', errorText);
    
    // Handle specific error codes
    if (response.status === 401) {
      clearAuthTokens();
      throw new Error('Your session has expired. Please login again.');
    }
    
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }
    
    // Try to parse error message
    let errorMessage = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
      
      // Handle backend-specific error messages
      if (errorMessage.includes('Token is invalid') || errorMessage.includes('token has expired')) {
        clearAuthTokens();
        throw new Error('Your session has expired. Please login again.');
      }
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log(`API Success ${endpoint}:`, data);
  return data;
};

export const offerRide = async (payload: OfferRidePayload): Promise<OfferRideResponse> => {
  try {
    console.log('Offering ride with payload:', payload);
    
    const response = await apiRequest('/rides/offer', 'POST', payload, true);
    
    return response;
  } catch (error: any) {
    console.error('Error in offerRide:', error);
    
    // Re-throw with more context if needed
    if (error.message.includes('Authentication required') || error.message.includes('session has expired')) {
      throw error; // Already has good message
    }
    
    throw new Error(`Failed to publish ride: ${error.message}`);
  }
};

export interface Vehicle {
  id: number;
  partner_id: number;
  driver_id: number | null;
  vehicle_code: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  manufacture_year: string | null;
  number_plate: string;
  color: string | null;
  seating_capacity: number;
  ownership_type: string;
  rc_number: string | null;
  rc_validity: string | null;
  rc_front_image_url: string | null;
  rc_back_image_url: string | null;
  insurance_number: string | null;
  insurance_validity: string | null;
  insurance_image_url: string | null;
  fitness_certificate_number: string | null;
  fitness_certificate_validity: string | null;
  fitness_certificate_image_url: string | null;
  verification_status: 'pending' | 'verified' | 'approved' | 'rejected';
  verified_datetime: string | null;
  rejected_datetime: string | null;
  verifier_id: number | null;
  rejected_by: number | null;
  record_status: string;
  morevehicle_details: any | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    console.log('Fetching vehicles...');
    
    // Try profile endpoint first
    let response;
    try {
      response = await apiRequest('/profile/vehicles', 'GET', undefined, true);
    } catch (error: any) {
      // If profile endpoint fails, try the regular endpoint
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Profile endpoint failed, trying regular vehicles endpoint...');
        response = await apiRequest('/vehicles', 'GET', undefined, true);
      } else {
        throw error;
      }
    }
    
    // Handle different response structures
    let vehicles: Vehicle[] = [];
    
    if (Array.isArray(response)) {
      vehicles = response;
    } else if (response.data && Array.isArray(response.data)) {
      vehicles = response.data;
    } else if (response.vehicles && Array.isArray(response.vehicles)) {
      vehicles = response.vehicles;
    } else {
      console.warn('Unexpected vehicles response structure:', response);
      vehicles = [];
    }
    
    console.log(`Loaded ${vehicles.length} vehicles`);
    return vehicles;
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    
    // If it's an auth error, re-throw it
    if (error.message.includes('Authentication required') || 
        error.message.includes('session has expired') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
      throw error;
    }
    
    // For other errors, return empty array but log it
    return [];
  }
};

// Get a single vehicle by ID
export const fetchVehicleById = async (vehicleId: number): Promise<Vehicle | null> => {
  try {
    const response = await apiRequest(`/profile/vehicles/${vehicleId}`, 'GET', undefined, true);
    return response;
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    return null;
  }
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  return await apiRequest('/profile/vehicles', 'POST', vehicleData, true);
};

// Verify token validity with backend
export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return false;
    }
    
    // Try a lightweight endpoint to verify token
    await apiRequest('/auth/verify-token', 'GET', undefined, true);
    return true;
  } catch {
    return false;
  }
};

// Refresh token if available
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }
    
    const response = await apiRequest('/auth/refresh-token', 'POST', { refresh_token: refreshToken }, false);
    
    if (response.access_token) {
      localStorage.setItem('authToken', response.access_token);
      return response.access_token;
    }
    
    return null;
  } catch {
    return null;
  }
};