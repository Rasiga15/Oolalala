// src/services/driversApi.ts
const BASE_URL = 'https://api-dev.oolalala.com/api';

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
      return token;
    }
  }
  
  return null;
};

// Get only verified drivers
export const getVerifiedDrivers = async (): Promise<Driver[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required. Please login first.');
    }

    console.log('Getting drivers with token:', token.substring(0, 20) + '...');

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
        throw new Error('Your session has expired. Please login again.');
      }
      
      const errorText = await response.text();
      console.error('Drivers API error:', errorText);
      throw new Error(`Failed to fetch drivers: ${response.status}`);
    }

    const data = await response.json();
    console.log('Drivers Response:', data);

    // Filter only verified drivers (profile_image_verification_status === 'verified')
    const verifiedDrivers = Array.isArray(data) 
      ? data.filter((driver: Driver) => 
          driver.user?.profile_image_verification_status === 'verified' || 
          driver.user?.profile_image_verification_status === 'approved'
        )
      : [];

    console.log(`Loaded ${verifiedDrivers.length} verified drivers`);
    return verifiedDrivers;
  } catch (error: any) {
    console.error('Get Verified Drivers Error:', error);
    throw error;
  }
};

// Get all drivers (including unverified)
export const getAllDrivers = async (): Promise<Driver[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

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
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Get All Drivers Error:', error);
    throw error;
  }
};