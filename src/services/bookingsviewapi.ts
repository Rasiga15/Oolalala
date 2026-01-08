import { BASE_URL } from '../config/api';

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

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
};

export interface Booking {
  booking_id: number;
  booking_number: string;
  booking_status: string;
  created_at: string;
  seats_booked: number;
  total_fare: string;
  final_fare: string;
  pickup_otp: string | null;
  drop_otp: string | null;
  current_turn: string | null;
  is_my_turn: boolean;
  your_current_role: string;
  delay_info: any | null;
  ride_details: {
    ride_id: number;
    is_full_car: boolean;
    travel_datetime: string;
    status: string;
  };
  route: {
    distance: string;
    duration: string | null;
    from: {
      name: string;
      time: string;
    };
    to: {
      name: string;
      time: string;
    };
  };
  rider_details: {
    id: number;
    name: string;
    profile_image_url: string;
    mobile_number: string;
  };
  driver_details: {
    id: number;
    name: string;
    profile_image_url: string;
  };
}

export interface MyBookingsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  bookings: Booking[];
}

export interface VerifyPickupRequest {
  pickup_otp: string;
  started_lat: number;
  started_lng: number;
}

export interface VerifyPickupResponse {
  message: string;
  dropOtp: string;
}

export interface VerifyDropRequest {
  drop_otp: string;
  completed_lat: number;
  completed_lng: number;
}

export interface VerifyDropResponse {
  message: string;
}




const apiRequest = async (endpoint: string, method: string, body?: any, params?: Record<string, any>, requiresAuth = true) => {
  // Construct URL with query parameters
  let url = `${BASE_URL}${endpoint}`;
  
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
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

  console.log(`API ${method} ${url}`, body);

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

// Get bookings for a specific ride (as partner) - WITH RIDE_ID FILTER
export const getBookingsForRide = async (
  rideId: number, 
  status?: string, 
  page: number = 1, 
  limit: number = 10
): Promise<MyBookingsResponse> => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
      as_partner: true,
      ride_id: rideId  // Add ride_id parameter directly
    };
    
    if (status) {
      params.status = status;
    }
    
    const response = await apiRequest('/api/bookings/my-bookings', 'GET', undefined, params, true);
    
    return response;
  } catch (error: any) {
    console.error('Error fetching bookings for ride:', error);
    throw error;
  }
};

// Get all my bookings (as partner)
export const getMyBookings = async (
  page: number = 1, 
  limit: number = 10,
  status?: string,
  asPartner: boolean = true,
  rideId?: number  // Optional ride_id parameter
): Promise<MyBookingsResponse> => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
      as_partner: asPartner
    };
    
    if (status) {
      params.status = status;
    }
    
    if (rideId) {
      params.ride_id = rideId;
    }
    
    return await apiRequest('/api/bookings/my-bookings', 'GET', undefined, params, true);
  } catch (error: any) {
    console.error('Error fetching my bookings:', error);
    throw error;
  }
};

// Get pending bookings
export const getPendingBookings = async (
  page: number = 1, 
  limit: number = 10,
  rideId?: number
): Promise<MyBookingsResponse> => {
  return getMyBookings(page, limit, 'pending', true, rideId);
};

// Get confirmed bookings
export const getConfirmedBookings = async (
  page: number = 1, 
  limit: number = 10,
  rideId?: number
): Promise<MyBookingsResponse> => {
  return getMyBookings(page, limit, 'confirmed', true, rideId);
};

// Verify Pickup OTP
export const verifyPickupOtp = async (
  bookingId: number,
  data: VerifyPickupRequest
): Promise<VerifyPickupResponse> => {
  try {
    return await apiRequest(`/api/bookings/${bookingId}/verify-pickup`, 'POST', data, undefined, true);
  } catch (error: any) {
    console.error('Error verifying pickup OTP:', error);
    throw error;
  }
};

// Verify Drop OTP
export const verifyDropOtp = async (
  bookingId: number,
  data: VerifyDropRequest
): Promise<VerifyDropResponse> => {
  try {
    return await apiRequest(`/api/bookings/${bookingId}/verify-drop`, 'POST', data, undefined, true);
  } catch (error: any) {
    console.error('Error verifying drop OTP:', error);
    throw error;
  }
};

// Format booking status for display
export const formatBookingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'payment_pending': 'Pending Payment',
    'negotiation_pending': 'Negotiating',
    'confirmed': 'Confirmed',
    'auto_declined': 'Auto Declined',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'ongoing': 'Ongoing'
  };
  
  return statusMap[status] || status.replace('_', ' ');
};