import axios, { AxiosInstance } from 'axios';
import { BASE_URL, API_TIMEOUT, ApiResponse, handleApiError } from '../config/api';

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: API_TIMEOUT,
  });

  // 请求拦截器 - 添加token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 处理401未授权
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token过期或无效，清除token并重定向到登录页
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createApiInstance();

// 接口类型定义
export interface RideRequest {
  request_id: number;
  rider_id: number;
  from_location_name: string;
  from_lat: number;
  from_lng: number;
  to_location_name: string;
  to_lat: number;
  to_lng: number;
  seats_required: number;
  travel_date: string;
  travel_time: string | null;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  city?: string; // 前端可以处理这个字段
}

export interface RideRequestsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  rideRequests: RideRequest[];
}

export interface CancelRequestResponse {
  message: string;
  rideRequest: RideRequest;
}

// API函数
export const reserveApi = {
  // 获取我的预约列表
  async getMyRequests(page: number = 1, limit: number = 10): Promise<ApiResponse<RideRequestsResponse>> {
    try {
      const response = await api.get(`/api/rides/my-requests`, {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  },

  // 取消预约
  async cancelRequest(requestId: number): Promise<ApiResponse<CancelRequestResponse>> {
    try {
      const response = await api.post(`/api/rides/my-requests/${requestId}/cancel`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  },

  // 格式化时间
  formatTime(timeString: string | null): string {
    if (!timeString) return '';
    
    try {
      // 假设时间格式可能是 "HH:MM:SS" 或 "HH:MM"
      const timeParts = timeString.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const period = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12 || 12;
      
      return `${hours}:${minutes} ${period}`;
    } catch (error) {
      return timeString;
    }
  },

  // 格式化日期
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 重置时间为0点以便比较日期
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const checkToday = new Date(today);
      checkToday.setHours(0, 0, 0, 0);
      const checkTomorrow = new Date(tomorrow);
      checkTomorrow.setHours(0, 0, 0, 0);
      
      if (checkDate.getTime() === checkToday.getTime()) {
        return 'Today';
      } else if (checkDate.getTime() === checkTomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        // 格式化为 "Jan 10"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return dateString;
    }
  },

  // 从地点名称提取城市（简单实现）
  extractCity(locationName: string): string {
    // 假设地点名称包含城市名，例如 "T. Nagar, Chennai"
    const parts = locationName.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return locationName;
  }
};