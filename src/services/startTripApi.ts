// services/startTripApi.ts
import axios from 'axios';
import { BASE_URL, handleApiError, ApiResponse } from '@/config/api';

// Define the expected response structure
interface StartTripResponse {
  message: string;
  rideId: number;
  data?: any;
}

// Start trip API function
export const startTrip = async (
  rideId: number,
  token: string
): Promise<ApiResponse<StartTripResponse>> => {
  try {
    console.log(`🚀 Making API call to: ${BASE_URL}/api/rides/offer/${rideId}/start`);
    
    const response = await axios.post(
      `${BASE_URL}/api/rides/offer/${rideId}/start`,
      {},
      {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', response.data);

    // Success response from API
    return {
      success: true,
      data: {
        message: response.data.message || 'Trip started successfully!',
        rideId: response.data.rideId || rideId,
        data: response.data
      },
      message: response.data.message || 'Trip started successfully!'
    };
    
  } catch (error: any) {
    console.error('❌ API Error Details:', error);
    
    // Check if it's a 400 error
    if (error.response && error.response.status === 400) {
      const errorData = error.response.data;
      console.log('🔴 400 Error Data:', errorData);
      
      // Your API returns: {success: false, error: 'message', message: 'message'}
      const errorMessage = errorData.error || errorData.message || 'Failed to start trip';
      
      return {
        success: false,
        error: errorMessage, // String error message
        message: errorMessage
      };
    }
    
    // For network errors or other status codes
    return handleApiError(error);
  }
};