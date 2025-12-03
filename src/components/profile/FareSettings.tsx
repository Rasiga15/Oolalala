import { useState, useEffect } from 'react';
import { IndianRupee, X } from 'lucide-react';

interface FareSettingsType {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
}

interface FareSettingsProps {
  fareSettings: FareSettingsType;
  onSave: (fareSettings: FareSettingsType) => void;
}

const defaultFareSettings: FareSettingsType = {
  baseFare: 50,
  perKmRate: 12,
  perMinuteRate: 2,
  minimumFare: 80,
};

export const FareSettings = ({ fareSettings, onSave }: FareSettingsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localFare, setLocalFare] = useState<FareSettingsType>(fareSettings);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedFareSettings = localStorage.getItem('fareSettings');
    if (savedFareSettings) {
      setLocalFare(JSON.parse(savedFareSettings));
    }
  }, []);

  // Save to localStorage whenever fareSettings changes
  useEffect(() => {
    localStorage.setItem('fareSettings', JSON.stringify(fareSettings));
  }, [fareSettings]);

  const handleSave = () => {
    onSave(localFare);
    setIsModalOpen(false);
  };

  const handleReset = () => {
    setLocalFare(defaultFareSettings);
  };

  const handleChange = (field: keyof FareSettingsType, value: string) => {
    // Convert string to number, remove any non-numeric characters except decimal
    const numericValue = value === '' ? 0 : parseFloat(value.replace(/[^\d.]/g, ''));
    
    setLocalFare(prev => ({ 
      ...prev, 
      [field]: isNaN(numericValue) ? 0 : numericValue
    }));
  };

  const formatDisplayValue = (value: number) => {
    return value === 0 ? '' : value.toString();
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
        </div>

        {/* Fare Settings Display Card */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Fare Settings</h3>
                <p className="text-sm text-gray-600">Configure your ride pricing rates</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Configure Fare
            </button>
          </div>
          
          {/* Current Fare Summary Display */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-600">₹{fareSettings.baseFare}</p>
              <p className="text-xs text-gray-600 mt-1">Base Fare</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-600">₹{fareSettings.perKmRate}/km</p>
              <p className="text-xs text-gray-600 mt-1">Per KM</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-600">₹{fareSettings.perMinuteRate}/min</p>
              <p className="text-xs text-gray-600 mt-1">Per Minute</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-100">
              <p className="text-2xl font-bold text-green-600">₹{fareSettings.minimumFare}</p>
              <p className="text-xs text-gray-600 mt-1">Minimum Fare</p>
            </div>
          </div>

          {/* Example Calculation Display */}
          <div className="mt-6 bg-white border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Current Fare Calculation Example:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex justify-between">
                <span>Base Fare:</span>
                <span className="font-medium">₹{fareSettings.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span>Distance (5km × ₹{fareSettings.perKmRate}/km):</span>
                <span className="font-medium">₹{5 * fareSettings.perKmRate}</span>
              </div>
              <div className="flex justify-between">
                <span>Time (15min × ₹{fareSettings.perMinuteRate}/min):</span>
                <span className="font-medium">₹{15 * fareSettings.perMinuteRate}</span>
              </div>
              <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                <span className="font-bold">Total Fare:</span>
                <span className="font-bold text-green-600">
                  ₹{Math.max(
                    fareSettings.baseFare + (5 * fareSettings.perKmRate) + (15 * fareSettings.perMinuteRate),
                    fareSettings.minimumFare
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> These fare settings will be used when you offer rides to passengers. 
            You can adjust them anytime based on your preferences.
          </p>
        </div>
      </div>

      {/* Fare Settings Modal - Opens when Configure Fare button clicked */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Configure Fare Settings</h2>
                  <p className="text-sm text-gray-600">Set your preferred fare rates</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Row 1: Base Fare & Per KM Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Base Fare Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Base Fare (₹)
                  </label>
                  <input
                    type="text"
                    value={formatDisplayValue(localFare.baseFare)}
                    onChange={(e) => handleChange('baseFare', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter base fare"
                  />
                  <p className="text-xs text-gray-500">
                    Initial charge for every ride
                  </p>
                </div>

                {/* Per KM Rate Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate per Kilometer (₹/km)
                  </label>
                  <input
                    type="text"
                    value={formatDisplayValue(localFare.perKmRate)}
                    onChange={(e) => handleChange('perKmRate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter rate per km"
                  />
                  <p className="text-xs text-gray-500">
                    Charged for each kilometer traveled
                  </p>
                </div>
              </div>

              {/* Row 2: Per Minute Rate & Minimum Fare */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Per Minute Rate Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate per Minute (₹/min)
                  </label>
                  <input
                    type="text"
                    value={formatDisplayValue(localFare.perMinuteRate)}
                    onChange={(e) => handleChange('perMinuteRate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter rate per minute"
                  />
                  <p className="text-xs text-gray-500">
                    Charged for waiting and slow traffic
                  </p>
                </div>

                {/* Minimum Fare Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Fare (₹)
                  </label>
                  <input
                    type="text"
                    value={formatDisplayValue(localFare.minimumFare)}
                    onChange={(e) => handleChange('minimumFare', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter minimum fare"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum charge for any ride
                  </p>
                </div>
              </div>

              {/* Live Example Calculation */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-blue-900 mb-4 text-lg">Live Preview</h4>
                <p className="text-sm text-blue-800 mb-3 font-medium">
                  For a 5km ride taking 15 minutes:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Base Fare:</span>
                    <span className="font-semibold">₹{localFare.baseFare || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Distance (5km × ₹{localFare.perKmRate || 0}/km):</span>
                    <span className="font-semibold">₹{5 * (localFare.perKmRate || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Time (15min × ₹{localFare.perMinuteRate || 0}/min):</span>
                    <span className="font-semibold">₹{15 * (localFare.perMinuteRate || 0)}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-900 font-bold">Subtotal:</span>
                      <span className="font-bold">
                        ₹{(localFare.baseFare || 0) + (5 * (localFare.perKmRate || 0)) + (15 * (localFare.perMinuteRate || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-blue-900 font-bold">Minimum Fare Applied:</span>
                      <span className="font-bold text-green-600">
                        ₹{Math.max(
                          (localFare.baseFare || 0) + (5 * (localFare.perKmRate || 0)) + (15 * (localFare.perMinuteRate || 0)),
                          localFare.minimumFare || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-4 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};