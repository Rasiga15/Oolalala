// notificationApi.ts
import axios from 'axios';
import { BASE_URL } from '@/config/api';

export interface Notification {
  notif_id: number;
  user_id: number;
  title: string;
  body: string;
  metadata: any;
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

// Get auth token from localStorage
const getAuthToken = (): string => {
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('accessToken') || 
                sessionStorage.getItem('authToken') || 
                sessionStorage.getItem('accessToken') || 
                '';
  
  if (!token) {
    console.warn('Authentication token not found');
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
    
    console.log('Fetching notifications with token:', token.substring(0, 20) + '...');
    
    const response = await axios.get(
      `${BASE_URL}/api/notifications/my-notifications`,
      {
        params: {
          page,
          limit
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Notifications response:', response.data);
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

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<MarkAllAsReadResponse> => {
  try {
    const token = getAuthToken();
    
    console.log('Marking all as read with token:', token.substring(0, 20) + '...');
    
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

// Get booking details
export const getBookingDetails = async (bookingId: number): Promise<any> => {
  try {
    const token = getAuthToken();
    
    console.log('Fetching booking details with token:', token.substring(0, 20) + '...');
    
    const response = await axios.get(
      `${BASE_URL}/api/bookings/${bookingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Booking details response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Get Booking Details Error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch booking details.');
    }
  }
};

// Respond to booking (for driver/partner) - UPDATED to include "negotiate" action
export const respondToBooking = async (
  bookingId: number,
  action: 'accept' | 'reject' | 'negotiate', // Updated to include negotiate
  negotiated_fare?: number,
  remarks?: string
): Promise<any> => {
  try {
    const token = getAuthToken();
    
    // Prepare payload based on action
    const payload: any = { 
      action: action 
    };
    
    // For negotiate action, include negotiated_fare and remarks
    if (action === 'negotiate' || action === 'accept') {
      if (negotiated_fare !== undefined) {
        payload.negotiated_fare = negotiated_fare;
      }
      if (remarks) {
        payload.remarks = remarks;
      }
    }
    
    // For reject action, only action is needed
    console.log('Responding to booking with payload:', payload);
    
    const response = await axios.post(
      `${BASE_URL}/api/bookings/${bookingId}/respond`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Booking response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Respond to Booking Error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to respond to booking.');
    }
  }
};

// Counter respond to booking (for rider)
export const counterRespondToBooking = async (
  bookingId: number,
  action: 'accept' | 'decline'
): Promise<any> => {
  try {
    const token = getAuthToken();
    
    console.log('Counter responding to booking with action:', action);
    
    const response = await axios.post(
      `${BASE_URL}/api/bookings/${bookingId}/counter-respond`,
      { action },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Counter response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Counter Respond to Booking Error:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to counter respond to booking.');
    }
  }
};