import axios from 'axios';
import { BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

export interface BookingRequestPayload {
  seats_booked: number;
  boarding_stop_id: number;
  drop_stop_id: number;
  negotiated_fare?: number;
  remarks?: string;
}

export interface BookingResponse {
  message: string;
  booking: {
    ride_fare_per_person: number;
    final_customer_bill_amount: number;
    platform_commission_amount: number;
    driver_earned_amount: number;
    platform_commission_percent: number;
    tax_amount: number;
    tax_percentage: number;
    penalty_amount: number;
    discount_amount: number;
    payment_state: string;
    partner_payout_state: string;
    requested_at: string;
    cancellation_fee: number;
    paid_amount: number;
    amount_to_be_paid: number;
    record_status: string;
    id: number;
    ride_post_id: string;
    rider_id: number;
    boarding_stop_id: number;
    drop_stop_id: number;
    total_fare: number;
    final_fare: number;
    booking_status: string;
    negotiation_history: Array<{
      by: string;
      amount: number;
      remarks: string;
      timestamp: string;
    }>;
    status_expires_at: string;
    created_by: number;
    created_at: string;
    booking_number: string;
  };
}

// Get auth token from localStorage or context
const getAuthToken = (): string => {
  const token = localStorage.getItem('authToken') || '';
  if (!token) {
    throw new Error('Authentication token not found. Please login again.');
  }
  return token;
};

// Create booking request
export const createBooking = async (
  rideId: number,
  payload: BookingRequestPayload
): Promise<BookingResponse> => {
  try {
    const token = getAuthToken();
    
    const response = await axios.post(
      `${BASE_URL}/api/rides/offer/${rideId}/book`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Booking API Error:', error);
    
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your internet connection.');
    } else {
      // Other errors
      throw new Error(error.message || 'Failed to create booking.');
    }
  }
};

// Get booking details by ID
export const getBookingDetails = async (bookingId: number): Promise<BookingResponse> => {
  try {
    const token = getAuthToken();
    
    const response = await axios.get(
      `${BASE_URL}/api/bookings/${bookingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Get Booking Error:', error);
    throw new Error('Failed to fetch booking details.');
  }
};

// Cancel booking
export const cancelBooking = async (bookingId: number, reason?: string): Promise<any> => {
  try {
    const token = getAuthToken();
    
    const response = await axios.post(
      `${BASE_URL}/api/bookings/${bookingId}/cancel`,
      { reason },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Cancel Booking Error:', error);
    throw new Error('Failed to cancel booking.');
  }
};