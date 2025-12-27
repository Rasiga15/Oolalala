import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Car, Plus, Edit, Trash2, AlertCircle, Info, Calendar, Tag, X, ChevronDown, ChevronUp, User, Fuel, MapPin, Shield, FileText, Building, Clock, Hash } from 'lucide-react';
import { vehicleApi, Vehicle } from '../../services/vehicleApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';

import { getUserDocuments } from '../../services/documentApi';
// Import the useProfile hook
import { useProfile } from '../../pages/Profile';

const VehicleManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use the central profile data
  const { profileData: centralProfileData } = useProfile();
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

  // ID Proof verification modal state
  const [showIdProofModal, setShowIdProofModal] = useState(false);

  // State for expanded cards
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

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

  // Check if user has verified ID proof
  const checkIdProofVerification = async (): Promise<boolean> => {
    try {
      if (!user?.token) return false;
      
      const documents = await getUserDocuments(user.token);
      console.log('User documents:', documents);
      
      // For publishRide users, check if both Aadhaar and Driving License are verified
      if (centralProfileData?.publishRide) {
        const hasVerifiedAadhaar = documents.some(
          doc => doc.documentType === 'aadhaar' && doc.verificationStatus === 'verified'
        );
        const hasVerifiedDL = documents.some(
          doc => doc.documentType === 'driving_license' && doc.verificationStatus === 'verified'
        );
        
        console.log('For partner - Aadhaar verified:', hasVerifiedAadhaar, 'DL verified:', hasVerifiedDL);
        return hasVerifiedAadhaar && hasVerifiedDL;
      } else {
        // For regular users, only Aadhaar is required
        const hasVerifiedAadhaar = documents.some(
          doc => doc.documentType === 'aadhaar' && doc.verificationStatus === 'verified'
        );
        
        console.log('For regular user - Aadhaar verified:', hasVerifiedAadhaar);
        return hasVerifiedAadhaar;
      }
    } catch (error) {
      console.error('Error checking ID proof verification:', error);
      return false;
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
        number_plate: vehicleNumber.toUpperCase()
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
        number_plate: vehicleNumber.toUpperCase()
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

  // Modified startAdding function to check ID proof verification
  const startAdding = async () => {
    const hasVerifiedIdProof = await checkIdProofVerification();
    
    if (!hasVerifiedIdProof) {
      // Show modal if ID proof is not verified
      setShowIdProofModal(true);
      return;
    }
    
    // If ID proof is verified, proceed with adding vehicle
    setEditingVehicle(null);
    setVehicleNumber('');
    setFormError('');
    setShowAddForm(true);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleCardExpand = (vehicleId: number) => {
    if (expandedCardId === vehicleId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(vehicleId);
    }
  };

  // Helper function to get verification status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  // Handle ID Proof verification button click
 
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
                <div className="space-y-4">
                  {vehicles.map((vehicle) => {
                    const statusColor = getStatusColor(vehicle.verification_status);
                    const isExpanded = expandedCardId === vehicle.id;
                    const hasMoreDetails = vehicle.morevehicle_details;
                    
                    return (
                      <div 
                        key={vehicle.id} 
                        className={`bg-card rounded-lg border ${statusColor.border} hover:shadow-sm transition-all duration-200 overflow-hidden ${
                          editingVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        {/* Vehicle Header - Always Visible */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors duration-150"
                          onClick={() => toggleCardExpand(vehicle.id)}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left Side: Vehicle Info */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Car size={18} className="text-primary" />
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold text-foreground tracking-wide">
                                  {vehicle.number_plate}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                  {/* Verification Status Badge */}
                                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}>
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
                            
                            {/* Right Side: Action Buttons and Expand Icon */}
                            <div className="flex items-center gap-2">
                              {/* Action Buttons - Only show when not expanded */}
                              {!isExpanded && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(vehicle);
                                    }}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                    title="Edit Vehicle"
                                  >
                                    <Edit size={18} className="text-muted-foreground" />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteModal(vehicle.id);
                                    }}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Vehicle"
                                  >
                                    <Trash2 size={18} className="text-red-500" />
                                  </button>
                                </>
                              )}
                              
                              {/* Expand/Collapse Icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCardExpand(vehicle.id);
                                }}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                              >
                                {isExpanded ? (
                                  <ChevronUp size={20} className="text-muted-foreground" />
                                ) : (
                                  <ChevronDown size={20} className="text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Additional Information in Header */}
                          <div className="text-xs text-muted-foreground flex items-center justify-between mt-3">
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

                        {/* Expanded Details Section */}
                        {isExpanded && (
                          <div className="border-t border-border bg-secondary/20 px-4 py-6 animate-in slide-in-from-top duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Vehicle Details Column */}
                              <div className="space-y-4">
                                <h3 className="font-medium text-foreground flex items-center gap-2">
                                  <Car size={16} />
                                  Vehicle Details
                                </h3>
                                
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Vehicle Code</p>
                                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                        <Hash size={14} />
                                        {vehicle.vehicle_code || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Brand</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.brand || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Model</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.model || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Year</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.manufacture_year || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Color</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.color || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Seats</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.seating_capacity || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Ownership Details */}
                                <div className="pt-4 border-t border-border">
                                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                    <Building size={16} />
                                    Ownership Details
                                  </h3>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ownership Type</p>
                                      <p className="text-sm font-medium text-foreground capitalize">
                                        {vehicle.ownership_type || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* More Details Column */}
                              <div className="space-y-4">
                                {/* RC Details */}
                                <div>
                                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                    <FileText size={16} />
                                    Registration Certificate (RC)
                                  </h3>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">RC Number</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.rc_number || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">RC Validity</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {formatDate(vehicle.rc_validity)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Insurance Details */}
                                <div className="pt-4 border-t border-border">
                                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                    <Shield size={16} />
                                    Insurance Details
                                  </h3>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Insurance Number</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {vehicle.insurance_number || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Insurance Validity</p>
                                      <p className="text-sm font-medium text-foreground">
                                        {formatDate(vehicle.insurance_validity)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Details if available */}
                                {hasMoreDetails && (
                                  <div className="pt-4 border-t border-border">
                                    <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                      <Info size={16} />
                                      Additional Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Fuel Type</p>
                                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                          <Fuel size={14} />
                                          {vehicle.morevehicle_details?.fuel_type || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Owner Name</p>
                                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                          <User size={14} />
                                          {vehicle.morevehicle_details?.owner_name || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Vehicle Category</p>
                                        <p className="text-sm font-medium text-foreground">
                                          {vehicle.morevehicle_details?.vehicle_category || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Permit Type</p>
                                        <p className="text-sm font-medium text-foreground">
                                          {vehicle.morevehicle_details?.permit_type || 'N/A'}
                                        </p>
                                      </div>
                                      {vehicle.morevehicle_details?.present_address && (
                                        <div className="col-span-2">
                                          <p className="text-xs text-muted-foreground">Address</p>
                                          <p className="text-sm font-medium text-foreground flex items-start gap-1">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                            {vehicle.morevehicle_details.present_address}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons in Expanded View */}
                            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border">
                              <button
                                onClick={() => startEditing(vehicle)}
                                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                              >
                                <Edit size={16} />
                                Edit Vehicle
                              </button>
                              <button
                                onClick={() => openDeleteModal(vehicle.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete Vehicle
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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