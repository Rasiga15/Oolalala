import React, { useState } from 'react';
import { ArrowLeft, MapPin, User, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FindRideStep3: React.FC = () => {
  const navigate = useNavigate();
  const [offer, setOffer] = useState(630);

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-3 py-3">
      {/* Header - Compact */}
      <div className="flex items-center justify-center relative mb-5">
        <button
          onClick={() => navigate('/find-ride')}
          className="absolute left-0 text-gray-500 hover:text-gray-700 p-1"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-800 text-base">Request Ride</h2>
      </div>

      {/* Main Layout - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-5xl mx-auto">
        {/* LEFT - Compact */}
        <div className="lg:col-span-8 space-y-4">
          {/* User Card - Compact */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Priya Sharma</p>
                  <p className="text-xs text-gray-500">Verified Driver</p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                1 Seat Available
              </span>
            </div>

            {/* Pickup - Compact */}
            <div className="flex gap-2 mb-3">
              <MapPin size={14} className="text-[#21409A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">Pickup Location</p>
                <p className="text-xs text-gray-500">
                  123 Market Street, Downtown, Bangalore
                </p>
              </div>
            </div>

            {/* Drop - Compact */}
            <div className="flex gap-2">
              <MapPin size={14} className="text-[#21409A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">Drop-off Location</p>
                <p className="text-xs text-gray-500">
                  458 Main Avenue, Airport Road, Bangalore
                </p>
              </div>
            </div>
          </div>

          {/* Offer Section - Compact */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <div>
                <p className="text-xs text-gray-500">Passenger Offered:</p>
                <p className="text-xl font-bold text-[#21409A]">₹600</p>
              </div>
              <p className="text-xs text-gray-400">Original: ₹650</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm font-medium">Your Counter Offer:</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOffer((p) => Math.max(500, p - 10))}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg hover:bg-gray-200 transition"
                >
                  −
                </button>

                <div className="text-center">
                  <p className="text-xl font-bold text-[#21409A]">₹{offer}</p>
                  <p className="text-xs text-gray-500 mt-0.5">per person</p>
                </div>

                <button
                  onClick={() => setOffer((p) => p + 10)}
                  className="w-8 h-8 rounded-full bg-[#EAF0FF] flex items-center justify-center text-lg text-[#21409A] hover:bg-[#d4e1ff] transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-gray-800">₹{offer} (1 seat)</p>
            </div>
          </div>

          {/* Actions - Compact */}
          <div className="space-y-2">
            <button
              onClick={() => navigate('/find-ride/success')}
              className="w-full py-2.5 bg-[#21409A] text-white rounded-lg font-medium text-sm hover:bg-[#1a347d] transition"
            >
              Accept Offer
            </button>

            <button className="w-full py-2.5 border border-[#21409A] text-[#21409A] rounded-lg font-medium text-sm hover:bg-[#F8FAFF] transition">
              Edit & Send Counter Offer
            </button>

            <button 
              onClick={() => navigate(-1)}
              className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* RIGHT - Compact */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <p className="font-medium mb-4 text-gray-800 text-sm">Quick Check</p>

            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 text-xs">Passenger Verified</p>
                  <p className="text-gray-500 text-xs">ID checked</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 text-xs">Pickup on Main Road</p>
                  <p className="text-gray-500 text-xs">Easy access</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 text-xs">Drop-off Near Airport</p>
                  <p className="text-gray-500 text-xs">Convenient</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 text-xs">Instant Confirmation</p>
                  <p className="text-gray-500 text-xs">Quick response</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindRideStep3;