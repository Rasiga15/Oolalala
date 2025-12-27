import { X, Sliders } from "lucide-react";
import { useState } from "react";

interface FilterOptions {
  priceRange: [number, number];
  departureTime: string[];
  vehicleType: string[];
  amenities: string[];
  sortBy: 'price_asc' | 'price_desc' | 'time_asc' | 'time_desc' | 'seats_desc';
}

interface FilterPanelProps {
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  onClose: () => void;
  onClear: () => void;
}

const FilterPanel = ({ filters, onApplyFilters, onClose, onClear }: FilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handlePriceChange = (index: number, value: number) => {
    const newRange = [...localFilters.priceRange] as [number, number];
    newRange[index] = value;
    if (newRange[0] > newRange[1]) {
      if (index === 0) newRange[1] = value;
      else newRange[0] = value;
    }
    setLocalFilters(prev => ({ ...prev, priceRange: newRange }));
  };

  const handleTimeToggle = (time: string) => {
    setLocalFilters(prev => ({
      ...prev,
      departureTime: prev.departureTime.includes(time)
        ? prev.departureTime.filter(t => t !== time)
        : [...prev.departureTime, time]
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setLocalFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    setLocalFilters(prev => ({ ...prev, sortBy }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({
      priceRange: [0, 10000],
      departureTime: [],
      vehicleType: [],
      amenities: [],
      sortBy: 'time_asc'
    });
    onClear();
  };

  const timeOptions = [
    { value: 'morning', label: 'Morning (5 AM - 12 PM)', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)', icon: '☀️' },
    { value: 'evening', label: 'Evening (5 PM - 10 PM)', icon: '🌆' },
    { value: 'night', label: 'Night (10 PM - 5 AM)', icon: '🌙' }
  ];

  const amenityOptions = [
    { value: 'ac', label: 'AC', icon: '❄️' },
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'charging', label: 'Charging', icon: '🔋' },
    { value: 'luggage', label: 'Extra Luggage', icon: '🧳' }
  ];

  const sortOptions = [
    { value: 'time_asc', label: 'Departure Time (Earliest)' },
    { value: 'time_desc', label: 'Departure Time (Latest)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'seats_desc', label: 'Most Seats Available' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Price Range */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Price Range (₹)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="ml-4 text-sm text-gray-600">
                Min: <span className="font-semibold">₹{localFilters.priceRange[0]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="ml-4 text-sm text-gray-600">
                Max: <span className="font-semibold">₹{localFilters.priceRange[1]}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>₹0</span>
              <span>₹5,000</span>
              <span>₹10,000</span>
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Departure Time</h3>
          <div className="grid grid-cols-2 gap-2">
            {timeOptions.map((time) => (
              <button
                key={time.value}
                onClick={() => handleTimeToggle(time.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  localFilters.departureTime.includes(time.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{time.icon}</span>
                  <span className="text-sm font-medium">{time.label.split(' ')[0]}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{time.label.split('(')[1]?.replace(')', '')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((amenity) => (
              <button
                key={amenity.value}
                onClick={() => handleAmenityToggle(amenity.value)}
                className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-colors ${
                  localFilters.amenities.includes(amenity.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span>{amenity.icon}</span>
                <span className="text-sm">{amenity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value as FilterOptions['sortBy'])}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  localFilters.sortBy === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{option.label}</span>
                  {localFilters.sortBy === option.value && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;