// services/myBookingsApi.ts
import axios from 'axios';
import { BookingsResponse, BookingStats } from '../types/bookings';
import { ApiResponse, BASE_URL, handleApiError } from '../config/api';

// Get bookings with filters
export const getMyBookings = async (
  status: 'upcoming' | 'passed',
  page: number = 1,
  limit: number = 10,
  token?: string
): Promise<ApiResponse<BookingsResponse>> => {
  try {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get<BookingsResponse>(
      `${BASE_URL}/api/bookings/my-bookings`,
      {
        params: {
          page,
          limit,
          status,
          as_partner: false
        },
        headers,
        timeout: 10000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Get booking statistics
export const getBookingStats = async (token?: string): Promise<ApiResponse<BookingStats>> => {
  try {
    // Fetch both upcoming and passed bookings to calculate stats
    const upcomingResponse = await getMyBookings('upcoming', 1, 100, token);
    const passedResponse = await getMyBookings('passed', 1, 100, token);

    if (!upcomingResponse.success || !passedResponse.success) {
      return {
        success: false,
        error: 'Failed to fetch booking statistics'
      };
    }

    const upcomingBookings = upcomingResponse.data?.bookings || [];
    const passedBookings = passedResponse.data?.bookings || [];

    const totalUpcoming = upcomingBookings.length;
    const totalSeats = upcomingBookings.reduce((sum, booking) => sum + booking.seats_booked, 0);

    return {
      success: true,
      data: {
        totalUpcoming,
        totalSeats
      }
    };
  } catch (error: any) {
    return handleApiError(error);
  }
};

// Format date for display
export const formatBookingDate = (dateString: string): { date: string; time: string } => {
  const date = new Date(dateString);
  
  // Format date: "Jan 04, 2026"
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  // Format time: "10:21 AM"
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { date: formattedDate, time: formattedTime };
};

// Format currency
export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${numAmount.toLocaleString('en-IN')}`;
};

// Get status badge info
export const getStatusInfo = (status: BookingStatus) => {
  switch (status) {
    case 'confirmed':
      return {
        className: 'bg-green-100 text-green-600 border border-green-200',
        label: 'Confirmed'
      };
    case 'negotiation_pending':
      return {
        className: 'bg-orange-100 text-orange-600 border border-orange-200',
        label: 'Negotiation Pending'
      };
    case 'payment_pending':
      return {
        className: 'bg-yellow-100 text-yellow-600 border border-yellow-200',
        label: 'Payment Pending'
      };
    case 'cancelled':
      return {
        className: 'bg-red-100 text-red-600 border border-red-200',
        label: 'Cancelled'
      };
    case 'completed':
      return {
        className: 'bg-blue-100 text-blue-600 border border-blue-200',
        label: 'Completed'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-600 border border-gray-200',
        label: status
      };
  }
};