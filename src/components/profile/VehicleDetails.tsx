import { useState } from 'react';
import { Car, Plus, Edit, Save, X, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  model: string;
  make: string;
  year: string;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
}

interface VehicleDetailsProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, vehicle: Omit<Vehicle, 'id'>) => void;
  onDeleteVehicle: (id: string) => void;
}

export const VehicleDetails = ({ 
  vehicles, 
  onAddVehicle, 
  onUpdateVehicle, 
  onDeleteVehicle 
}: VehicleDetailsProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    make: '',
    year: '',
    color: '',
    registrationNumber: '',
    seatingCapacity: 4,
  });

  const resetForm = () => {
    setFormData({
      model: '',
      make: '',
      year: '',
      color: '',
      registrationNumber: '',
      seatingCapacity: 4,
    });
  };

  const handleSave = () => {
    if (editingId) {
      onUpdateVehicle(editingId, formData);
      setEditingId(null);
    } else {
      onAddVehicle({ ...formData, id: Date.now().toString() });
      setIsAdding(false);
    }
    resetForm();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      model: vehicle.model,
      make: vehicle.make,
      year: vehicle.year,
      color: vehicle.color,
      registrationNumber: vehicle.registrationNumber,
      seatingCapacity: vehicle.seatingCapacity,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (vehicles.length === 0 && !isAdding) {
    return (
      <div className="text-center py-12">
        <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Vehicle Details</h3>
        <p className="text-muted-foreground mb-6">
          Add your vehicle information to start offering rides
        </p>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
        >
          <Plus className="h-5 w-5" />
          Add Vehicle
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vehicle Details</h2>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g., Honda"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g., City"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                placeholder="e.g., 2023"
                min="2000"
                max="2030"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="e.g., Red"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="e.g., TN01AB1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seating Capacity
              </label>
              <select
                value={formData.seatingCapacity}
                onChange={(e) => handleChange('seatingCapacity', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value={2}>2 Seats</option>
                <option value={4}>4 Seats</option>
                <option value={6}>6 Seats</option>
                <option value={7}>7 Seats</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {editingId ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(vehicle)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteVehicle(vehicle.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Color:</span>
              <p className="font-medium">{vehicle.color}</p>
            </div>
            <div>
              <span className="text-gray-600">Registration:</span>
              <p className="font-medium">{vehicle.registrationNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Seats:</span>
              <p className="font-medium">{vehicle.seatingCapacity}</p>
            </div>
            <div>
              <span className="text-gray-600">Year:</span>
              <p className="font-medium">{vehicle.year}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};