import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Check, Car, Plus, Edit, Trash2, AlertCircle, Info, Calendar, Tag, X } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';

const VehicleManagement: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Set token when component mounts or user changes
  useEffect(() => {
    if (user?.token) {
      vehicleApi.setToken(user.token);
    }
  }, [user]);

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleApi.getVehicles();
      
      if (response.success && response.data) {
        setVehicles(response.data);
      } else {
        setError(response.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateVehicleNumber = (number: string): boolean => {
    if (!number.trim()) {
      setFormError('Vehicle number is required');
      return false;
    }
    
    const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/;
    if (!regex.test(number.toUpperCase())) {
      setFormError('Please enter a valid vehicle number (e.g., TN01CD1234)');
      return false;
    }
    
    setFormError('');
    return true;
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVehicleNumber(vehicleNumber)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await vehicleApi.createVehicle({
        vehicleNumber: vehicleNumber.toUpperCase()
      });

      if (response.success) {
        await fetchVehicles();
        setVehicleNumber('');
        setShowAddForm(false);
        setSuccessMessage(response.message || 'Vehicle added successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Failed to add vehicle');
      }
    } catch (err) {
      setError('An error occurred while adding vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingVehicle || !validateVehicleNumber(vehicleNumber)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await vehicleApi.updateVehicle(editingVehicle.id, {
        vehicleNumber: vehicleNumber.toUpperCase()
      });

      if (response.success) {
        await fetchVehicles();
        setVehicleNumber('');
        setEditingVehicle(null);
        setSuccessMessage(response.message || 'Vehicle updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Failed to update vehicle');
      }
    } catch (err) {
      setError('An error occurred while updating vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (vehicleId: number) => {
    setVehicleToDelete(vehicleId);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await vehicleApi.deleteVehicle(vehicleToDelete);
      
      if (response.success) {
        await fetchVehicles();
        setVehicleNumber('');
        setEditingVehicle(null);
        setShowAddForm(false);
        setSuccessMessage(response.message || 'Vehicle deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Failed to delete vehicle');
      }
    } catch (err) {
      setError('An error occurred while deleting vehicle');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    }
  };

  const startEditing = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleNumber(vehicle.number_plate);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setFormError('');
    setShowAddForm(false);
  };

  const startAdding = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setFormError('');
    setShowAddForm(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 md:px-6 py-4 border-b border-border bg-card">
        <Link to="/profile" className="p-2 hover:bg-secondary rounded-full transition-colors">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
          Vehicle Management
        </h1>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground mb-8">
            Manage your registered vehicles.
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Vehicles List Section */}
            <div>
              {/* Header with Add Button */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your Vehicles</h2>
                  <p className="text-sm text-muted-foreground">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
                <Button
                  onClick={startAdding}
                  leftIcon={<Plus size={20} />}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Add New Vehicle
                </Button>
              </div>

              {/* Vehicles List */}
              {vehicles.length === 0 ? (
                <div className="bg-card rounded-lg border p-8 text-center">
                  <Car size={64} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Vehicles Found</h3>
                  <p className="text-muted-foreground mb-6">Click "Add New Vehicle" to add your first vehicle</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id} 
                      className={`bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow duration-200 ${
                        editingVehicle?.id === vehicle.id ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      {/* Vehicle Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car size={18} className="text-primary" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-foreground tracking-wide">
                              {vehicle.number_plate}
                            </h2>
                            <div className="flex items-center gap-2">
                              {/* Verification Status Badge */}
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                                vehicle.verification_status === 'verified' 
                                  ? 'bg-green-100 text-green-800'
                                  : vehicle.verification_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {vehicle.verification_status === 'verified' && <Check size={12} />}
                                {vehicle.verification_status.charAt(0).toUpperCase() + 
                                 vehicle.verification_status.slice(1)}
                              </span>
                              
                              {/* Vehicle Type */}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag size={12} />
                                {vehicle.vehicle_type || 'Car'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(vehicle)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Edit Vehicle"
                          >
                            <Edit size={18} className="text-muted-foreground" />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(vehicle.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Vehicle"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-muted-foreground" />
                          <span>Added: {formatDate(vehicle.created_at)}</span>
                        </div>
                        {vehicle.verification_status === 'pending' && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Info size={12} />
                            <span>Under review</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add/Edit Form Section - Shows only when adding/editing */}
            {(showAddForm || editingVehicle) && (
              <div className="bg-card rounded-xl border border-border p-6 space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {editingVehicle ? 'Update vehicle information' : 'Enter your vehicle information'}
                    </p>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Vehicle Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Vehicle Number *</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="TN01CD1234"
                      value={vehicleNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setVehicleNumber(value);
                        if (formError && value.trim()) {
                          validateVehicleNumber(value);
                        }
                      }}
                      className="h-12 text-base font-medium tracking-wider pr-12"
                      autoFocus
                    />
                    {vehicleNumber && !formError && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {formError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Format: State Code + Number (e.g., TN01CD1234)
                  </p>
                </div>

                {/* Information Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Note:</span> Your vehicle will be verified by our team. 
                    Vehicle number is required for verification.
                  </p>
                </div>

                {/* Save/Update Button */}
                <Button
                  onClick={editingVehicle ? handleEditVehicle : handleAddVehicle}
                  disabled={submitting || !vehicleNumber.trim()}
                  className="w-full h-12"
                  size="lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {editingVehicle ? 'Updating...' : 'Saving...'}
                    </div>
                  ) : editingVehicle ? (
                    'Update Vehicle'
                  ) : (
                    'Save Vehicle'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setVehicleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default VehicleManagement;