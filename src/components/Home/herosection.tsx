import React from 'react';
import { FiMapPin, FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import carImage from '../../assets/HomeMainBanner.png';

export const HeroSection = () => {
  const navigate = useNavigate();

  const handleFindRideClick = () => {
    navigate('/find-ride');
  };

  const handleOfferRideClick = () => {
    navigate('/offer-ride1');
  };

  return (
    <section className="relative bg-white pt-12 lg:pt-16 pb-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <div className="border-l-4 border-[#21409A] pl-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 italic leading-tight">
                Find Your Perfect<br />
                Ride in Minutes.
              </h1>
            </div>

            <p className="text-gray-600 text-base md:text-lg">
              Trusted drivers, affordable trips, and a community that moves together.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFindRideClick}
                className="bg-[#21409A] text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#21409A]/90 transition cursor-pointer"
              >
                Find a ride <FiArrowRight />
              </button>

              <button
                onClick={handleOfferRideClick}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
              >
                Offer ride
              </button>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={carImage}
              alt="Car"
              className="w-full max-w-md lg:max-w-lg object-contain"
            />
          </div>
        </div>

        {/* 🔥 SEARCH FORM - OVERLAP */}
        <div className="absolute left-0 right-0 -bottom-24 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 md:p-6 max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
              
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <FiMapPin className="text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Meet-up point..."
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <FiMapPin className="text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Drop-off point..."
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <FiCalendar className="text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="When..."
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <FiUser className="text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Seats..."
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>

              <button className="bg-[#21409A] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#21409A]/90 transition w-full cursor-pointer">
                Search Ride
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button className="border rounded-full px-4 py-2 text-sm hover:text-[#21409A] hover:border-[#21409A]">
                👩 Ladies only
              </button>
              <button className="border rounded-full px-4 py-2 text-sm hover:text-[#21409A] hover:border-[#21409A]">
                🧓 Senior Citizen
              </button>
              <button className="border rounded-full px-4 py-2 text-sm hover:text-[#21409A] hover:border-[#21409A]">
                👶 Kids only
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
