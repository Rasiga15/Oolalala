
const BASE_URL = 'https://api-dev.oolalala.com/api';

export interface Stop {
  stop_name: string;
  latitude: number;
  longitude: number;
  address?: string;
  total_duration?: string;
}

export interface FareSegment {
  from_stop_order: number;
  to_stop_order: number;
  fare: number;
  duration?: string;
  total_distance_km?: number;
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
  driver_id: number; // IMPORTANT: This must be included
  seat_quantity: number;
  departureTime: string; // ISO string
  fare_details: {
    baseFare: number;
  };
  isNegotiable: boolean;
  is_full_car: boolean;
  status: 'published' | 'draft';
  stops?: Stop[]; // For shared rides: should include ALL stops in order
  fares?: FareSegment[]; // For shared rides: sequential segments only (1→2, 2→3, etc.)
  total_distance?: number;
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

const getAuthToken = (): string | null => {
  const tokenSources = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    sessionStorage.getItem('authToken'),
    sessionStorage.getItem('token')
  ];
  
  for (const token of tokenSources) {
    if (token && token !== 'undefined' && token !== 'null') {
      if (token === localStorage.getItem('token') || token === sessionStorage.getItem('token')) {
        localStorage.setItem('authToken', token);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      return token;
    }
  }
  
  return null;
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

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
    
    let errorMessage = `API Error (${response.status}): ${response.statusText}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || errorMessage;
      
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

// CORRECTED: Updated to handle proper stop order
export const offerRide = async (payload: OfferRidePayload): Promise<OfferRideResponse> => {
  try {
    console.log('Offering ride with payload:', payload);
    
    // Clean payload to match expected structure
    const processedPayload: any = {
      origin: {
        address: payload.origin.address,
        coordinates: payload.origin.coordinates // Should be [longitude, latitude]
      },
      destination: {
        address: payload.destination.address,
        coordinates: payload.destination.coordinates
      },
      vehicle_id: payload.vehicle_id,
      driver_id: payload.driver_id, // CRITICAL: Must be included
      seat_quantity: payload.seat_quantity,
      departureTime: payload.departureTime,
      fare_details: payload.fare_details,
      isNegotiable: payload.isNegotiable,
      is_full_car: payload.is_full_car,
      status: payload.status
    };
    
    // Add distance field
    if (payload.total_distance !== undefined) {
      processedPayload.total_distance = payload.total_distance;
    }
    
    // For shared rides: include stops and fares
    if (!payload.is_full_car) {
      // IMPORTANT: The backend expects all stops in sequential order
      if (payload.stops && payload.stops.length > 0) {
        // Ensure stops have required fields and correct order
        const stops = payload.stops.map((stop, index) => ({
          stop_name: stop.stop_name || `Stop ${index + 1}`,
          latitude: stop.latitude,
          longitude: stop.longitude,
          address: stop.address || stop.stop_name,
          total_duration: stop.total_duration || "0"
        }));
        processedPayload.stops = stops;
      }
      
      // IMPORTANT: The backend expects sequential fare segments only
      // (1→2, 2→3, 3→4, etc.) - NOT all combinations
      if (payload.fares && payload.fares.length > 0) {
        // Validate that fares are sequential
        const invalidFares = payload.fares.filter(fare => 
          fare.to_stop_order - fare.from_stop_order !== 1
        );
        
        if (invalidFares.length > 0) {
          console.warn('Non-sequential fares detected:', invalidFares);
          // You might want to filter these out or throw an error
        }
        
        processedPayload.fares = payload.fares;
      }
    }
    
    console.log('Processed payload for API:', JSON.stringify(processedPayload, null, 2));
    
    const response = await apiRequest('/rides/offer', 'POST', processedPayload, true);
    
    return response;
  } catch (error: any) {
    console.error('Error in offerRide:', error);
    
    if (error.message.includes('Authentication required') || error.message.includes('session has expired')) {
      throw error;
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

export const fetchVerifiedVehicles = async (): Promise<Vehicle[]> => {
  try {
    console.log('Fetching verified vehicles...');
    
    let response;
    try {
      response = await apiRequest('/profile/vehicles', 'GET', undefined, true);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Profile endpoint failed, trying regular vehicles endpoint...');
        response = await apiRequest('/vehicles', 'GET', undefined, true);
      } else {
        throw error;
      }
    }
    
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
    
    const verifiedVehicles = vehicles.filter(vehicle => 
      vehicle.verification_status === 'verified' || vehicle.verification_status === 'approved'
    );
    
    console.log(`Loaded ${vehicles.length} vehicles, ${verifiedVehicles.length} verified`);
    return verifiedVehicles;
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    
    if (error.message.includes('Authentication required') || 
        error.message.includes('session has expired') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
      throw error;
    }
    
    return [];
  }
};

export const fetchAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    console.log('Fetching all vehicles...');
    
    let response;
    try {
      response = await apiRequest('/profile/vehicles', 'GET', undefined, true);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Profile endpoint failed, trying regular vehicles endpoint...');
        response = await apiRequest('/vehicles', 'GET', undefined, true);
      } else {
        throw error;
      }
    }
    
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
    console.error('Error fetching all vehicles:', error);
    return [];
  }
};

export const fetchVehicleById = async (vehicleId: number): Promise<Vehicle | null> => {
  try {
    const response = await apiRequest(`/profile/vehicles/${vehicleId}`, 'GET', undefined, true);
    return response;
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    return null;
  }
};

export const addVehicle = async (vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
  return await apiRequest('/profile/vehicles', 'POST', vehicleData, true);
};

export const verifyToken = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return false;
    }
    
    await apiRequest('/auth/verify-token', 'GET', undefined, true);
    return true;
  } catch {
    return false;
  }
};

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