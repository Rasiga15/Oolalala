import { toast } from 'sonner';
import { BASE_URL } from '../config/api';

export interface Document {
  id: number;
  documentType: string;
  documentNumber: string;
  validity: string | null;
}

export interface DocumentUploadData {
  aadhaarNumber?: string;
  aadhaar_front?: File;
  drivingLicenceNumber?: string;
  uploadDrivingLicenceFront?: File;
  uploadDrivingLicenceBack?: File;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Get user documents
export const getUserDocuments = async (token: string): Promise<Document[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/profile/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch documents:', errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received documents from API:', data);
    return data;
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    toast.error('Failed to fetch document details');
    throw error;
  }
};

// Upload or update documents - Swagger ലെ format പ്രകാരം
export const uploadDocuments = async (
  token: string,
  data: DocumentUploadData
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    console.log('Starting document upload with data:', data);

    // Aadhaar upload - Swagger ലെ field name പ്രകാരം
    if (data.aadhaarNumber) {
      console.log('Uploading Aadhaar:', data.aadhaarNumber);
      formData.append('aadhaarNumber', data.aadhaarNumber);
      
      if (data.aadhaar_front) {
        formData.append('aadhaar_front', data.aadhaar_front);
      }
    }
    
    // Driving License upload - Swagger ലെ field name പ്രകാരം
    if (data.drivingLicenceNumber) {
      console.log('Uploading Driving License:', data.drivingLicenceNumber);
      formData.append('drivingLicenceNumber', data.drivingLicenceNumber);
      
      // Optional file uploads
      if (data.uploadDrivingLicenceFront) {
        formData.append('uploadDrivingLicenceFront', data.uploadDrivingLicenceFront);
      }
      
      if (data.uploadDrivingLicenceBack) {
        formData.append('uploadDrivingLicenceBack', data.uploadDrivingLicenceBack);
      }
    }

    // Debug: Show what we're sending
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`- ${key}:`, value);
    }

    const response = await fetch(`${BASE_URL}/api/profile/documents`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*',
        // Let browser set Content-Type automatically for FormData with boundary
      },
      body: formData,
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `Server error ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Server error details:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Ignore
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Upload successful! Response:', result);
    
    toast.success('Document saved successfully!');
    return {
      success: true,
      data: result,
      message: result.message || 'Document saved successfully'
    };
  } catch (error: any) {
    console.error('Error in uploadDocuments:', error);
    
    let userMessage = 'Failed to save document';
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      userMessage = 'Session expired. Please login again.';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message.includes('Network')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.message) {
      userMessage = error.message;
    }
    
    toast.error(userMessage);
    return {
      success: false,
      error: error.message || 'Failed to upload document',
      message: userMessage
    };
  }
};

// Verify document with OTP
export const verifyDocument = async (
  mobileNumber: string,
  documentType: 'aadhaar' | 'driving_license' | 'pan',
  documentNumber: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      body: JSON.stringify({
        mobile_number: mobileNumber,
        purpose: 'verify_mobile'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    
    if (data.message === 'OTP sent') {
      return {
        success: true,
        message: 'OTP sent for verification'
      };
    }
    
    throw new Error('Failed to send OTP');
  } catch (error: any) {
    console.error('Error verifying document:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
      message: error.message
    };
  }
};