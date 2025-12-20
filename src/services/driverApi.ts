const BASE_URL = 'http://18.61.216.57:4500/api';

export interface Driver {
  id: number;
  user_id: number;
  driver_code: string;
  partner_id: number;
  travel_agent_id: number | null;
  average_rating: string;
  record_status: string;
  created_by: number;
  updated_by: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    mobile_number: string;
    email_address: string;
    gender: string;
    date_of_birth: string;
    fcm_token: string | null;
    is_verified: boolean;
    is_email_verified: boolean;
    role: string;
    publish_ride: boolean;
    working_professional: string | null;
    referral_code: string | null;
    referred_by: string | null;
    profile_image_url: string | null;
    profile_image_verification_status: string;
    profile_image_verified_by: string | null;
    profile_image_verified_datetime: string | null;
    profile_image_rejection_reason: string | null;
    location: string;
    wallet_balance: string;
    record_status: string;
    current_status: string;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get auth token
const getAuthToken = (): string | null => {
  const tokenSources = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    sessionStorage.getItem('authToken'),
    sessionStorage.getItem('token')
  ];
  
  for (const token of tokenSources) {
    if (token && token !== 'undefined' && token !== 'null') {
      console.log('Token found for drivers API');
      return token;
    }
  }
  
  console.log('No auth token found');
  return null;
};

// Error handler
const handleApiError = (error: any): ApiResponse<any> => {
  if (error.response) {
    console.error('API Error Response:', error.response.status, error.response.data);
    
    if (error.response.status === 401) {
      return {
        success: false,
        error: 'Authentication failed',
        message: 'Your session has expired. Please login again.'
      };
    }
    
    if (error.response.status === 403) {
      return {
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      };
    }
    
    if (error.response.status === 404) {
      return {
        success: false,
        error: 'Not Found',
        message: 'Drivers endpoint not found.'
      };
    }
    
    return {
      success: false,
      error: error.response.data?.error || 'API Error',
      message: error.response.data?.message || 'Failed to fetch drivers'
    };
  }
  
  if (error.request) {
    console.error('Network Error:', error.request);
    return {
      success: false,
      error: 'Network Error',
      message: 'Unable to connect to server. Please check your internet connection.'
    };
  }
  
  return {
    success: false,
    error: 'Unknown Error',
    message: 'An unexpected error occurred.'
  };
};

// Get drivers for partner
export const getDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token found');
      return {
        success: false,
        error: 'Authentication required',
        message: 'Please login first'
      };
    }

    console.log('Getting drivers with token:', token.substring(0, 20) + '...');
    console.log('Request URL:', `${BASE_URL}/profile/drivers`);

    const response = await fetch(
      `${BASE_URL}/profile/drivers`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Your session has expired. Please login again.'
        };
      }
      
      const errorText = await response.text();
      console.error('Drivers API error:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Drivers Response:', data);

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Get Drivers Error:', error);
    return handleApiError(error);
  }
};

// Get driver by ID
export const getDriverById = async (driverId: number): Promise<ApiResponse<Driver>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Please login first'
      };
    }

    const response = await fetch(
      `${BASE_URL}/profile/drivers/${driverId}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Get Driver by ID Error:', error);
    return handleApiError(error);
  }
};

// Assign driver to ride
export const assignDriverToRide = async (rideId: number, driverId: number): Promise<ApiResponse<any>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Please login first'
      };
    }

    const response = await fetch(
      `${BASE_URL}/rides/${rideId}/assign-driver`,
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ driver_id: driverId })
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    console.error('Assign Driver Error:', error);
    return handleApiError(error);
  }
};