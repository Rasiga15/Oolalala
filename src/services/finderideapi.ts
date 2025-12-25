import axios from 'axios';
import { ApiResponse, handleApiError } from '../config/api';

const BASE_URL = 'http://18.61.216.57:4500/api';

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ride search response interface
export interface RideSearchResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  rides: Ride[];
}

export interface Ride {
  ride_id: number;
  ride_status: string;
  delay_info: string | null;
  available_seats: number;
  is_negotiable: boolean;
  full_ride_details: {
    from: string | null;
    to: string | null;
    starts_at: string;
  };
  searched_segment: {
    from_stop: string;
    to_stop: string;
    boarding_stop_id: number;
    drop_stop_id: number;
    departure_time: string;
    arrival_time: string;
    duration: string;
    price: string;
  };
  driver: {
    user_id: number;
    name: string;
    average_rating: string;
    profile_image_url: string;
  };
  vehicle: {
    number_plate: string;
  };
  preferences: any[];
}

// Booking request interface
export interface BookingRequestPayload {
  seats_booked: number;
  boarding_stop_id: number;
  drop_stop_id: number;
  negotiated_fare: number;
  remarks: string;
}

export interface BookingResponse {
  message: string;
  booking: {
    id: number;
    ride_post_id: string;
    rider_id: number;
    booking_status: string;
    total_fare: number;
    final_fare: number;
    booking_number: string;
    status_expires_at: string;
    negotiation_history: Array<{
      by: string;
      amount: number;
      remarks: string;
      timestamp: string;
    }>;
  };
}

// MAIN SEARCH FUNCTION - Based on your working example
export const searchRides = async (
  date: string // Required date parameter
): Promise<ApiResponse<RideSearchResponse>> => {
  try {
    console.log('Searching rides for date:', date);
    
    // From your example, it seems like the API works with these coordinates
    const params = {
      from_lat: 8.9566, // Tenkasi latitude
      from_lng: 77.3127, // Tenkasi longitude
      to_lat: 13.0827, // Chennai latitude
      to_lng: 80.2707, // Chennai longitude
      date: date // Required date
    };

    console.log('API params:', params);
    
    const response = await apiClient.get('/rides/search', { params });
    
    console.log('✅ Search API Response:', response.data);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Search API Error:', error);
    return handleApiError(error);
  }
};

// Book ride API - Based on your working example
export const bookRide = async (
  rideId: number,
  payload: BookingRequestPayload
): Promise<ApiResponse<BookingResponse>> => {
  try {
    console.log('📦 Booking ride:', rideId, 'with payload:', payload);
    
    const response = await apiClient.post(`/rides/offer/${rideId}/book`, payload);
    
    console.log('✅ Booking Response:', response.data);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Booking API Error:', error);
    return handleApiError(error);
  }
};

// Get user's current location coordinates
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export default {
  searchRides,
  bookRide,
  getCurrentLocation,
};