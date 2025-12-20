// services/drivermanagementapi.ts
import axios from 'axios';
import { ApiResponse, BASE_URL, handleApiError } from '../config/api';

// Interfaces
export interface OtpRequestPayload {
  mobile_number?: string;
  email_address?: string;
  purpose: 'register' | 'login' | 'reset';
}

export interface OtpVerifyPayload {
  mobile_number?: string;
  email_address?: string;
  otp_code: string;
  purpose: 'register' | 'login' | 'reset';
  location_lat?: number;
  location_lng?: number;
  fcm_token?: string;
  device_id?: string;
  device_model?: string;
  mac_address?: string;
}

export interface OtpResponse {
  message: string;
  otp_log_id?: number;
}

export interface DriverFormData {
  first_name: string;
  last_name: string;
  mobile_number: string;
  mobile_otp_log_id: number;
  email_address?: string;
  email_otp_log_id?: number;
  gender?: string;
  date_of_birth: string;
  location?: string;
  profile_image?: File | null;
  driving_licence_number: string;
  driving_licence_front: File | null;
  driving_licence_back?: File | null;
  aadhaar_number?: string;
  aadhaar_front?: File | null;
}

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
    email_address: string | null;
    gender: string | null;
    date_of_birth: string | null;
    fcm_token: string | null;
    is_verified: boolean;
    is_email_verified: boolean;
    role: string;
    publish_ride: boolean;
    referral_code: string | null;
    referred_by: string | null;
    profile_image_url: string | null;
    profile_image_verification_status: string;
    profile_image_verified_by: number | null;
    profile_image_verified_datetime: string | null;
    profile_image_rejection_reason: string | null;
    location: string | null;
    wallet_balance: string;
    record_status: string;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
  };
}

export interface DriverCreateResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class DriverManagementAPI {
  // FIXED: Get auth token from correct localStorage key
  private getAuthToken(): string | null {
    // Try to get token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      return authToken;
    }
    
