// components/DriverManagementMainScreen.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiChevronLeft, FiPlus, FiUser, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { driverManagementAPI } from '@/services/drivermanagementapi';

interface Driver {
  id: number;
  user_id: number;
  driver_code: string;
  partner_id: number;
  travel_agent_id: number | null;
  average_rating: string;
  record_status: string;
  created_by: number;
  updated_by: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    mobile_number: string;
    email_address: string | null;
    gender: string | null;
    date_of_birth: string | null;
    fcm_token: string | null;
    is_verified: boolean;
    is_email_verified: boolean;
    role: string;
    publish_ride: boolean;
    working_professional: string | null;
    referral_code: string | null;
    referred_by: string | null;
    profile_image_url: string | null;
    profile_image_verification_status: string;
    profile_image_verified_by: number | null;
    profile_image_verified_datetime: string | null;
    profile_image_rejection_reason: string | null;
    location: string | null;
    wallet_balance: string;
    record_status: string;
    current_status: string;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
  };
}

const DriverManagementMainScreen: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const result = await driverManagementAPI.getDrivers();
      
      if (result.success && result.data) {
        console.log('Drivers fetched:', result.data);
        setDrivers(result.data);
      } else {
        toast.error(result.error || 'Failed to load drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriver = () => {
    navigate('/driver-management');
  };

  const handleAddVehicle = (driverId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/vehicle-management', { 
      state: { driverId } 
    });
  };

  const handleDriverClick = (driverId: number) => {
    navigate(`/drivers/${driverId}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'a': // Your API returns 'a' for active
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'pending':
      case 'p':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'inactive':
      case 'i':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'a': return 'Active';
      case 'p': return 'Pending';
      case 'i': return 'Inactive';
      default: return status;
    }
  };

  const formatMobile = (mobile: string) => {
    if (mobile && mobile.length === 10) {
      return `${mobile.substring(0, 5)} ${mobile.substring(5)}`;
    }
    return mobile || 'N/A';
  };

  const getVerificationStatus = (driver: Driver) => {
    if (driver.user.is_verified) {
      return {
        text: 'Verified',
        color: 'text-green-600',
        icon: <FiCheckCircle size={14} />
      };
    } else if (driver.user.current_status === 'verification_pending') {
      return {
        text: 'Verification Pending',
        color: 'text-yellow-600',
        icon: <FiAlertCircle size={14} />
      };
    } else {
      return {
        text: 'Not Verified',
        color: 'text-red-600',
        icon: <FiAlertCircle size={14} />
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH CENTERED TITLE */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center">
            {/* Back Button */}
            <Link to="/profile" className="p-1 flex-shrink-0">
              <FiChevronLeft size={22} className="text-gray-600" />
            </Link>
            
            {/* Centered Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-800">Driver Management</h1>
            </div>
            
            {/* Empty div for balance */}
            <div className="w-9 flex-shrink-0"></div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* ADD DRIVER BUTTON */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddDriver}
            className="flex items-center gap-2 px-5 py-3 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors shadow-sm"
          >
            <FiPlus size={18} />
            Add Driver
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="w-14 h-14 border-4 border-[#21409A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading drivers...</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && drivers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border shadow-sm">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUser className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No drivers added yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Add your first driver to start managing your fleet
            </p>
            <button
              onClick={handleAddDriver}
              className="px-8 py-3.5 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors shadow-sm"
            >
              <FiPlus className="inline mr-2" size={18} />
              Add First Driver
            </button>
          </div>
        )}

        {/* DRIVER CARDS - 70% width centered */}
        {!isLoading && drivers.length > 0 && (
          <div className="space-y-5">
            {drivers.map((driver) => {
              const verificationStatus = getVerificationStatus(driver);
              
              return (
                <div 
                  key={driver.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer w-[70%] mx-auto"
                  onClick={() => handleDriverClick(driver.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        {driver.user.profile_image_url ? (
                          <div className="relative">
                            <img
                              src={driver.user.profile_image_url}
                              alt={`${driver.user.first_name} ${driver.user.last_name}`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                            />
                            {driver.user.is_verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <FiCheckCircle className="text-white" size={10} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#21409A] to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {getInitials(driver.user.first_name, driver.user.last_name)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Driver Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {driver.user.first_name} {driver.user.last_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                                {driver.user.role}
                              </span>
                              <span className="text-gray-300">•</span>
                              <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(driver.user.record_status)}`}>
                                {getStatusText(driver.user.record_status)}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleAddVehicle(driver.id, e)}
                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-[#21409A] rounded-lg font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm whitespace-nowrap border border-blue-100"
                          >
                            + Add Vehicle
                          </button>
                        </div>
                        
                        {/* Driver Details */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-xs text-gray-500">Driver Code</p>
                                <p className="font-medium text-gray-900">
                                  {driver.driver_code}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Mobile</p>
                                <p className="font-medium text-gray-900">
                                  {formatMobile(driver.user.mobile_number)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer Info */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="text-sm">
                            <span className="text-gray-500">ID: </span>
                            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {driver.id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 text-sm ${verificationStatus.color}`}>
                              {verificationStatus.icon}
                              <span>{verificationStatus.text}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOWING COUNT */}
        {!isLoading && drivers.length > 0 && (
          <div className="text-center mt-8 text-gray-500 text-sm">
            Showing {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagementMainScreen;