import axios from 'axios';
import { BASE_URL } from '../config/api';

// Interface for Ride Offer
export interface RideOffer {
  ride_id: number;
  ride_code: string | null;
  partner_id: number;
  driver_id: number | null;
  source_request_id: number | null;
  vehicle_id: number;
  start_location_name: string | null;
  start_address: string;
  start_lat: number;
  start_lng: number;
  end_location_name: string | null;
  end_address: string;
  end_lat: number;
  end_lng: number;
  travel_datetime: string;
  total_seats: number;
  available_seats: number;
  instant_confirmed: boolean;
  is_negotiable: boolean;
  is_full_car: boolean;
  base_fare: number | null;
  total_distance: number | null;
  ride_status: string;
  activated_at: string;
  completed_at: string | null;
  draft_at: string;
  published_at: string | null;
  started_at: string | null;
  ride_created_by: string;
  record_status: string;
  created_by: number;
  updated_by: number | null;
  cancelled_by: number | null;
  cancelled_at: string | null;
  created_at: string;
  vehicle: {
    number_plate: string;
    model: string | null;
  };
}

// Interface for Ride Details
export interface RideDetails extends RideOffer {
  vehicle: {
    id: number;
    partner_id: number;
    driver_id: number | null;
    vehicle_code: string;
    vehicle_type: string;
    vehicle_category_description: string | null;
    brand: string | null;
    model: string | null;
    manufacture_year: string | null;
    number_plate: string;
    color: string | null;
    seating_capacity: number;
    ownership_type: string;
    rc_number: string;
    rc_validity: string;
    rc_front_image_url: string | null;
    rc_back_image_url: string | null;
    insurance_number: string;
    insurance_validity: string;
    insurance_image_url: string | null;
    fitness_certificate_number: string | null;
    fitness_certificate_validity: string | null;
    fitness_certificate_image_url: string | null;
    verification_status: string;
    verified_datetime: string | null;
    rejected_datetime: string | null;
    verifier_id: number | null;
    rejected_by: number | null;
    record_status: string;
    morevehicle_details: string | null;
    created_by: number;
    updated_by: number;
    created_at: string;
    updated_at: string;
  };
  driver: any | null;
  stops: any[];
  fares: any[];
  preferences: any[];
}

// Interface for Paginated Response
export interface RideOffersResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  rideOffers: RideOffer[];
}

// Helper function to get token from localStorage
export const getTokenFromStorage = (): string | null => {
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (authToken) {
    return authToken;
  }
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.token || null;
    } catch {
      return null;
    }
  }
  
  return null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getTokenFromStorage();
  return token !== null;
};

// Get all ride offers created by partner
export const getMyRideOffers = async (
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<RideOffersResponse> => {
  const token = getTokenFromStorage();
  
  if (!token) {
    throw new Error('No authentication token found. Please login.');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status })
  });

  const response = await axios.get(`${BASE_URL}/api/rides/my-offers?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    timeout: 10000
  });

  return response.data;
};

// Get specific ride offer details
export const getRideOfferDetails = async (
  rideId: number
): Promise<RideDetails> => {
  const token = getTokenFromStorage();
  
  if (!token) {
    throw new Error('No authentication token found. Please login.');
  }

  const response = await axios.get(`${BASE_URL}/api/rides/offer/${rideId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    timeout: 10000
  });

  return response.data;
};