    // Also check if user data has token
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          return user.token;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return null;
  }

  private getHeaders() {
    const token = this.getAuthToken();
    console.log('Getting headers with token:', token ? token.substring(0, 20) + '...' : 'No token');
    
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Request OTP for mobile number
  async requestOtp(mobileNumber: string, purpose: 'register' = 'register'): Promise<ApiResponse<OtpResponse>> {
    try {
      console.log('Requesting OTP for mobile:', mobileNumber);
      
      const payload: OtpRequestPayload = {
        mobile_number: mobileNumber,
        purpose
      };

      console.log('OTP Request Payload:', payload);
      console.log('Request URL:', `${BASE_URL}/api/auth/request-otp`);

      const response = await axios.post(
        `${BASE_URL}/api/auth/request-otp`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      console.log('OTP Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('OTP Request Error:', error);
      console.error('Error response:', error.response?.data);
      return handleApiError(error);
    }
  }

  // Request OTP for email
  async requestEmailOtp(email: string, purpose: 'register' = 'register'): Promise<ApiResponse<OtpResponse>> {
    try {
      console.log('Requesting OTP for email:', email);
      
      const payload: OtpRequestPayload = {
        email_address: email,
        purpose
      };

      console.log('Email OTP Request Payload:', payload);
      console.log('Request URL:', `${BASE_URL}/api/auth/request-otp`);

      const response = await axios.post(
        `${BASE_URL}/api/auth/request-otp`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      console.log('Email OTP Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Email OTP Request Error:', error);
      console.error('Error response:', error.response?.data);
      return handleApiError(error);
    }
  }

  // Verify Mobile OTP
  async verifyMobileOtp(
    mobileNumber: string, 
    otpCode: string, 
    purpose: 'register' = 'register'
  ): Promise<ApiResponse<OtpResponse>> {
    try {
      console.log('Verifying Mobile OTP:', { mobileNumber, otpCode });
      
      const payload: OtpVerifyPayload = {
        mobile_number: mobileNumber,
        otp_code: otpCode,
        purpose,
        location_lat: 0,
        location_lng: 0,
        fcm_token: 'string',
        device_id: 'string',
        device_model: 'string',
        mac_address: 'string'
      };

      console.log('Verify Mobile OTP Payload:', payload);
      console.log('Request URL:', `${BASE_URL}/api/auth/verify-otp`);

      // For OTP verification, we don't need authorization token
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        payload,
        {
          headers,
          timeout: 10000
        }
      );

      console.log('Verify Mobile OTP Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Verify Mobile OTP Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error occurred. Check your internet connection.');
      }
      
      return handleApiError(error);
    }
  }

  // Verify Email OTP
  async verifyEmailOtp(
    email: string, 
    otpCode: string, 
    purpose: 'register' = 'register'
  ): Promise<ApiResponse<OtpResponse>> {
    try {
      console.log('Verifying Email OTP:', { email, otpCode });
      
      const payload: OtpVerifyPayload = {
        email_address: email,
        otp_code: otpCode,
        purpose,
        location_lat: 0,
        location_lng: 0,
        fcm_token: 'string',
        device_id: 'string',
        device_model: 'string',
        mac_address: 'string'
      };

      console.log('Verify Email OTP Payload:', payload);

      // For OTP verification, we don't need authorization token
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        payload,
        {
          headers,
          timeout: 10000
        }
      );

      console.log('Verify Email OTP Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Verify Email OTP Error:', error);
      console.error('Error response:', error.response?.data);
      return handleApiError(error);
    }
  }

  // Get list of drivers for the partner
  async getDrivers(): Promise<ApiResponse<Driver[]>> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return {
          success: false,
          error: 'Authentication required',
          message: 'Please login first'
        };
      }

      console.log('Getting drivers with token:', token.substring(0, 20) + '...');
      console.log('Request URL:', `${BASE_URL}/api/profile/drivers`);

      const response = await axios.get(
        `${BASE_URL}/api/profile/drivers`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      console.log('Drivers Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Get Drivers Error:', error);
      console.error('Error response:', error.response?.data);
      return handleApiError(error);
    }
  }

  // Create new driver
  async createDriver(formData: DriverFormData): Promise<DriverCreateResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.error('No authentication token found for create driver');
        console.error('Available localStorage items:');
        console.log('authToken:', localStorage.getItem('authToken') ? 'Exists' : 'Not found');
        console.log('userData:', localStorage.getItem('userData') ? 'Exists' : 'Not found');
        
        return {
          success: false,
          error: 'Authentication required',
          message: 'Please login as a partner first'
        };
      }

      console.log('Creating driver with token:', token.substring(0, 20) + '...');
      console.log('Creating driver with data:', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile_number: formData.mobile_number,
        mobile_otp_log_id: formData.mobile_otp_log_id,
        email_address: formData.email_address,
        email_otp_log_id: formData.email_otp_log_id,
        has_profile_image: !!formData.profile_image,
        has_dl_front: !!formData.driving_licence_front
      });

      // Create FormData object
      const multipartData = new FormData();
      
      // Append required fields
      multipartData.append('first_name', formData.first_name);
      multipartData.append('last_name', formData.last_name);
      multipartData.append('mobile_number', formData.mobile_number);
      multipartData.append('mobile_otp_log_id', formData.mobile_otp_log_id.toString());
      multipartData.append('date_of_birth', formData.date_of_birth);
      multipartData.append('driving_licence_number', formData.driving_licence_number);
      
      // Append driving licence front (required)
      if (formData.driving_licence_front) {
        multipartData.append('driving_licence_front', formData.driving_licence_front);
      }
      
      // Append optional fields if they exist
      if (formData.email_address && formData.email_otp_log_id) {
        multipartData.append('email_address', formData.email_address);
        multipartData.append('email_otp_log_id', formData.email_otp_log_id.toString());
      }
      
      if (formData.gender) {
        multipartData.append('gender', formData.gender);
      }
      
      if (formData.location) {
        multipartData.append('location', formData.location);
      }
      
      // Append profile image if exists
      if (formData.profile_image) {
        multipartData.append('profile_image', formData.profile_image);
      }
      
      // Append driving licence back if exists
      if (formData.driving_licence_back) {
        multipartData.append('driving_licence_back', formData.driving_licence_back);
      }
      
      // Append aadhaar fields if provided
      if (formData.aadhaar_number) {
        multipartData.append('aadhaar_number', formData.aadhaar_number);
        if (formData.aadhaar_front) {
          multipartData.append('aadhaar_front', formData.aadhaar_front);
        }
      }

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (const pair of multipartData.entries()) {
        console.log(pair[0] + ': ', typeof pair[1] === 'object' ? 'File' : pair[1]);
      }

      const response = await axios.post(
        `${BASE_URL}/api/profile/drivers`,
        multipartData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('Create Driver Response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Create Driver Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return handleApiError(error) as DriverCreateResponse;
    }
  }

  // Helper function to convert data URL to File object
  dataUrlToFile(dataUrl: string, filename: string): File | null {
    try {
      const arr = dataUrl.split(',');
      if (arr.length < 2) {
        console.error('Invalid data URL format');
        return null;
      }
      
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) {
        console.error('Could not extract MIME type from data URL');
        return null;
      }
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      const file = new File([u8arr], filename, { type: mime });
      console.log('Created file from data URL:', filename, file.size, 'bytes');
      return file;
    } catch (error) {
      console.error('Error converting data URL to file:', error);
      return null;
    }
  }
}

export const driverManagementAPI = new DriverManagementAPI();