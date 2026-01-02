// components/modals/CancelConfirmationPopup.tsx
import React from 'react';

import logo from '@/assets/Mainlogo.svg'; 

interface CancelConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingId: number;
  isLoading: boolean;
  error: string | null;
  bookingNumber?: string;
}

const CancelConfirmationPopup: React.FC<CancelConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  isLoading,
  error,
  bookingNumber
}) => {
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
                Cancel Booking
              </h3>
              <p className="text-sm text-gray-500">
                {bookingNumber ? `Booking: ${bookingNumber}` : `ID: ${bookingId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3 text-center">
            Are you sure you want to cancel this booking?
          </p>
          
          <div className="text-xs text-gray-500 space-y-1 mb-4 text-center">
            <p className="text-yellow-600 font-medium">⚠️ Cancellation charges may apply</p>
            <p>✅ Full refund if cancelled within free window</p>
            <p>⚠️ 10% penalty may be deducted after free window</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs text-center">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-md transition-colors text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              No, Keep Booking
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white font-medium py-2.5 px-4 rounded-md transition-colors text-sm hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cancelling...
                </>
              ) : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationPopup;