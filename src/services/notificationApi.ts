import axios from 'axios';
import { BASE_URL } from '@/config/api';

export interface Notification {
  notif_id: number;
  user_id: number;
  title: string;
  body: string;
  metadata: any; // Can be string or object
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  notifications: Notification[];
}

export interface MarkAllAsReadResponse {
  message: string;
  markedCount?: number;
}

// Get auth token
const getAuthToken = (): string => {
  const token = localStorage.getItem('authToken') || '';
  if (!token) {
    throw new Error('Authentication token not found. Please login again.');
  }
  return token;
};

// Get notifications with pagination
export const getNotifications = async (
  page: number = 1,
  limit: number = 100
): Promise<NotificationsResponse> => {
  try {
    const token = getAuthToken();
    
    const response = await axios.get(
      `${BASE_URL}/api/notifications/my-notifications`,
      {
        params: {
          page,
          limit
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Get Notifications Error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch notifications.');
    }
  }
};

// MARK ALL AS READ API - Fixed based on your provided endpoint
export const markAllNotificationsAsRead = async (): Promise<MarkAllAsReadResponse> => {
  try {
    const token = getAuthToken();
    
    console.log('Calling mark-all-as-read API...');
    
    const response = await axios.post(
      `${BASE_URL}/api/notifications/mark-all-as-read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Mark all as read response:', response.data);
    
    return {
      message: response.data.message,
      markedCount: response.data.message?.match(/\d+/)?.[0] ? 
                   parseInt(response.data.message.match(/\d+/)[0]) : 
                   0
    };
  } catch (error: any) {
    console.error('Mark All as Read Error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to mark all notifications as read.');
    }
  }
};