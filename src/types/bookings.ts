// types/booking.ts

export type BookingStatus = 
  | 'confirmed' 
  | 'negotiation_pending' 
  | 'payment_pending' 
  | 'cancelled' 
  | 'completed';

export type UserRole = 'rider' | 'driver';

export interface RoutePoint {
  name: string;
  time: string;
}

export interface Route {
  distance: string;
  duration: string;
  from: RoutePoint;
  to: RoutePoint;
}

export interface UserDetails {
  id: number;
  name: string;
  profile_image_url: string;
  mobile_number: string;
}

export interface RideDetails {
  ride_id: number;
  is_full_car: boolean;
  travel_datetime: string;
  status: string;
}

export interface Booking {
  booking_id: number;
  booking_number: string;
  booking_status: BookingStatus;
  created_at: string;
  seats_booked: number;
  total_fare: string;
  final_fare: string;
  pickup_otp: string | null;
  drop_otp: string | null;
  current_turn: string | null;
  is_my_turn: boolean;
  your_current_role: UserRole;
  delay_info: any | null;
  ride_details: RideDetails;
  route: Route;
  rider_details: UserDetails;
  driver_details: UserDetails;
}

export interface BookingsResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  bookings: Booking[];
}

export interface BookingStats {
  totalUpcoming: number;
  totalSeats: number;
}