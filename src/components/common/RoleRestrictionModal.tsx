import { Button } from '../common/Button';
import { User, ArrowRight, X } from 'lucide-react';
import logoImage from '../../assets/Rectangle.svg';

interface RoleRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPersonal: () => void;
}

export const RoleRestrictionModal = ({ 
  isOpen, 
  onClose, 
  onSwitchToPersonal 
}: RoleRestrictionModalProps) => {
  
  const handleSwitchClick = () => {
    onClose();
    onSwitchToPersonal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        
        {/* Header with close button */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Logo */}
          <div className="h-16 w-24 mx-auto mb-4">
            <img 
              src={logoImage} 
              alt="OOLALALA Logo" 
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-0">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Partner Access Required
            </h3>
            <p className="text-gray-600">
              This section is only available for Partners. To access Vehicle Details and Business Details, please update your role to Partner in your Personal Details.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSwitchClick}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <User className="h-4 w-4" />
              Switch to Partner Role
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <button
              onClick={onClose}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};