import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FindRideStep2: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'noon' | 'night'>('night');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFFFF] px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[#21409A] font-semibold">
          <button onClick={() => navigate('/find-ride')} className="flex items-center">
            <ArrowLeft size={18} />
          </button>
          <span>Chennai → Bengaluru</span>
        </div>
        <p className="text-sm text-gray-400">12 rides found</p>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-3 mb-8">
        {[
          { key: 'day', label: 'Day', icon: <Sun size={14} /> },
          { key: 'noon', label: 'Noon', icon: <Sun size={14} /> },
          { key: 'night', label: 'Night', icon: <Moon size={14} /> },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTimeFilter(item.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-1 border
              ${
                timeFilter === item.key
                  ? 'bg-[#21409A] text-white border-[#21409A]'
                  : 'bg-white text-[#21409A] border-[#21409A]'
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Ride List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Ride Card 1 */}
          <div className="border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between mb-3">
              <p className="font-semibold">Nagpur → Chennai</p>
              <p className="font-bold text-[#21409A]">₹2,320</p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>02:50</span>
              <div className="flex-1 mx-3 h-[2px] bg-gray-200 relative">
                <span className="absolute left-1/2 -top-1.5 w-3 h-3 bg-[#21409A] rounded-full"></span>
              </div>
              <span>17:10</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Chris James</p>
                <p className="text-sm text-gray-400">⭐ 4.9</p>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-sm text-[#21409A] underline hover:no-underline">
                  Offer a different price
                </button>
                <button
                  onClick={() => navigate('/find-ride3')}
                  className="bg-[#21409A] text-white px-5 py-2 rounded-full text-sm
                           hover:bg-[#1a347d] transition-colors whitespace-nowrap"
                >
                  Request
                </button>
              </div>
            </div>
          </div>

          {/* Ride Card 2 */}
          <div className="border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between mb-3">
              <p className="font-semibold">Mumbai → Pune</p>
              <p className="font-bold text-[#21409A]">₹650</p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>18:00</span>
              <div className="flex-1 mx-3 h-[2px] bg-gray-200 relative">
                <span className="absolute left-1/2 -top-1.5 w-3 h-3 bg-[#21409A] rounded-full"></span>
              </div>
              <span>20:00</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Chris James</p>
                <p className="text-sm text-gray-400">⭐ 4.9</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="number"
                  placeholder="₹ 600"
                  className="w-24 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#21409A]"
                />
                <button className="bg-[#21409A] text-white px-5 py-2 rounded-full text-sm hover:bg-[#1a347d] transition-colors">
                  Offer
                </button>
              </div>
            </div>

            <p className="text-xs text-green-600 mt-3">
              Make your best offer (one time)
            </p>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-3 text-gray-800">Good time to travel</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">☀ Morning – More availability</li>
              <li className="flex items-center gap-2">🌤 Afternoon – Balanced demand</li>
              <li className="flex items-center gap-2">🌙 Night – Lower price chances</li>
            </ul>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold text-gray-800">Seats fill fast today</p>
            <p className="text-sm text-gray-500 mt-2">
              Most rides have 1–2 seats left. Book early to secure your seat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindRideStep2;