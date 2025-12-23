import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { MdPerson, MdDirectionsCar, MdPhone, MdBadge, MdPeople, MdBusiness } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import services and context
import ProfileApiService from '../services/profileApi';
import { useAuth } from '../contexts/AuthContext';

interface SetupItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'required'; // Changed 'completed' to 'verified'
  showCondition: 'always' | 'publishRide_true' | 'publishRide_false' | 'individual' | 'commercial';
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // All possible setup items
  const allSetupItems: SetupItem[] = [
    {
      id: 'basic',
      icon: <MdPerson size={20} />,
      title: 'Basic Details',
      description: 'Name, Personal Info, Gender',
      status: profileData ? 'verified' : 'pending', // Changed 'completed' to 'verified'
      showCondition: 'always'
    },
    {
      id: 'vehicle',
      icon: <MdDirectionsCar size={20} />,
      title: 'Vehicle Management',
      description: 'Name, Brand, Insurance',
      status: 'pending',
      showCondition: 'individual'
    },
    {
      id: 'vehicle-management',
      icon: <MdDirectionsCar size={20} />,
      title: 'Vehicle Management',
      description: 'Company vehicles, Fleet management',
      status: 'pending',
      showCondition: 'commercial'
    },
    {
      id: 'contact',
      icon: <MdPhone size={20} />,
      title: 'Contact & Verification',
      description: 'Mobile, Email, OTP',
      status: user?.mobile_number ? 'verified' : 'required', // Changed 'completed' to 'verified'
      showCondition: 'always'
    },
    {
      id: 'id-proof',
      icon: <MdBadge size={20} />,
      title: 'ID Proof',
      description: 'Government ID & documents',
      status: 'required',
      showCondition: 'always'
    },
    {
      id: 'driver-management',
      icon: <MdPeople size={20} />,
      title: 'Driver Management',
      description: 'Name, DOB, Mobile Number',
      status: 'pending',
      showCondition: 'commercial'
    }
  ];

  // Function to filter setup items based on profile data
  const getFilteredSetupItems = () => {
    if (!profileData) return allSetupItems;
    
    const { publishRide, partnerType } = profileData;
    
    // If publishRide is false, show only basic + contact + id-proof
    if (!publishRide) {
      return allSetupItems.filter(item => 
        item.showCondition === 'always'
      );
    }
    
    // If publishRide is true, show based on partnerType
    if (publishRide && partnerType === 'individual') {
      return allSetupItems.filter(item => 
        item.showCondition === 'always' || 
        item.showCondition === 'individual'
      );
    }
    
    if (publishRide && partnerType === 'commercial') {
      return allSetupItems.filter(item => 
        item.showCondition === 'always' || 
        item.showCondition === 'commercial'
      );
    }
    
    // Default fallback
    return allSetupItems.filter(item => item.showCondition === 'always');
  };

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      const result = await ProfileApiService.getBasicProfile();
      if (result.success && result.data) {
        setProfileData(result.data);
        console.log('Profile data loaded:', result.data);
        console.log('publishRide:', result.data.publishRide);
        console.log('partnerType:', result.data.partnerType);
        
        // If profile image exists, set it with full URL
        if (result.data.profileImage) {
          let imageUrl = result.data.profileImage;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = `http://18.61.216.57:4500${imageUrl}`;
          }
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  // Updated badge function with "Verified" and "Pending"
  const getStatusBadge = (status: SetupItem['status']) => {
    switch (status) {
      case 'verified': // Changed from 'completed' to 'verified'
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <FiCheck size={12} /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
            <FiAlertCircle size={12} /> Pending
          </span>
        );
      case 'required':
        return (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Required
          </span>
        );
    }
  };

  // Handle setup item click
  const handleSetupItemClick = (itemId: string) => {
    switch (itemId) {
      case 'basic':
        navigate('/basic-details');
        break;
      case 'vehicle':
        navigate('/vehicle-management');
        break;
      case 'vehicle-management':
        navigate('/vehicle-management');
        break;
      case 'contact':
        navigate('/contact-verification'); 
        break;
      case 'id-proof':
        navigate('/id-proof');
        break;
      case 'driver-management':
        navigate('/drivers');
        break;
      default:
        break;
    }
  };

  // Calculate profile completion percentage based on filtered items
  // Updated to count "verified" items instead of "completed"
  const calculateCompletionPercentage = () => {
    const filteredItems = getFilteredSetupItems();
    let verifiedCount = 0;
    
    filteredItems.forEach(item => {
      if (item.status === 'verified') verifiedCount++;
    });
    
    return filteredItems.length > 0 ? Math.round((verifiedCount / filteredItems.length) * 100) : 0;
  };

  const completionPercentage = calculateCompletionPercentage();
  const filteredSetupItems = getFilteredSetupItems();

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiChevronLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <FiSettings size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading profile image:', profileImage);
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                              <span class="text-3xl md:text-4xl text-white font-bold">
                                ${user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
                              </span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                      <span className="text-3xl md:text-4xl text-white font-bold">
                        {user?.first_name?.charAt(0) || user?.phone?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {/* REMOVED: Camera button */}
              </div>

              {/* Contact Info */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-lg md:text-xl font-semibold text-gray-900">
                  {profileData ? `${profileData.firstName} ${profileData.lastName}` : user?.first_name || 'User'}
                </p>
                <p className="text-sm md:text-base text-gray-500 mt-1">
                  {user?.phone || user?.mobile_number || '+91 8968709896'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {profileData?.location || user?.email_address || 'No location set'}
                </p>
                
                {/* Display Profile Type */}
                {profileData && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      profileData.publishRide 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profileData.publishRide 
                        ? `Publish Ride: ${profileData.partnerType || 'Not set'}`
                        : 'Publish Ride: Off'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Completion Status */}
              <div className="mt-6 md:mt-8 w-full">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Profile Completion</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {completionPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Complete your profile to access all features
                  </p>
                </div>
              </div>

              {/* REMOVED: Camera notice section */}
            </div>
          </div>

          {/* Right Column - Account Setup */}
          <div className="lg:col-span-2">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Account Setup</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {profileData ? (
                    profileData.publishRide 
                      ? `Finish these steps for ${profileData.partnerType === 'commercial' ? 'commercial' : 'individual'} partner account.`
                      : 'Complete your basic profile setup.'
                  ) : 'Finish these steps to get started with your account.'}
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {filteredSetupItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSetupItemClick(item.id)}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer hover:border-blue-200"
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
  item.status === 'verified' ? 'bg-green-50 text-green-600' :
  item.status === 'pending' ? 'bg-orange-50 text-orange-500' :
  'bg-red-50 text-red-600'
}`}>
                      <div className="scale-90 md:scale-100">
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* No items message */}
              {filteredSetupItems.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500">No setup items available for your profile type.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Update your profile settings to see available options.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Extra padding at bottom for better scrolling */}
      <div className="h-4 md:h-0"></div>
    </div>
  );
};

export default Profile;