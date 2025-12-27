


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
        icon: <FiCheckCircle size={14} className="text-green-500" />
      };
    } else if (driver.user.current_status === 'verification_pending') {
      return {
        text: 'Verification Pending',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <FiAlertCircle size={14} className="text-yellow-500" />
      };
    } else {
      return {
        text: 'Not Verified',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <FiAlertCircle size={14} className="text-red-500" />
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

  // Function to get full profile image URL
  const getProfileImageUrl = (url: string | null) => {
    if (!url) return null;
    
    // Check if URL is already full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it starts with /uploads, prepend your base URL
    // Replace this with your actual backend URL
    const baseUrl = 'http://localhost:5000'; // Change this to your backend URL
    
    if (url.startsWith('/uploads/')) {
      return `${baseUrl}${url}`;
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH CENTERED TITLE */}
     

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

        {/* DRIVER CARDS */}
        {!isLoading && drivers.length > 0 && (
          <div className="space-y-5">
            {drivers.map((driver) => {
              const statusColor = getStatusColor(driver.user.current_status || driver.user.record_status);
              const verificationStatus = getVerificationStatus(driver);
              const profileImageStatus = getProfileImageStatus(driver.user.profile_image_verification_status);
              const isExpanded = expandedDriverId === driver.id;
              const profileImageUrl = getProfileImageUrl(driver.user.profile_image_url);
              
              return (
                <div 
                  key={driver.id}
                  className={`bg-white rounded-xl border ${statusColor.border} hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}
                >
                  {/* CARD HEADER - Clickable */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleDriverExpand(driver.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <div className="flex-shrink-0 relative">
                        {profileImageUrl ? (
                          <div className="relative">
                            <img
                              src={profileImageUrl}
                              alt={`${driver.user.first_name} ${driver.user.last_name}`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                              onError={(e) => {
                                // If image fails to load, show initials
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const initialsDiv = document.createElement('div');
                                  initialsDiv.className = 'w-14 h-14 rounded-full bg-gradient-to-br from-[#21409A] to-blue-600 flex items-center justify-center shadow-sm';
                                  initialsDiv.innerHTML = `<span class="text-white font-bold text-lg">${getInitials(driver.user.first_name, driver.user.last_name)}</span>`;
                                  parent.appendChild(initialsDiv);
                                }
                              }}
                            />
                            {driver.user.is_verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <FiCheckCircle className="text-white" size={10} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#21409A] to-blue-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-lg">
                              {getInitials(driver.user.first_name, driver.user.last_name)}
                            </span>
                          </div>
                        )}
                        {/* Status dot */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 ${statusColor.dot} rounded-full border-2 border-white`}></div>
                      </div>
                      
                      {/* Driver Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-lg truncate">
                                {driver.user.first_name} {driver.user.last_name}
                              </h3>
                              <span className={`text-xs px-2 py-1 ${statusColor.bg} ${statusColor.text} rounded-full font-medium border ${statusColor.border} whitespace-nowrap`}>
                                {getStatusText(driver.user.current_status || driver.user.record_status)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <FiHash size={12} />
                                <span className="font-medium">{driver.driver_code}</span>
                              </div>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <FiUser size={12} />
                                <span className="capitalize">{driver.user.role}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Add Vehicle Button - Always show */}
                            <button 
                              onClick={(e) => handleAddVehicle(driver.id, e)}
                              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-[#21409A] rounded-lg font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm whitespace-nowrap border border-blue-100"
                            >
                              + Add Vehicle
                            </button>
                            
                            {/* Expand/Collapse Button */}
                            <button
                              onClick={(e) => toggleDriverExpand(driver.id, e)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={isExpanded ? "Collapse Details" : "Expand Details"}
                            >
                              {isExpanded ? (
                                <FiChevronUp size={20} className="text-gray-600" />
                              ) : (
                                <FiChevronDown size={20} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Quick Info Bar */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <FiPhone size={12} />
                                Mobile
                              </p>
                              <p className="font-medium text-gray-900 text-sm">
                                {formatMobile(driver.user.mobile_number)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <FiMail size={12} />
                                Email
                              </p>
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {driver.user.email_address || 'N/A'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-foreground flex items-center gap-1">
                                <FiCalendar size={12} />
                                Joined
                              </p>
                              <p className="font-medium text-gray-900 text-sm">
                                {formatDate(driver.user.created_at)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-foreground flex items-center gap-1">
                                <FiStar size={12} />
                                Rating
                              </p>
                              <p className="font-medium text-gray-900 text-sm">
                                {driver.average_rating || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer Verification Status */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="text-sm">
                            <span className="text-gray-500">Driver ID: </span>
                            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {driver.id}
                            </span>
                          </div>
                          
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${verificationStatus.bg} ${verificationStatus.color} border ${verificationStatus.border}`}>
                            {verificationStatus.icon}
                            <span>{verificationStatus.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS SECTION */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50 px-5 py-6 animate-in slide-in-from-top duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Details Column */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <FiUser size={16} className="text-[#21409A]" />
                              Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.user.first_name} {driver.user.last_name}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Gender</p>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {driver.user.gender || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Date of Birth</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(driver.user.date_of_birth)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Email Status</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${driver.user.is_email_verified ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                                  {driver.user.is_email_verified ? (
                                    <FiCheckCircle size={12} />
                                  ) : (
                                    <FiAlertCircle size={12} />
                                  )}
                                  <span>{driver.user.is_email_verified ? 'Verified' : 'Not Verified'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Location & Working Details */}
                          <div className="pt-4 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <FiMapPin size={16} className="text-[#21409A]" />
                              Location & Work
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.user.location || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Working Professional</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.user.working_professional || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Publish Rides</p>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${driver.user.publish_ride ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                  {driver.user.publish_ride ? (
                                    <FiEye size={12} />
                                  ) : (
                                    <FiEyeOff size={12} />
                                  )}
                                  <span>{driver.user.publish_ride ? 'Enabled' : 'Disabled'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Account & Verification Column */}
                        <div className="space-y-6">
                          {/* Wallet & Account Details */}
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <FiDollarSign size={16} className="text-[#21409A]" />
                              Account Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Wallet Balance</p>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                  <FiDollarSign size={14} />
                                  {driver.user.wallet_balance}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Referral Code</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.user.referral_code || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Partner ID</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.partner_id}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">User ID</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.user.id}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Verification Details */}
                          <div className="pt-4 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <FiShield size={16} className="text-[#21409A]" />
                              Verification Status
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Profile Image Status</p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${profileImageStatus.bg} ${profileImageStatus.color} border ${profileImageStatus.color.replace('text', 'border')}/20`}>
                                  <FiUserCheck size={14} />
                                  <span className="font-medium">{profileImageStatus.text}</span>
                                </div>
                              </div>
                              
                              {driver.user.profile_image_verification_status === 'rejected' && driver.user.profile_image_rejection_reason && (
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500">Rejection Reason</p>
                                  <p className="text-sm font-medium text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">
                                    {driver.user.profile_image_rejection_reason}
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500">FCM Token</p>
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {driver.user.fcm_token ? 'Present' : 'N/A'}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500">Travel Agent</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {driver.travel_agent_id || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <FiClock size={12} />
                              Created At
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(driver.createdAt)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <FiClock size={12} />
                              Updated At
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(driver.updatedAt)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <FiUser size={12} />
                              Created By
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              User ID: {driver.created_by}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons in Expanded View */}
                      <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                        <button
                          onClick={(e) => handleAddVehicle(driver.id, e)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-[#21409A] hover:from-blue-100 hover:to-indigo-100 rounded-lg font-medium text-sm transition-all shadow-sm border border-blue-200 flex items-center gap-2"
                        >
                          <FiPlus size={16} />
                          Add Vehicle
                        </button>
                        <button
                          className="px-4 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg font-medium text-sm transition-colors shadow-sm border border-amber-200 flex items-center gap-2"
                        >
                          <FiEdit size={16} />
                          Edit Driver
                        </button>
                        <button
                          className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors shadow-sm border border-red-200 flex items-center gap-2"
                        >
                          <FiTrash2 size={16} />
                          Remove Driver
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
          <div className="text-center mt-8 text-gray-500 text-sm">
            Showing {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagementMainScreen;