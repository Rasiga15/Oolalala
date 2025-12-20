import axios, { AxiosError } from 'axios';
import { BASE_URL, API_TIMEOUT, ApiResponse, handleApiError } from '@/config/api';

export interface Vehicle {
  id: number;
  partner_id: number;
  vehicle_code: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  manufacture_year: number | null;
  number_plate: string;
  color: string | null;
  seating_capacity: number;
  ownership_type: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_datetime: string | null;
  rejected_datetime: string | null;
  verifier_id: number | null;
  rejected_by: number | null;
  morevehicle_details: any;
  rc_number: string | null;
  rc_validity: string | null;
  insurance_number: string | null;
  insurance_validity: string | null;
  fitness_certificate_number: string | null;
  fitness_certificate_validity: string | null;
  record_status: string;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  vehicleNumber: string;
}

export interface UpdateVehicleRequest {
  vehicleNumber: string;
}

class VehicleApi {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  // Set token for API calls
  setToken(token: string) {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  // Get all vehicles for the partner
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response = await this.axiosInstance.get('/api/profile/vehicles');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Create a new vehicle
  async createVehicle(data: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.axiosInstance.post('/api/profile/vehicles', data);
      return {
        success: true,
        data: response.data.vehicle,
        message: response.data.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Update an existing vehicle
  async updateVehicle(vehicleId: number, data: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await this.axiosInstance.put(`/api/profile/vehicles/${vehicleId}`, data);
      return {
        success: true,
        data: response.data.vehicle,
        message: response.data.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Delete a vehicle (soft delete)
  async deleteVehicle(vehicleId: number): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.delete(`/api/profile/vehicles/${vehicleId}`);
      return {
        success: true,
        message: response.data?.message || 'Vehicle deleted successfully',
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
}

export const vehicleApi = new VehicleApi();