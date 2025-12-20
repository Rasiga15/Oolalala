import React from 'react';
import { FiChevronRight } from 'react-icons/fi';

interface Route {
  id: string;
  from: string;
  to: string;
  price: number;
}

const routes: Route[] = [
  { id: '1', from: 'Chennai', to: 'Bengaluru', price: 700 },
  { id: '2', from: 'Chennai', to: 'Vellore', price: 250 },
  { id: '3', from: 'Chennai', to: 'Tirupati', price: 400 },
  { id: '4', from: 'Chennai', to: 'Pondicherry', price: 300 },
  { id: '5', from: 'Chennai', to: 'Salem', price: 500 },
  { id: '6', from: 'Chennai', to: 'Coimbatore', price: 900 },
];

interface CuratedRoutesProps {
  onRouteSelect?: (route: Route) => void;
}

export const CuratedRoutes: React.FC<CuratedRoutesProps> = ({ onRouteSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header with padding */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Curated routes for you</h3>
      </div>
      
      {/* Routes list - removed lines, added padding */}
      <div className="pb-2">
        {routes.map((route, index) => (
          <button
            key={route.id}
            onClick={() => onRouteSelect?.(route)}
            className={`w-full text-left px-6 py-4 hover:bg-gray-50 
                       transition-all duration-200 ${index !== routes.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-medium">{route.from}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-900 font-medium">{route.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">₹{route.price}</span>
                <FiChevronRight className="text-gray-400" size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CuratedRoutes;