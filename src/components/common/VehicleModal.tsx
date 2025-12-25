// src/components/modals/VehicleModal.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import logo from '../../assets/Mainlogo.svg'; // Import logo from src/assets

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded?: () => void;
}

const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onVehicleAdded }) => {
  const navigate = useNavigate();

  const handleAddVehicle = () => {
    onClose();
    navigate('/vehicle-management');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal - Simple Card Style */}
      <div className="relative bg-white rounded-lg shadow-lg w-[340px] mx-4">
        {/* Header with Logo Centered */}
        <div className="p-4 border-b">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center mb-2">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-16 h-16"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-lg">
                Add Your Vehicle
              </h3>
              <p className="text-sm text-gray-500">
                Required to offer rides
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3 text-center">
            You need to add and verify a vehicle before you can offer rides.
          </p>
          
          <div className="text-xs text-gray-500 space-y-1 mb-4 text-center">
            <p>• Vehicle details are required</p>
            <p>• Verification takes 24-48 hours</p>
            <p>• Admin approval needed</p>
          </div>

          {/* Single Button with your color #21409A */}
          <button
            onClick={handleAddVehicle}
            className="w-full text-white font-medium py-2.5 px-4 rounded-md transition-colors text-sm"
            style={{ backgroundColor: '#21409A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a3278'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#21409A'}
          >
            Add Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleModal;