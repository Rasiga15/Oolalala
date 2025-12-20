export const BASE_URL = 'http://18.61.216.57:4500';
export const API_TIMEOUT = 10000;

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