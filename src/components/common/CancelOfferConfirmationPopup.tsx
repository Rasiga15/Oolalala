// components/modals/CancelConfirmationPopup.tsx
import React from 'react';
import logo from '@/assets/Mainlogo.svg';

interface CancelConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rideId: number;
  startAddress: string;
  endAddress: string;
  travelDate: string;
  isLoading?: boolean;
  error?: string | null;
}

export function CancelConfirmationPopup({
  isOpen,
  onClose,
  onConfirm,
  rideId,
  startAddress,
  endAddress,
  travelDate,
  isLoading = false,
  error = null
}: CancelConfirmationPopupProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
                Cancel Trip
              </h3>
              <p className="text-sm text-gray-500">
                Trip: #{rideId}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Trip Details */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {startAddress} → {endAddress}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(travelDate)}
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-3 text-center">
            Are you sure you want to cancel this entire trip?
          </p>
          
          <div className="text-xs text-gray-500 space-y-1 mb-4 text-center">
            <p className="text-red-600 font-medium">⚠️ This will cancel for ALL riders</p>
            <p>✅ Full refunds will be issued to all riders</p>
            <p>⚠️ All bookings will be cancelled automatically</p>
            <p>❌ This action cannot be undone</p>
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
              No, Keep Trip
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
}