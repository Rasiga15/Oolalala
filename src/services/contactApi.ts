// src/services/contactApi.ts
import { BASE_URL, handleApiError, ApiResponse } from '../config/api';

export interface ContactDetails {
  email?: string | null;
  isEmailVerified?: boolean;
  mobileNumber?: string;  // This is what your backend returns
  isMobileVerified?: boolean;
}

export interface UpdateContactRequest {
  email?: string | null;
  mobileNumber?: string;  // Your backend expects camelCase
  emailOtpCode?: string;  // Your backend expects camelCase
  mobileOtpCode?: string; // Your backend expects camelCase
}

export interface OTPRequest {
  mobile_number?: string;
  email_address?: string;
  purpose: 'verify_email' | 'verify_mobile' | 'login' | 'register' | 'password_reset';
}

export interface OTPResponse {
  message: string;
}

export interface UpdateContactResponse {
  message: string;
  email?: string | null;
  mobileNumber?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get contact details
export const getContactDetails = async (): Promise<ApiResponse<ContactDetails>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Authentication token not found',
        message: 'Please login to continue'
      };
    }

    console.log('Fetching contact details...');

    const response = await fetch(`${BASE_URL}/api/profile/contact`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Contact API error:', errorText);
      throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
    }

    const data: ContactDetails = await response.json();
    console.log('Contact details:', data);
    
    return {
      success: true,
      data,
      message: 'Contact details retrieved successfully'
    };
  } catch (error) {
    console.error('Error in getContactDetails:', error);
    return handleApiError(error);
  }
};

// Save contact details (just save without OTP)
export const saveContactDetails = async (
  updateData: UpdateContactRequest
): Promise<ApiResponse<UpdateContactResponse>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Authentication token not found',
        message: 'Please login to continue'
      };
    }

    // Your backend expects EXACTLY these field names based on the error
    const apiData: any = {};
    
    if (updateData.email !== undefined) {
      apiData.email = updateData.email;
    }
    
    if (updateData.mobileNumber !== undefined) {
      apiData.mobileNumber = updateData.mobileNumber; // camelCase!
    }

    console.log('Saving contact details with data:', apiData);

    const response = await fetch(`${BASE_URL}/api/profile/contact`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });

    console.log('Save response status:', response.status);
    
    const responseText = await response.text();
    console.log('Save response text:', responseText);

    if (!response.ok) {
      // Check if this is the "OTP required" error
      if (response.status === 400 && responseText.includes('OTP is required')) {
        console.log('Number saved, OTP required for verification');
        return {
          success: true,
          data: { message: 'Contact saved. Verification required.' },
          message: 'Contact saved. Please verify with OTP.'
        };
      }
      
      // For other errors, throw normally
      throw new Error(`HTTP error! Status: ${response.status}: ${responseText}`);
    }

    const data: UpdateContactResponse = JSON.parse(responseText);
    
    return {
      success: true,
      data,
      message: data.message || 'Contact details saved successfully'
    };
  } catch (error) {
    console.error('Error in saveContactDetails:', error);
    return handleApiError(error);
  }
};

// Verify contact with OTP
export const updateContactDetails = async (
  updateData: UpdateContactRequest
): Promise<ApiResponse<UpdateContactResponse>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Authentication token not found',
        message: 'Please login to continue'
      };
    }

    // Your backend expects camelCase for OTP fields too
    const apiData: any = {};
    
    if (updateData.email !== undefined) {
      apiData.email = updateData.email;
    }
    
    if (updateData.mobileNumber !== undefined) {
      apiData.mobileNumber = updateData.mobileNumber;
    }
    
    if (updateData.emailOtpCode !== undefined) {
      apiData.emailOtpCode = updateData.emailOtpCode;
    }
    
    if (updateData.mobileOtpCode !== undefined) {
      apiData.mobileOtpCode = updateData.mobileOtpCode;
    }

    console.log('Verifying contact with data:', apiData);

    const response = await fetch(`${BASE_URL}/api/profile/contact`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });

    console.log('Verify response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Verify contact error:', errorText);
      throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
    }

    const data: UpdateContactResponse = await response.json();
    
    return {
      success: true,
      data,
      message: data.message || 'Contact verification successful'
    };
  } catch (error) {
    console.error('Error in updateContactDetails:', error);
    return handleApiError(error);
  }
};

// Request OTP for verification
export const requestOTP = async (otpRequest: OTPRequest): Promise<ApiResponse<OTPResponse>> => {
  try {
    console.log('Requesting OTP:', otpRequest);

    const response = await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(otpRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OTP request error:', errorText);
      throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
    }

    const data: OTPResponse = await response.json();
    
    return {
      success: true,
      data,
      message: data.message || 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Error in requestOTP:', error);
    return handleApiError(error);
  }
};

// Verify mobile number with OTP
export const verifyMobile = async (mobileNumber: string, otp: string): Promise<ApiResponse> => {
  try {
    console.log('Verifying mobile with OTP:', mobileNumber);
    
    const response = await updateContactDetails({
      mobileNumber: mobileNumber,
      mobileOtpCode: otp
    });

    return response;
  } catch (error) {
    console.error('Error in verifyMobile:', error);
    return handleApiError(error);
  }
};

// Verify email with OTP
export const verifyEmail = async (email: string, otp: string): Promise<ApiResponse> => {
  try {
    console.log('Verifying email with OTP:', email);
    
    const response = await updateContactDetails({
      email: email,
      emailOtpCode: otp
    });

    return response;
  } catch (error) {
    console.error('Error in verifyEmail:', error);
    return handleApiError(error);
  }
};

// Request mobile verification OTP
export const requestMobileVerificationOTP = async (mobileNumber: string): Promise<ApiResponse> => {
  try {
    console.log('Requesting mobile OTP for:', mobileNumber);
    
    const response = await requestOTP({
      mobile_number: mobileNumber,
      purpose: 'verify_mobile'
    });

    return response;
  } catch (error) {
    console.error('Error in requestMobileVerificationOTP:', error);
    return handleApiError(error);
  }
};

// Request email verification OTP
export const requestEmailVerificationOTP = async (email: string): Promise<ApiResponse> => {
  try {
    console.log('Requesting email OTP for:', email);
    
    const response = await requestOTP({
      email_address: email,
      purpose: 'verify_email'
    });

    return response;
  } catch (error) {
    console.error('Error in requestEmailVerificationOTP:', error);
    return handleApiError(error);
  }
};