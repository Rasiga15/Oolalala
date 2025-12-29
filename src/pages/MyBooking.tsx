import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser, FiSliders, FiChevronLeft } from 'react-icons/fi';
import { FaCar, FaCheckCircle } from 'react-icons/fa';
import { Button } from '@/components/common/Button'; 

type TabType = 'upcoming' | 'past' | 'cancelled';
type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

interface Booking {
  id: string;
  status: BookingStatus;
  price: number;
  fromLocation: string;
  fromAddress: string;
  toLocation: string;
  toAddress: string;
  date: string;
  time: string;
  seats: number;
  driverName: string;
  vehicle: string;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    status: 'confirmed',
    price: 299,
    fromLocation: '123 Main st, cityvilley',
    fromAddress: '456 oak ave, Townburg',
    toLocation: 'Downtown Manhattan',
    toAddress: 'Times square, New york, NY',
    date: 'Jul 18, 2025',
    time: '5:30 PM',
    seats: 2,
    driverName: 'John Dae',
    vehicle: 'Toyota camry - ABC - 123',
  },
  {
    id: '2',
    status: 'pending',
    price: 570,
    fromLocation: '789 Pine Ln, Suburbia',
    fromAddress: '101 center blazza, Downtown',
    toLocation: 'Grand central Terinal',
    toAddress: '89 E 42nd St, New york, NY',
    date: 'Jul 09, 2025',
    time: '12:15 PM',
    seats: 3,
    driverName: 'John Smith',
    vehicle: 'Honda Civic - XYZ - 789',
  },
];

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-600 border border-green-200',
      pending: 'bg-orange-100 text-orange-600 border border-orange-200',
      cancelled: 'bg-red-100 text-red-600 border border-red-200',
    };
    const labels = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredBookings = mockBookings.filter((booking) => {
    if (activeTab === 'upcoming') return booking.status === 'confirmed' || booking.status === 'pending';
    if (activeTab === 'past') return false;
    if (activeTab === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <main className="w-full px-2 sm:px-3 lg:px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column - Bookings - Takes 70% width */}
          <div className="lg:w-[70%]">
            {/* Tabs and Filter */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <Button
                  variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('upcoming')}
                  className={`rounded-full ${activeTab === 'upcoming' ? '' : 'hover:bg-gray-200'}`}
                >
                  Upcoming
                </Button>
                <Button
                  variant={activeTab === 'past' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('past')}
                  className={`rounded-full ${activeTab === 'past' ? '' : 'hover:bg-gray-200'}`}
                >
                  Past
                </Button>
                <Button
                  variant={activeTab === 'cancelled' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('cancelled')}
                  className={`rounded-full ${activeTab === 'cancelled' ? '' : 'hover:bg-gray-200'}`}
                >
                  Cancelled
                </Button>
              </div>
              <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                <FiSliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Booking Cards */}
            <div className="space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                  No bookings found in this category.
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 w-full max-w-[800px] mx-auto">
                    {/* Status and Price Row */}
                    <div className="flex items-start justify-between mb-3">
                      {getStatusBadge(booking.status)}
                      <span className="text-lg sm:text-xl font-bold text-gray-900">₹{booking.price}</span>
                    </div>

                    {/* Route Info */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{booking.fromLocation}</p>
                        <p className="text-gray-500 text-xs truncate">{booking.fromAddress}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{booking.toLocation}</p>
                        <p className="text-gray-500 text-xs truncate">{booking.toAddress}</p>
                      </div>
                    </div>

                    {/* Date and Seats */}
                    <div className="flex items-center gap-4 sm:gap-6 text-gray-500 text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>{booking.date} at {booking.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FiUser className="w-3.5 h-3.5" />
                        <span>{booking.seats} Seats</span>
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{booking.driverName}</p>
                        <p className="text-gray-500 text-xs truncate">{booking.vehicle}</p>
                      </div>
                      <FaCar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Manage Booking Button - Centered */}
                    <div className="flex justify-center">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full"
                      >
                        Manage Booking
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Stats and Tips - Takes 30% width */}
          <div className="lg:w-[30%] space-y-3">
            {/* Your Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Your Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-xs">Total Upcoming Bookings</p>
                  <p className="text-lg font-bold text-gray-900">3</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Seats Booked</p>
                  <p className="text-lg font-bold text-gray-900">4</p>
                </div>
              </div>
            </div>

            {/* Helpful Tips Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Helpful Tips</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FaCheckCircle className="w-4 h-4 text-[#21409A] mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 text-xs">Arrive 10 minutes early to your pickup point.</p>
                </div>
                <div className="flex items-start gap-2">
                  <FaCheckCircle className="w-4 h-4 text-[#21409A] mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 text-xs">Don't forget to check your driver's profile and reviews.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyBookings;