import React from 'react';
import { ArrowLeft, CheckCircle, Phone, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FindRideSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F8FC] to-[#EAF0FF] flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/find-ride3')}
        className="absolute top-6 left-6 text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Success Card - Height Reduced */}
      <div className="flex flex-col lg:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full">
        {/* LEFT - Reduced Height */}
        <div className="flex-1 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-xs text-gray-400">Booking Confirmed</p>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1">
            Chennai → Bengaluru
          </h2>

          <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="font-medium text-sm">02:50 PM, Today</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Drop-off</p>
              <p className="font-medium text-sm">05:10 PM</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-medium text-sm">2h 20m</p>
            </div>
          </div>

          {/* Accepted Price Badge */}
          <div className="inline-flex items-center gap-1 bg-[#EAF0FF] text-[#21409A] px-3 py-1 rounded-full text-xs font-medium mb-4">
            <CheckCircle size={12} />
            ₹600 Offer Accepted
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Your offer has been accepted by the driver. Please make payment to confirm your seat.
          </p>

          {/* Driver Details */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="font-medium text-gray-700 text-sm mb-2">Driver Details</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <span className="text-sm font-bold text-[#21409A]">JS</span>
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-1">
                  John Smith <CheckCircle size={12} className="text-green-500" />
                </p>
                <p className="text-xs text-gray-500">Hyundai Creta • TN 09 AB 1234</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone size={12} />
              <span>+91 98765 88832</span>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Car size={14} />
            <span>1 seat confirmed • AC • Space for 1 luggage</span>
          </div>
        </div>

        {/* RIGHT - Reduced Height */}
        <div className="w-full lg:w-[40%] bg-gradient-to-br from-[#21409A] to-[#1a347d] text-white p-5 md:p-6 flex flex-col justify-center">
          <div className="text-center mb-5">
            <p className="text-xs tracking-widest opacity-80 mb-1">BOARDING PASS</p>
            <p className="text-3xl md:text-4xl font-bold mb-1">₹600</p>
            <p className="text-xs opacity-90">Total Amount</p>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-xs">
              <span className="opacity-80">Seat Fare</span>
              <span>₹550</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="opacity-80">Service Fee</span>
              <span>₹50</span>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="flex justify-between font-medium text-sm">
                <span>Total</span>
                <span>₹600</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-blue-200 mb-4 text-center">
            Payment required before boarding.
          </p>

          <div className="space-y-2">
            <button className="w-full bg-white text-[#21409A] px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-100 transition">
              Make Payment
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full border border-white/30 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition"
            >
              View Booking Details
            </button>
          </div>

          <p className="text-xs opacity-70 mt-4 text-center">
            Booking ID: #RIDE20241012345
          </p>
        </div>
      </div>

      {/* Success Message - Moved Up */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs animate-pulse">
        🎉 Ride booked successfully!
      </div>
    </div>
  );
};

export default FindRideSuccess;