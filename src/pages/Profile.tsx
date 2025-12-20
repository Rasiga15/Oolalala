import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiChevronLeft, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi';
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
  const [cameraAccessing, setCameraAccessing] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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

  // Function to stop camera stream
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    setShowCameraPreview(false);
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to Blob with compression
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Compress the image
            const compressedBlob = await compressImageToUnder2MB(blob);
            
            const file = new File([compressedBlob], `profile-photo-${Date.now()}.jpg`, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log('Captured image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            
            // Check if image is under 2MB
            if (file.size > 2 * 1024 * 1024) {
              toast.error('Image is still too large. Please try again with better lighting.');
              stopCameraStream();
              return;
            }
            
            stopCameraStream();
            await uploadProfileImage(file);
          }
        }, 'image/jpeg', 0.7); // Start with 0.7 quality
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo');
      stopCameraStream();
    }
  };

  // Compress image to under 2MB
  const compressImageToUnder2MB = (blob: Blob, maxAttempts = 3, attempt = 1): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Set max dimensions to reduce size
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Reduce quality based on attempt number
          let quality = 0.8 - (attempt * 0.2); // Start with 0.8, then 0.6, then 0.4
          if (quality < 0.4) quality = 0.4; // Minimum quality 0.4
          
          // Convert to Blob with compression
          canvas.toBlob(
            (compressedBlob) => {
              if (compressedBlob) {
                console.log(`Compression attempt ${attempt}:`, (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');
                
                // If still too large and more attempts left, try again with lower quality
                if (compressedBlob.size > 2 * 1024 * 1024 && attempt < maxAttempts) {
                  resolve(compressImageToUnder2MB(compressedBlob, maxAttempts, attempt + 1));
                } else {
                  resolve(compressedBlob);
                }
              } else {
                resolve(blob); // Fallback to original
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(blob);
        }
      };
      
      img.onerror = () => {
        console.error('Error loading image for compression');
        resolve(blob); // Fallback to original
      };
      
      img.src = URL.createObjectURL(blob);
    });
  };

  // Upload profile image
  const uploadProfileImage = async (file: File) => {
    try {
      setLoading(true);
      
      // Validate image
      const validImageTypes = ['image/jpeg', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        toast.error('Only JPEG images are allowed');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('Image size should be less than 2MB');
        return;
      }
      
      toast.info('Uploading profile picture...');
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Create FormData with all required fields
      const formData = new FormData();
      formData.append('profile_image', file);
      
      // Always append basic required fields
      const firstName = profileData?.firstName || user?.first_name || '';
      const lastName = profileData?.lastName || user?.last_name || '';
      const dateOfBirth = profileData?.dateOfBirth || user?.date_of_birth || '';
      const gender = profileData?.gender || user?.gender || 'male';
      const multiVehicle = profileData?.multiVehicle || false;
      
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('dateOfBirth', dateOfBirth);
      formData.append('gender', gender);
      formData.append('multiVehicle', multiVehicle.toString());
      
      // Append optional fields if they exist
      if (profileData?.location) {
        formData.append('location', profileData.location);
      }
      
      if (profileData?.publishRide !== undefined) {
        formData.append('publishRide', profileData.publishRide.toString());
      }
      
      if (profileData?.partnerType) {
        formData.append('partnerType', profileData.partnerType);
      }
      
      if (profileData?.businessName) {
        formData.append('businessName', profileData.businessName);
      }
      
      // Log FormData for debugging
      console.log('Sending FormData with keys:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Call API
      const result = await ProfileApiService.updateBasicProfile(formData);
      
      if (result.success) {
        toast.success('Profile picture updated successfully!');
        // Reload profile data
        await loadProfileData();
        
        // Update user in context
        if (user) {
          const updatedUser = { ...user };
          if (firstName) updatedUser.first_name = firstName;
          if (lastName) updatedUser.last_name = lastName;
          updateUser(updatedUser);
        }
      } else {
        toast.error(result.error || 'Failed to update profile picture');
        // Reload original data
        await loadProfileData();
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('An error occurred while uploading image');
      // Reload original data
      await loadProfileData();
    } finally {
      setLoading(false);
    }
  };

  // Handle camera click - ONLY CAMERA ALLOWED
  const handleCameraClick = async () => {
    try {
      setCameraAccessing(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device/browser');
        setCameraAccessing(false);
        return;
      }
      
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        }).catch(err => {
          console.error('Initial camera test failed:', err);
          throw err;
        });
        
        testStream.getTracks().forEach(track => track.stop());
        
      } catch (permissionError: any) {
        console.error('Camera permission error:', permissionError);
        
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          toast.error('Camera permission denied. Please allow camera access in browser settings.');
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          toast.error('No camera found on this device.');
        } else {
          toast.error('Unable to access camera. Please check browser permissions.');
        }
        
        setCameraAccessing(false);
        return;
      }
      
      await startCameraPreview();
      
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please try again.');
      setCameraAccessing(false);
    }
  };

  // Start camera preview
  const startCameraPreview = async () => {
    try {
      toast.info('Starting camera...');
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false 
      });
      
      setCameraStream(stream);
      setShowCameraPreview(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            toast.error('Failed to start camera preview');
            stopCameraStream();
          });
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Camera error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in browser settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Failed to access camera. Please try again.');
      }
      
      stopCameraStream();
    } finally {
      setCameraAccessing(false);
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
      {/* Camera Preview Modal */}
      {showCameraPreview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={stopCameraStream}
              className="bg-white p-2 rounded-full hover:bg-gray-100 transition"
            >
              <FiChevronLeft size={24} />
            </button>
          </div>
          
          <div className="relative w-full max-w-lg aspect-square overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
            </div>
            
            <div className="absolute top-4 right-4 left-4 text-center">
              <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                Position your face inside the circle
              </p>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                onClick={handleCameraCapture}
                disabled={loading}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-white rounded-full m-auto"></div>
              </button>
            </div>
          </div>
          
          <p className="text-white mt-6 text-center max-w-md">
            Make sure your face is clearly visible and well-lit
          </p>
        </div>
      )}

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
                <button
                  onClick={handleCameraClick}
                  className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || cameraAccessing}
                  title="Take photo with camera"
                >
                  {loading || cameraAccessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiCamera size={16} className="md:size-[18px]" />
                  )}
                </button>
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

              {/* Camera Only Notice */}
              <div className="mt-4 w-full text-center">
                <p className="text-xs text-gray-500">
                  <FiCamera className="inline-block mr-1" size={12} />
                  Tap camera icon to take a photo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Gallery upload is not allowed
                </p>
              </div>
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