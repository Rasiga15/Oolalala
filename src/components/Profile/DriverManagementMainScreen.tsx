// components/DriverManagementMainScreen.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FiChevronLeft, 
  FiPlus, 
  FiUser, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiChevronDown, 
  FiChevronUp,
  FiPhone,
  FiMail,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiShield,
  FiCreditCard,
  FiStar,
  FiEdit,
  FiTrash2,
  FiClock,
  FiHash,
  FiUserCheck,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
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
  const [expandedDriverId, setExpandedDriverId] = useState<number | null>(null);

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

  const toggleDriverExpand = (driverId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (expandedDriverId === driverId) {
      setExpandedDriverId(null);
    } else {
      setExpandedDriverId(driverId);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'a':
        return { 
          bg: 'bg-green-100', 
          text: 'text-green-700', 
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
      case 'pending':
      case 'p':
      case 'verification_pending':
        return { 
          bg: 'bg-yellow-100', 
          text: 'text-yellow-700', 
          border: 'border-yellow-200',
          dot: 'bg-yellow-500'
        };
      case 'inactive':
      case 'i':
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
      default:
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'a': return 'Active';
      case 'p': return 'Pending';
      case 'i': return 'Inactive';
      case 'verification_pending': return 'Verification Pending';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatMobile = (mobile: string) => {
    if (mobile && mobile.length === 10) {
      return `${mobile.substring(0, 5)} ${mobile.substring(5)}`;
    }
    return mobile || 'N/A';
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

  const getVerificationStatus = (driver: Driver) => {
    if (driver.user.is_verified) {
      return {
        text: 'Verified',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <FiCheckCircle className="text-green-500 sm:w-3.5 sm:h-3.5" />
      };
    } else if (driver.user.current_status === 'verification_pending') {
      return {
        text: 'Verification Pending',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <FiAlertCircle className="text-yellow-500 sm:w-3.5 sm:h-3.5" />
      };
    } else {
      return {
        text: 'Not Verified',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <FiAlertCircle className="text-red-500 sm:w-3.5 sm:h-3.5" />
      };
    }
  };

  const getProfileImageStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return { 
          color: 'text-green-600', 
          bg: 'bg-green-100',
          text: 'Verified' 
        };
      case 'pending':
        return { 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-100',
          text: 'Pending' 
        };
      case 'rejected':
        return { 
          color: 'text-red-600', 
          bg: 'bg-red-100',
          text: 'Rejected' 
        };
      default:
        return { 
          color: 'text-gray-600', 
          bg: 'bg-gray-100',
          text: status 
        };
    }
  };

  const getProfileImageUrl = (url: string | null) => {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseUrl = 'http://localhost:5000';
    
    if (url.startsWith('/uploads/')) {
      return `${baseUrl}${url}`;
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 max-w-4xl mx-auto sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl">
        {/* ADD DRIVER BUTTON */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleAddDriver}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors shadow-sm text-sm sm:text-base"
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Driver
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex justify-center py-16 sm:py-20 lg:py-24">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-4 border-[#21409A] border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4 lg:mb-5"></div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Loading drivers...</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && drivers.length === 0 && (
          <div className="text-center py-16 sm:py-20 lg:py-24 xl:py-28 bg-white rounded-xl border shadow-sm">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8">
              <FiUser className="text-gray-400 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 mb-2 sm:mb-3 lg:mb-4">No drivers added yet</h3>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
              Add your first driver to start managing your fleet
            </p>
            <button
              onClick={handleAddDriver}
              className="px-6 py-2.5 sm:px-8 sm:py-3 lg:px-10 lg:py-3.5 xl:px-12 xl:py-4 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors shadow-sm text-sm sm:text-base lg:text-lg"
            >
              <FiPlus className="inline mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Add First Driver
            </button>
          </div>
        )}

        {/* DRIVER CARDS */}
        {!isLoading && drivers.length > 0 && (
          <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-7">
            {drivers.map((driver) => {
              const statusColor = getStatusColor(driver.user.current_status || driver.user.record_status);
              const verificationStatus = getVerificationStatus(driver);
              const profileImageStatus = getProfileImageStatus(driver.user.profile_image_verification_status);
              const isExpanded = expandedDriverId === driver.id;
              const profileImageUrl = getProfileImageUrl(driver.user.profile_image_url);
              
              return (
                <div 
                  key={driver.id}
                  className={`bg-white rounded-xl border ${statusColor.border} hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-md lg:shadow-lg' : 'shadow-sm'}`}
                >
                  {/* CARD HEADER - Clickable */}
                  <div 
                    className="p-4 sm:p-5 lg:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleDriverExpand(driver.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 lg:gap-5">
                      {/* Profile Image */}
                      <div className="flex-shrink-0 relative flex items-center justify-center sm:justify-start">
                        {profileImageUrl ? (
                          <div className="relative">
                            <img
                              src={profileImageUrl}
                              alt={`${driver.user.first_name} ${driver.user.last_name}`}
                              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const initialsDiv = document.createElement('div');
                                  initialsDiv.className = 'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-full bg-gradient-to-br from-[#21409A] to-blue-600 flex items-center justify-center shadow-sm';
                                  initialsDiv.innerHTML = `<span class="text-white font-bold text-sm sm:text-base lg:text-lg">${getInitials(driver.user.first_name, driver.user.last_name)}</span>`;
                                  parent.appendChild(initialsDiv);
                                }
                              }}
                            />
                            {driver.user.is_verified && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <FiCheckCircle className="text-white w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-full bg-gradient-to-br from-[#21409A] to-blue-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                              {getInitials(driver.user.first_name, driver.user.last_name)}
                            </span>
                          </div>
                        )}
                        {/* Status dot */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 ${statusColor.dot} rounded-full border-2 border-white`}></div>
                      </div>
                      
                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-2 gap-2 lg:gap-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-3 mb-1 lg:mb-2">
                              <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                                {driver.user.first_name} {driver.user.last_name}
                              </h3>
                              <span className={`text-xs sm:text-sm px-2 py-1 ${statusColor.bg} ${statusColor.text} rounded-full font-medium border ${statusColor.border} whitespace-nowrap self-start sm:self-center`}>
                                {getStatusText(driver.user.current_status || driver.user.record_status)}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
                              <div className="flex items-center gap-1 text-xs sm:text-sm lg:text-base text-gray-600">
                                <FiHash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="font-medium truncate max-w-[120px] sm:max-w-[150px] lg:max-w-none">{driver.driver_code}</span>
                              </div>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <div className="flex items-center gap-1 text-xs sm:text-sm lg:text-base text-gray-600">
                                <FiUser className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="capitalize truncate">{driver.user.role}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 lg:gap-3 mt-2 lg:mt-0">
                            {/* Add Vehicle Button - Always show */}
                            <button 
                              onClick={(e) => handleAddVehicle(driver.id, e)}
                              className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 text-xs sm:text-sm lg:text-base bg-gradient-to-r from-blue-50 to-indigo-50 text-[#21409A] rounded-lg font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm whitespace-nowrap border border-blue-100"
                            >
                              + Add Vehicle
                            </button>
                            
                            {/* Expand/Collapse Button */}
                            <button
                              onClick={(e) => toggleDriverExpand(driver.id, e)}
                              className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title={isExpanded ? "Collapse Details" : "Expand Details"}
                            >
                              {isExpanded ? (
                                <FiChevronUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" />
                              ) : (
                                <FiChevronDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Quick Info Bar */}
                        <div className="mt-3 sm:mt-4 lg:mt-5 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                                <FiPhone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Mobile
                              </p>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">
                                {formatMobile(driver.user.mobile_number)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                                <FiMail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Email
                              </p>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base truncate">
                                {driver.user.email_address || 'N/A'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Joined
                              </p>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">
                                {formatDate(driver.user.created_at)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                                <FiStar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Rating
                              </p>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">
                                {driver.average_rating || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer Verification Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 sm:mt-4 lg:mt-5 pt-3 sm:pt-4 lg:pt-5 border-t border-gray-100 gap-2 sm:gap-0">
                          <div className="text-xs sm:text-sm lg:text-base">
                            <span className="text-gray-500">Driver ID: </span>
                            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {driver.id}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs sm:text-sm lg:text-base ${verificationStatus.bg} ${verificationStatus.color} border ${verificationStatus.border}`}>
                            {verificationStatus.icon}
                            <span className="whitespace-nowrap">{verificationStatus.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS SECTION */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50 px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 xl:py-7 animate-in slide-in-from-top duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 xl:gap-7">
                        {/* Personal Details Column */}
                        <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-7">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                              <FiUser className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-[#21409A]" />
                              Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Full Name</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.user.first_name} {driver.user.last_name}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Gender</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 capitalize">
                                  {driver.user.gender || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Date of Birth</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {formatDate(driver.user.date_of_birth)}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Email Status</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm ${driver.user.is_email_verified ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                                  {driver.user.is_email_verified ? (
                                    <FiCheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  ) : (
                                    <FiAlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  )}
                                  <span>{driver.user.is_email_verified ? 'Verified' : 'Not Verified'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Location & Working Details */}
                          <div className="pt-3 sm:pt-4 lg:pt-5 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                              <FiMapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-[#21409A]" />
                              Location & Work
                            </h3>
                            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Location</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.user.location || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Working Professional</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.user.working_professional || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Publish Rides</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm ${driver.user.publish_ride ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                  {driver.user.publish_ride ? (
                                    <FiEye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  ) : (
                                    <FiEyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  )}
                                  <span>{driver.user.publish_ride ? 'Enabled' : 'Disabled'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Account & Verification Column */}
                        <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-7">
                          {/* Wallet & Account Details */}
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                              <FiDollarSign className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-[#21409A]" />
                              Account Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Wallet Balance</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 flex items-center gap-1">
                                  <FiDollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  {driver.user.wallet_balance}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Referral Code</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.user.referral_code || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Partner ID</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.partner_id}
                                </p>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">User ID</p>
                                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                  {driver.user.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Verification Details */}
                          <div className="pt-3 sm:pt-4 lg:pt-5 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                              <FiShield className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-[#21409A]" />
                              Verification Status
                            </h3>
                            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-500">Profile Image Status</p>
                                <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg text-sm sm:text-base ${profileImageStatus.bg} ${profileImageStatus.color} border ${profileImageStatus.color.replace('text', 'border')}/20`}>
                                  <FiUserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="font-medium whitespace-nowrap">{profileImageStatus.text}</span>
                                </div>
                              </div>
                              
                              {driver.user.profile_image_verification_status === 'rejected' && driver.user.profile_image_rejection_reason && (
                                <div className="space-y-1 sm:space-y-2">
                                  <p className="text-xs sm:text-sm lg:text-base text-gray-500">Rejection Reason</p>
                                  <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 bg-red-50 p-2 sm:p-3 lg:p-4 rounded-lg border border-red-200">
                                    {driver.user.profile_image_rejection_reason}
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                                <div className="space-y-1 sm:space-y-2">
                                  <p className="text-xs sm:text-sm lg:text-base text-gray-500">FCM Token</p>
                                  <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 truncate">
                                    {driver.user.fcm_token ? 'Present' : 'N/A'}
                                  </p>
                                </div>
                                <div className="space-y-1 sm:space-y-2">
                                  <p className="text-xs sm:text-sm lg:text-base text-gray-500">Travel Agent</p>
                                  <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                                    {driver.travel_agent_id || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="mt-4 sm:mt-5 lg:mt-6 xl:mt-7 pt-4 sm:pt-5 lg:pt-6 xl:pt-7 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                          <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                              <FiClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              Created At
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                              {formatDate(driver.createdAt)}
                            </p>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                              <FiClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              Updated At
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                              {formatDate(driver.updatedAt)}
                            </p>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 flex items-center gap-1">
                              <FiUser className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              Created By
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                              User ID: {driver.created_by}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons in Expanded View */}
                      <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 sm:gap-3 lg:gap-4 pt-4 sm:pt-5 lg:pt-6 xl:pt-7 mt-4 sm:mt-5 lg:mt-6 xl:mt-7 border-t border-gray-200">
                        <button
                          onClick={(e) => handleAddVehicle(driver.id, e)}
                          className="px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-[#21409A] hover:from-blue-100 hover:to-indigo-100 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-all shadow-sm border border-blue-200 flex items-center gap-1.5 sm:gap-2 lg:gap-3"
                        >
                          <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5" />
                          <span className="whitespace-nowrap">Add Vehicle</span>
                        </button>
                        <button
                          className="px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors shadow-sm border border-amber-200 flex items-center gap-1.5 sm:gap-2 lg:gap-3"
                        >
                          <FiEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5" />
                          <span className="whitespace-nowrap">Edit Driver</span>
                        </button>
                        <button
                          className="px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors shadow-sm border border-red-200 flex items-center gap-1.5 sm:gap-2 lg:gap-3"
                        >
                          <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5" />
                          <span className="whitespace-nowrap">Remove Driver</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SHOWING COUNT */}
        {!isLoading && drivers.length > 0 && (
          <div className="text-center mt-6 sm:mt-8 lg:mt-10 xl:mt-12 text-gray-500 text-sm sm:text-base lg:text-lg">
            Showing {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagementMainScreen;