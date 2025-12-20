import { BASE_URL } from '../config/api';
import { ApiResponse, handleApiError } from '../config/api';

export interface BasicProfileData {
  profileImage?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'others';
  multiVehicle: boolean;
  location?: string;
  publishRide?: boolean;
  partnerType?: 'individual' | 'commercial' | null;
  businessName?: string;
  professionalType?: string;
}

class ProfileApiService {
  private static instance: ProfileApiService;

  private constructor() {}

  public static getInstance(): ProfileApiService {
    if (!ProfileApiService.instance) {
      ProfileApiService.instance = new ProfileApiService();
    }
    return ProfileApiService.instance;
  }

  // Get token from localStorage
  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  private getAuthHeaders(contentType: 'json' | 'multipart' = 'json'): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (contentType === 'json') {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // GET /api/profile/basic
  async getBasicProfile(): Promise<ApiResponse<BasicProfileData>> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required. Please login again.',
          message: 'No authentication token found'
        };
      }

      const response = await fetch(`${BASE_URL}/api/profile/basic`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        return {
          success: false,
          error: 'Your session has expired. Please login again.',
          message: 'Authentication expired'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          profileImage: data.profileImage,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          multiVehicle: data.multiVehicle,
          location: data.location,
          publishRide: data.publishRide,
          partnerType: data.partnerType,
          businessName: data.businessName,
          professionalType: data.professionalType,
        },
        message: 'Profile loaded successfully'
      };
    } catch (error: any) {
      console.error('Error fetching basic profile:', error);
      return handleApiError(error);
    }
  }

  // PUT /api/profile/basic
  async updateBasicProfile(formData: FormData): Promise<ApiResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required. Please login again.',
          message: 'No authentication token found'
        };
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };
      
      const response = await fetch(`${BASE_URL}/api/profile/basic`, {
        method: 'PUT',
        headers: headers,
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        return {
          success: false,
          error: 'Your session has expired. Please login again.',
          message: 'Authentication expired'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Profile updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating basic profile:', error);
      return handleApiError(error);
    }
  }

  // Helper method to create FormData for profile update
  createProfileFormData(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    multiVehicle: boolean;
    publishRide?: boolean;
    partnerType?: string;
    businessName?: string;
    location?: string;
    professionalType?: string;
    profileImage?: File;
  }): FormData {
    const formData = new FormData();
    
    // Basic required fields
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('dateOfBirth', data.dateOfBirth);
    formData.append('gender', data.gender);
    formData.append('multiVehicle', data.multiVehicle.toString());
    
    // Optional profile image
    if (data.profileImage) {
      formData.append('profile_image', data.profileImage);
    }
    
    // Add publishRide if provided
    if (data.publishRide !== undefined) {
      formData.append('publishRide', data.publishRide.toString());
    }
    
    // Add partnerType if provided and publishRide is true
    if (data.publishRide && data.partnerType) {
      formData.append('partnerType', data.partnerType);
      
      // Add fields specific to partner type
      if (data.partnerType === 'commercial' && data.businessName) {
        formData.append('businessName', data.businessName);
      } else if (data.partnerType === 'individual' && data.professionalType) {
        // Add professionalType for individual partners
        formData.append('workingProfessional', data.professionalType);
      }
    }
    
    // Add optional location
    if (data.location) {
      formData.append('location', data.location);
    }
    
    // Log for debugging
    console.log('FormData created with keys:', Array.from(formData.keys()));
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    return formData;
  }
}

export default ProfileApiService.getInstance();