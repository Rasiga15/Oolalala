import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Users, DollarSign, Car } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { BASE_URL } from '@/config/api';
import Navbar from '../components/layout/Navbar';

interface RideStop {
  stop_id: number;
  ride_id: number;
  stop_order: number;
  stop_name: string;
  address: string;
  arrival_datetime: string | null;
  departure_datetime: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface Ride {
  ride_id: number;
  ride_code: string | null;
  start_address: string;
  end_address: string;
  travel_datetime: string;
  total_seats: number;
  available_seats: number;
  base_fare: string | null;
  total_distance: number | null;
  total_duration: number | null;
  stops: RideStop[];
  total_fare?: string;
  departure_time?: string;
  partner?: {
    user?: {
      first_name: string;
      last_name: string;
      profile_image_url: string;
    };
  };
  search_context?: {
    total_fare: string;
    departure_time: string;
  };
  vehicle?: {
    vehicle_type: string;
    model: string | null;
    brand: string | null;
  };
}

interface SearchResults {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  rides: Ride[];
}

const FindRideStep2: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimatedDurations, setEstimatedDurations] = useState<{[key: number]: string}>({});
  const [priceOffers, setPriceOffers] = useState<{[key: number]: string}>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const getAuthToken = (): string => {
    return user?.token || localStorage.getItem('token') || '';
  };

  const validateToken = async (): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await axios.get(`${BASE_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      return response.data.valid === true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const estimateTravelTime = (distance: number, vehicleType?: string): string => {
    let averageSpeed = 60;
    if (vehicleType === 'car') averageSpeed = 65;
    else if (vehicleType === 'bike' || vehicleType === 'motorcycle') averageSpeed = 50;
    else if (vehicleType === 'auto') averageSpeed = 40;
    else if (vehicleType === 'suv') averageSpeed = 60;
    
    const hours = distance / averageSpeed;
    const totalHours = hours * 1.2;
    const hoursInt = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hoursInt) * 60);
    
    if (hoursInt > 0 && minutes > 0) return `${hoursInt}h ${minutes}m`;
    else if (hoursInt > 0) return `${hoursInt}h`;
    else return `${minutes}m`;
  };

  const calculateRideDuration = (ride: Ride): string => {
    if (ride.total_duration) {
      const hours = Math.floor(ride.total_duration / 60);
      const minutes = ride.total_duration % 60;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      else if (hours > 0) return `${hours}h`;
      else return `${minutes}m`;
    }
    
    if (ride.total_distance) return estimateTravelTime(ride.total_distance, ride.vehicle?.vehicle_type);
    
    if (ride.stops && ride.stops.length >= 2) {
      let totalDistance = 0;
      const sortedStops = [...ride.stops].sort((a, b) => a.stop_order - b.stop_order);
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const stop1 = sortedStops[i];
        const stop2 = sortedStops[i + 1];
        const distance = calculateDistance(stop1.latitude, stop1.longitude, stop2.latitude, stop2.longitude);
        totalDistance += distance;
      }
      return estimateTravelTime(totalDistance, ride.vehicle?.vehicle_type);
    }
    
    if (ride.stops && ride.stops.length >= 2) {
      const firstStop = ride.stops.find(s => s.stop_order === 1);
      const lastStop = ride.stops.find(s => s.stop_order === ride.stops.length);
      if (firstStop && lastStop) {
        const distance = calculateDistance(firstStop.latitude, firstStop.longitude, lastStop.latitude, lastStop.longitude);
        return estimateTravelTime(distance, ride.vehicle?.vehicle_type);
      }
    }
    
    return '3h 00m';
  };

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAuthenticated) {
        setError('Please login to view rides');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const isValidToken = await validateToken();
      if (!isValidToken) {
        setError('Your session has expired. Please login again.');
        logout();
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const searchParams = location.state?.searchParams || 
                          JSON.parse(localStorage.getItem('searchParams') || '{}');
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication token not found');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/rides/search`, {
        params: searchParams,
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.rides) {
        setSearchResults(response.data);
        const durations: {[key: number]: string} = {};
        response.data.rides.forEach((ride: Ride) => {
          durations[ride.ride_id] = calculateRideDuration(ride);
        });
        setEstimatedDurations(durations);
        localStorage.setItem('searchResults', JSON.stringify(response.data));
      } else {
        setError('No rides found for your search criteria.');
      }
    } catch (err: any) {
      console.error('Error fetching search results:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Your session has expired. Please login again.');
          logout();
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response.status === 400) {
          setError('Invalid search parameters. Please try again.');
        } else if (err.response.status === 404) {
          setError('No rides found for your search criteria.');
        } else {
          setError(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to load rides. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Please login to view rides');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const results = location.state?.searchResults || JSON.parse(localStorage.getItem('searchResults') || 'null');
    if (results) {
      setSearchResults(results);
      const durations: {[key: number]: string} = {};
      results.rides.forEach((ride: Ride) => {
        durations[ride.ride_id] = calculateRideDuration(ride);
      });
      setEstimatedDurations(durations);
      setLoading(false);
    } else {
      fetchSearchResults();
    }
  }, [location, isAuthenticated]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const calculateArrivalTime = (ride: Ride): string => {
    const departureTime = ride.search_context?.departure_time || ride.travel_datetime;
    const departure = new Date(departureTime);
    const durationText = estimatedDurations[ride.ride_id] || calculateRideDuration(ride);
    let hours = 0;
    let minutes = 0;
    const hourMatch = durationText.match(/(\d+)h/);
    const minuteMatch = durationText.match(/(\d+)m/);
    if (hourMatch) hours = parseInt(hourMatch[1]);
    if (minuteMatch) minutes = parseInt(minuteMatch[1]);
    const arrival = new Date(departure.getTime() + (hours * 60 + minutes) * 60000);
    return formatTime(arrival.toISOString());
  };

  const handlePriceOfferChange = (rideId: number, value: string) => {
    setPriceOffers(prev => ({
      ...prev,
      [rideId]: value
    }));
  };

  const handlePriceOffer = async (rideId: number) => {
    const price = priceOffers[rideId];
    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price amount');
      return;
    }

    try {
      if (!isAuthenticated) {
        setError('Please login to make an offer');
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Authentication token not found');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/rides/${rideId}/offer`,
        { offer_price: parseFloat(price) },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`Your offer of ₹${price} has been submitted successfully!`);
        setPriceOffers(prev => ({
          ...prev,
          [rideId]: ''
        }));
      }
    } catch (err: any) {
      console.error('Error submitting offer:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        logout();
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to submit offer. Please try again.');
      }
    }
  };

  const handleBookNow = async (ride: Ride) => {
    try {
      if (!isAuthenticated) {
        setError('Please login to book a ride');
        navigate('/login');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Authentication token not found');
        navigate('/login');
        return;
      }

      localStorage.setItem('selectedRide', JSON.stringify(ride));
      localStorage.setItem('estimatedDuration', estimatedDurations[ride.ride_id] || calculateRideDuration(ride));
      navigate('/find-ride3', { state: { ride } });
    } catch (error) {
      console.error('Error preparing booking:', error);
      setError('Failed to process booking. Please try again.');
    }
  };

  const handleRefreshResults = () => {
    fetchSearchResults();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21409A] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading rides...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-16">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-600 font-bold text-xl">!</div>
            </div>
            <p className="text-gray-800 text-lg font-semibold mb-2">{error}</p>
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => navigate('/')}
                className="bg-[#21409A] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#1a347d] transition-colors w-full"
              >
                ← Back to Home
              </button>
              {error.includes('login') && (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white text-[#21409A] border border-[#21409A] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors w-full"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6 pt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {searchResults?.rides[0]?.start_address || 'From'} → {searchResults?.rides[0]?.end_address || 'To'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {searchResults?.totalItems || 0} {searchResults?.totalItems === 1 ? 'ride' : 'rides'} available
              </p>
            </div>
          </div>
          {/* <button
            onClick={handleRefreshResults}
            className="text-[#21409A] hover:text-[#1a347d] font-medium text-sm"
          >
            Refresh Results
          </button> */}
        </div>

        {/* Main Ride List */}
        <div className="max-w-4xl mx-auto">
          {searchResults?.rides && searchResults.rides.length > 0 ? (
            <div className="space-y-4">
              {searchResults.rides.map((ride) => {
                const fare = ride.search_context?.total_fare || ride.base_fare || '0';
                const departureTime = ride.search_context?.departure_time || ride.travel_datetime;
                const duration = estimatedDurations[ride.ride_id] || calculateRideDuration(ride);
                const arrivalTime = calculateArrivalTime(ride);
                
                return (
                  <div key={ride.ride_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
                    {/* Ride Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={16} className="text-gray-500" />
                          <h2 className="font-semibold text-gray-900">
                            {ride.start_address} → {ride.end_address}
                          </h2>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(departureTime)} • {formatTime(departureTime)} - {arrivalTime}
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <div className="text-2xl font-bold text-[#21409A]">
                          ₹{parseInt(fare).toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-500 text-right">per seat</div>
                      </div>
                    </div>

                    {/* Time Line */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="text-left">
                          <div className="font-medium">{formatTime(departureTime)}</div>
                          <div className="text-xs text-gray-500">Departure</div>
                        </div>
                        <div className="flex-1 mx-4 relative">
                          <div className="h-[2px] bg-gray-300"></div>
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="bg-white border border-[#21409A] rounded-full px-3 py-1 text-xs font-medium">
                              {duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{arrivalTime}</div>
                          <div className="text-xs text-gray-500">Arrival</div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle and Seats */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Car size={18} className="text-[#21409A]" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {ride.vehicle?.brand || 'Vehicle'} {ride.vehicle?.model || ''}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {ride.vehicle?.vehicle_type || 'Standard'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {ride.available_seats} of {ride.total_seats} seats left
                        </span>
                      </div>
                    </div>

                    {/* Driver Info */}
                    {ride.partner?.user && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                          {ride.partner.user.profile_image_url ? (
                            <img 
                              src={ride.partner.user.profile_image_url} 
                              alt={ride.partner.user.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-600 font-medium">
                              {ride.partner.user.first_name?.[0] || 'D'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {ride.partner.user.first_name} {ride.partner.user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">Verified Driver</div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => navigate('/ride-details', { state: { ride } })}
                        className="text-[#21409A] hover:text-[#1a347d] font-medium text-sm"
                      >
                        View ride details →
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            value={priceOffers[ride.ride_id] || ''}
                            onChange={(e) => handlePriceOfferChange(ride.ride_id, e.target.value)}
                            placeholder="Offer price"
                            min="1"
                            step="1"
                            className="w-32 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#21409A]/30 focus:border-[#21409A]"
                          />
                        </div>
                        <button 
                          onClick={() => handlePriceOffer(ride.ride_id)}
                          className="bg-white text-[#21409A] border border-[#21409A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#21409A] hover:text-white transition-colors"
                        >
                          Make Offer
                        </button>
                        <button
                          onClick={() => handleBookNow(ride)}
                          className="bg-[#21409A] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1a347d] transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No rides found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or search again</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#21409A] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#1a347d] transition-colors"
              >
                ← Search Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FindRideStep2;