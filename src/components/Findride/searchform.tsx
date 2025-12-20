import React, { useState } from 'react';
import { FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import { MdLocationOn } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';


interface SearchFormProps {
  onSearch: (data: SearchData) => void;
}

export interface SearchData {
  meetupPoint: string;
  dropoffPoint: string;
  date: string;
  passengers: number;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [meetupPoint, setMeetupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [date, setDate] = useState('Today');
  const [passengers, setPassengers] = useState(1);
  const navigate = useNavigate();


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ meetupPoint, dropoffPoint, date, passengers });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meet-up Point with bottom border line */}
      <div className="relative pb-4 border-b border-gray-200">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <FiMapPin size={18} />
        </div>
        <input
          type="text"
          placeholder="Meet-up point..."
          value={meetupPoint}
          onChange={(e) => setMeetupPoint(e.target.value)}
          className="w-full py-3 px-4 pl-10 bg-gray-50 rounded-lg 
                     text-gray-900 placeholder-gray-500
                     focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500
                     transition-all duration-200 text-sm"
        />
      </div>

      {/* Drop-off Point with bottom border line */}
      <div className="relative pb-4 border-b border-gray-200">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MdLocationOn size={18} />
        </div>
        <input
          type="text"
          placeholder="Drop-off point..."
          value={dropoffPoint}
          onChange={(e) => setDropoffPoint(e.target.value)}
          className="w-full py-3 px-4 pl-10 bg-gray-50 rounded-lg 
                     text-gray-900 placeholder-gray-500
                     focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500
                     transition-all duration-200 text-sm"
        />
      </div>

      {/* Date and Passengers in same row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiCalendar size={16} />
          </div>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full py-3 px-4 pl-10 bg-gray-50 rounded-lg 
                       text-gray-900 text-sm
                       focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500
                       transition-all duration-200"
          />
        </div>

        {/* Passengers */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiUsers size={16} />
          </div>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full py-3 px-4 pl-10 bg-gray-50 rounded-lg 
                       text-gray-900 text-sm
                       focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500
                       transition-all duration-200
                       appearance-none cursor-pointer"
          >
            <option value={1}>1 Passenger</option>
            <option value={2}>2 Passengers</option>
            <option value={3}>3 Passengers</option>
            <option value={4}>4 Passengers</option>
          </select>
        </div>
      </div>

      {/* Search Button with #21409A color */}
     <button
  type="button"
  onClick={() => navigate('/find-ride2')}
  style={{
    backgroundColor: '#21409A',
  }}
  className="w-full py-3 mt-6 text-white font-medium rounded-lg 
             hover:bg-[#1a347d] transition-all duration-200 
             shadow-md hover:shadow-lg active:scale-[0.98]"
>
  Search Ride
</button>

    </form>
  );
};

export default SearchForm;