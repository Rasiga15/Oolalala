// components/AddStopModal.tsx
import React from 'react';
import { X } from 'lucide-react';

const AddStopModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  position: { lat: number; lng: number } | null;
  address: string;
}> = ({ isOpen, onClose, onConfirm, position, address }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Confirm Stop Location</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Location Address:</div>
          <div className="font-medium text-foreground p-3 bg-accent/30 rounded-lg">
            {address || 'Fetching address...'}
          </div>
          {position && (
            <div className="text-xs text-muted-foreground mt-2">
              Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Add Stop
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStopModal;