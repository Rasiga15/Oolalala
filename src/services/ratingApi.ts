// ratingApi.ts
import axios from 'axios';

export const BASE_URL = 'https://api-dev.oolalala.com';
export const API_TIMEOUT = 10000;

export interface RatingRequest {
  rating_value: number;
  review_text: string;
}

export interface RatingResponse {
  message: string;
  rating: {
    id: number;
    booking_id: string;
    from_id: number;
    to_id: number;
    partner_id: number;
    rating_value: number;
    review_text: string;
    created_at: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Helper function to handle API errors
export const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error
    const errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        'Server error occurred';
    return {
      success: false,
      error: errorMessage,
      message: errorMessage
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      message: 'Network error'
    };
  } else {
    // Other errors
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: error.message
    };
  }
};

// Rate driver API
export const rateDriver = async (
  bookingId: number,
  ratingData: RatingRequest,
  token: string
): Promise<ApiResponse<RatingResponse>> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/ratings/booking/${bookingId}/rate-driver`,
      ratingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: API_TIMEOUT
      }
    );

    return {
      success: true,
      data: response.data,
      message: response.data.message
    };
  } catch (error: any) {
    return handleApiError(error);
  }
};