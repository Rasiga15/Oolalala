// src/components/modals/IdProofVerifyModal.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../../assets/Mainlogo.svg';

interface IdProofVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyIdProof: () => void;
}

const IdProofVerifyModal: React.FC<IdProofVerifyModalProps> = ({ 
  isOpen, 
  onClose, 
  onVerifyIdProof 
}) => {
  const navigate = useNavigate();

  const handleNavigateToIdProof = () => {
    onClose();
    onVerifyIdProof();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg w-[340px] mx-4">
        {/* Header with Logo */}
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
                ID Proof Required
              </h3>
              <p className="text-sm text-gray-500">
                Verify your identity first
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Alert Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 text-center">
            You need to verify your ID proof before adding a vehicle.
          </p>
          
          <div className="text-xs text-gray-500 space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span>Upload valid Aadhaar or Driving License</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span>Admin verification required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span>Verification takes 24-48 hours</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-xs text-yellow-700 text-center">
              <span className="font-medium">Note:</span> Once ID proof is verified, you can add vehicles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleNavigateToIdProof}
              className="w-full text-white font-medium py-2.5 px-4 rounded-md transition-colors text-sm"
              style={{ backgroundColor: '#21409A' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a3278'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#21409A'}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} />
                Verify ID Proof
              </div>
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdProofVerifyModal;