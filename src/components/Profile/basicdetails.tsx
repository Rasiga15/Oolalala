import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { FiChevronLeft, FiCamera } from "react-icons/fi";

// Custom components
import { Button } from "../common/Button";
import ProfileApiService, { BasicProfileData } from "../../services/profileApi";
import { useAuth } from "../../contexts/AuthContext";
// Import the useProfile hook
import { useProfile } from "../../pages/Profile";

// Your custom Label component
const Label = ({ 
  htmlFor, 
  className = "", 
  children 
}: { 
  htmlFor?: string; 
  className?: string; 
  children: React.ReactNode 
}) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`text-sm font-medium text-gray-800 ${className}`}
    >
      {children}
    </label>
  );
};

// Your custom Switch component
const Switch = ({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex items-center cursor-pointer"
        disabled={false}
      >
        <div
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
            checked ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
              checked ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </div>
      </button>
      {label && (
        <span className="text-sm text-gray-600">
          {checked ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
};

// Custom Input component
const Input = ({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  disabled = false
}: {
  id?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
};

const BasicDetails = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  // Use the central profile data
  const { profileData: centralProfileData, refreshProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [cameraAccessing, setCameraAccessing] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isProfileImageUploaded, setIsProfileImageUploaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "male" as "male" | "female" | "others",
    dateOfBirth: "",
    location: "",
    // New fields
    publishRide: false,
    partnerType: "" as "" | "individual" | "commercial",
    businessName: "",
    professionalType: "",
    multiVehicle: false,
  });

  // Calculate dates for date picker
  const calculateMaxDate = (): string => {
    const now = new Date();
    const eighteenYearsAgo = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate()
    );
    return eighteenYearsAgo.toISOString().split('T')[0];
  };

  const calculateMinDate = (): string => {
    const now = new Date();
    const hundredYearsAgo = new Date(
      now.getFullYear() - 100,
      now.getMonth(),
      now.getDate()
    );
    return hundredYearsAgo.toISOString().split('T')[0];
  };

  // Function to format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Function to calculate age
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Date picker function (equivalent to Flutter's _selectDate)
  const handleDatePicker = () => {
    setShowDatePickerModal(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    
    // Check if selected date is valid (at least 18 years old)
    const selectedDateObj = new Date(selected);
    const now = new Date();
    const eighteenYearsAgo = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate()
    );
    
    if (selectedDateObj > eighteenYearsAgo) {
      toast.error('Must be at least 18 years old');
      return;
    }
    
    setFormData({ ...formData, dateOfBirth: selected });
    
    // Format date for display
    const formattedDate = selected; // Already in yyyy-MM-dd format
    toast.success(`Date of birth set to: ${formatDateForDisplay(formattedDate)}`);
    
    setShowDatePickerModal(false);
  };

  // Fetch profile data on component mount - Use central data first
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchProfileData = async () => {
    try {
      setFetching(true);
      console.log("Fetching profile data...");
      
      let profileData: BasicProfileData | null = null;
      
      // First try to use central profile data
      if (centralProfileData) {
        console.log("Using central profile data:", centralProfileData);
        profileData = centralProfileData;
      } else {
        // Fallback to API call
        const result = await ProfileApiService.getBasicProfile();
        if (result.success && result.data) {
          profileData = result.data;
          console.log("Profile data loaded from API:", result.data);
        }
      }
      
      if (profileData) {
        // Set form data from profile data
        setFormData({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          gender: profileData.gender || "male",
          dateOfBirth: profileData.dateOfBirth || "",
          location: profileData.location || "",
          publishRide: profileData.publishRide || false,
          partnerType: profileData.partnerType || "",
          businessName: profileData.businessName || "",
          professionalType: profileData.professionalType || "",
          multiVehicle: profileData.multiVehicle || false,
        });
        
        // Load profile image if exists
        if (profileData.profileImage) {
          let imageUrl = profileData.profileImage;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = `https://api-dev.oolalala.com${imageUrl}`;
          }
          setProfileImage(imageUrl);
          setIsProfileImageUploaded(true);
        } else {
          setIsProfileImageUploaded(false);
        }
        
        toast.success("Profile loaded successfully");
      } else {
        console.error("Failed to load profile");
        toast.error("Failed to load profile data");
        
        // If user data exists in auth context, use it as fallback
        if (user) {
          setFormData({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            gender: (user.gender as "male" | "female" | "others") || "male",
            dateOfBirth: user.date_of_birth || "",
            location: "",
            publishRide: false,
            partnerType: "",
            businessName: "",
            professionalType: "",
            multiVehicle: false,
          });
          
          if (user.profile_image) {
            setProfileImage(user.profile_image);
            setIsProfileImageUploaded(true);
          } else {
            setIsProfileImageUploaded(false);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("An error occurred while loading profile");
    } finally {
      setFetching(false);
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

  // Compress image to under 2MB
  const compressImageToUnder2MB = (blob: Blob, maxAttempts = 3, attempt = 1): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
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
          
          let quality = 0.8 - (attempt * 0.2);
          if (quality < 0.4) quality = 0.4;
          
          canvas.toBlob(
            (compressedBlob) => {
              if (compressedBlob) {
                console.log(`Compression attempt ${attempt}:`, (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');
                
                if (compressedBlob.size > 2 * 1024 * 1024 && attempt < maxAttempts) {
                  resolve(compressImageToUnder2MB(compressedBlob, maxAttempts, attempt + 1));
                } else {
                  resolve(compressedBlob);
                }
              } else {
                resolve(blob);
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
        resolve(blob);
      };
      
      img.src = URL.createObjectURL(blob);
    });
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              setImageUploading(true);
              const compressedBlob = await compressImageToUnder2MB(blob);
              
              const file = new File([compressedBlob], `profile-photo-${Date.now()}.jpg`, { 
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              console.log('Captured image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
              
              if (file.size > 2 * 1024 * 1024) {
                toast.error('Image is still too large. Please try again with better lighting.');
                stopCameraStream();
                setImageUploading(false);
                return;
              }
              
              stopCameraStream();
              await uploadProfileImage(file);
            } catch (error) {
              console.error('Error processing photo:', error);
              toast.error('Failed to process photo');
            } finally {
              setImageUploading(false);
            }
          } else {
            toast.error('Failed to capture photo');
            stopCameraStream();
            setImageUploading(false);
          }
        }, 'image/jpeg', 0.7);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo');
      stopCameraStream();
      setImageUploading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file: File) => {
    try {
      setLoading(true);
      setImageUploading(true);
      
      const validImageTypes = ['image/jpeg', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        toast.error('Only JPEG images are allowed');
        setImageUploading(false);
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        setImageUploading(false);
        return;
      }
      
      toast.info('Uploading profile picture...');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      const uploadFormData = new FormData();
      uploadFormData.append('profile_image', file);
      uploadFormData.append('firstName', formData.firstName || '');
      uploadFormData.append('lastName', formData.lastName || '');
      uploadFormData.append('dateOfBirth', formData.dateOfBirth || '');
      uploadFormData.append('gender', formData.gender);
      uploadFormData.append('multiVehicle', formData.multiVehicle.toString());
      
      if (formData.location) {
        uploadFormData.append('location', formData.location);
      }
      
      if (formData.publishRide !== undefined) {
        uploadFormData.append('publishRide', formData.publishRide.toString());
      }
      
      if (formData.partnerType) {
        uploadFormData.append('partnerType', formData.partnerType);
      }
      
      if (formData.businessName) {
        uploadFormData.append('businessName', formData.businessName);
      }
      
      if (formData.professionalType) {
        uploadFormData.append('professionalType', formData.professionalType);
      }
      
      const result = await ProfileApiService.updateBasicProfile(uploadFormData);
      
      if (result.success) {
        setIsProfileImageUploaded(true);
        toast.success('Profile picture updated successfully!');
        
        const userUpdateData: any = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          profile_image: reader.result as string,
        };
        
        updateUser(userUpdateData);
        // Refresh central profile data if available
        if (refreshProfile) {
          await refreshProfile();
        }
      } else {
        toast.error(result.error || 'Failed to update profile picture');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('An error occurred while uploading image');
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  // Handle camera click
  const handleCameraClick = async () => {
    if (loading || cameraAccessing || imageUploading) return;
    
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

  const handleSave = async () => {
    if (!isProfileImageUploaded) {
      toast.error('Please upload your profile image before saving');
      toast.info('Click the camera icon to take a profile photo');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast.error("You must be at least 18 years old");
        return;
      }
    }

    if (formData.publishRide && formData.partnerType === "commercial") {
      if (!formData.businessName) {
        toast.error("Business name is required for commercial partner");
        return;
      }
      if (!formData.location) {
        toast.error("Location is required for commercial partner");
        return;
      }
    }

    if (formData.publishRide && !formData.partnerType) {
      toast.error("Please select a partner type when publishing rides");
      return;
    }

    try {
      setLoading(true);
      console.log("Saving profile data:", formData);
      
      const formDataObj = ProfileApiService.createProfileFormData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        multiVehicle: formData.multiVehicle,
        publishRide: formData.publishRide,
        partnerType: formData.partnerType,
        businessName: formData.businessName,
        location: formData.location,
        professionalType: formData.professionalType,
      });
      
      const result = await ProfileApiService.updateBasicProfile(formDataObj);
      
      if (result.success) {
        toast.success(result.message || "Your details have been saved successfully!");
        
        const userUpdateData: any = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
        };
        
        updateUser(userUpdateData);
        // Refresh central profile data if available
        if (refreshProfile) {
          await refreshProfile();
        }
        
        // AUTO-NAVIGATE TO ID PROOF AFTER SUCCESSFUL SAVE
        setTimeout(() => {
          navigate('/id-proof');
        }, 1000);
      } else {
        toast.error(result.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  // Handle publish ride toggle
  const handlePublishRideToggle = (checked: boolean) => {
    const newFormData = {
      ...formData,
      publishRide: checked,
      partnerType: checked ? formData.partnerType : "",
      businessName: checked ? formData.businessName : "",
      professionalType: "",
      multiVehicle: checked ? formData.multiVehicle : false,
    };
    
    setFormData(newFormData);
  };

  // Handle partner type change
  const handlePartnerTypeChange = (type: "individual" | "commercial") => {
    setFormData({
      ...formData,
      partnerType: type,
      businessName: type === "commercial" ? formData.businessName : "",
      professionalType: "",
    });
  };

  // Handle multiVehicle toggle
  const handleMultiVehicleToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      multiVehicle: checked,
    });
  };

  const genderOptions = ["male", "female", "others"];

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray- 50 px-4 py-4">
    

     
      {/* Form Card */}
      <div className="px-4 md:px-8 lg:px-16">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 max-w-3xl mx-auto">
          {/* Profile Image Section */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100 border-4 border-white shadow-lg">
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
                              ${formData.firstName?.charAt(0) || formData.lastName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                    <span className="text-3xl md:text-4xl text-white font-bold">
                      {formData.firstName?.charAt(0) || formData.lastName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || cameraAccessing || imageUploading}
                title="Take photo with camera"
              >
                {loading || cameraAccessing || imageUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiCamera size={20} />
                )}
              </button>
              
              {/* Profile Image Required Indicator */}
              {!isProfileImageUploaded && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  Required
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Upload Warning */}
          {!isProfileImageUploaded && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-700 font-medium">
                ⚠️ Profile photo is required
              </p>
              <p className="text-yellow-600 text-sm mt-1">
                Please upload your profile image before saving
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="h-12"
                  disabled={loading || imageUploading}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-12"
                  disabled={loading || imageUploading}
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob">
                  Date of birth <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div
                    onClick={() => !loading && !imageUploading && handleDatePicker()}
                    className={`w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-between h-12 ${loading || imageUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={formData.dateOfBirth ? 'text-gray-800' : 'text-gray-400'}>
                      {formData.dateOfBirth ? formatDateForDisplay(formData.dateOfBirth) : "Select date"}
                    </span>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  {formData.dateOfBirth && (
                    <div className="mt-1 text-xs text-gray-500">
                      Age: {calculateAge(formData.dateOfBirth)} years
                      {calculateAge(formData.dateOfBirth) < 18 && (
                        <span className="text-red-500 ml-1">(Must be 18+)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Gender */}
              <div className="space-y-3">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 flex-wrap">
                  {genderOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option as "male" | "female" | "others" })}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.gender === option
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      disabled={loading || imageUploading}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Ride Toggle */}
              <div className="space-y-3">
                <Label>
                  Do you want to publish a ride?
                </Label>
                <Switch
                  checked={formData.publishRide}
                  onChange={handlePublishRideToggle}
                  label={formData.publishRide ? "Yes" : "No"}
                />
                <p className="text-xs text-gray-500">
                  {formData.publishRide 
                    ? "You want to publish rides as a partner"
                    : "You don't want to publish rides"}
                </p>
              </div>

              {/* Partner Type Selection (Only shown when publishRide is true) */}
              {formData.publishRide && (
                <>
                  <div className="space-y-3">
                    <Label>Partner Type</Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => handlePartnerTypeChange("individual")}
                        className={`px-6 py-3 rounded-lg flex-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          formData.partnerType === "individual"
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        disabled={loading || imageUploading}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePartnerTypeChange("commercial")}
                        className={`px-6 py-3 rounded-lg flex-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          formData.partnerType === "commercial"
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        disabled={loading || imageUploading}
                      >
                        Commercial
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Select your partner type to continue
                    </p>
                  </div>

                  {/* MultiVehicle Toggle (Only shown when publishRide is true) */}
                  <div className="space-y-3">
                    <Label>
                      Multiple Vehicles
                    </Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Do you have multiple vehicles?
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.multiVehicle 
                            ? "You can manage multiple vehicles" 
                            : "You have single vehicle access"}
                        </p>
                      </div>
                      <Switch
                        checked={formData.multiVehicle}
                        onChange={handleMultiVehicleToggle}
                      />
                    </div>
                  </div>

                  {/* Business Name Field (Only for Commercial partners) */}
                  {formData.partnerType === "commercial" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          Business Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="businessName"
                          placeholder="Enter your business name"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="h-12"
                          disabled={loading || imageUploading}
                        />
                        <p className="text-xs text-gray-500">
                          Required for commercial partners
                        </p>
                      </div>

                      {/* Location Field (Only for Commercial partners) */}
                      <div className="space-y-2">
                        <Label htmlFor="location">
                          Location <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="location"
                          placeholder="Enter your location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="h-12"
                          disabled={loading || imageUploading}
                        />
                        <p className="text-xs text-gray-500">
                          Required for commercial partners
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <Button
              onClick={handleSave}
              variant="default"
              size="default"
              className="px-8 py-3 rounded-full"
              disabled={loading || imageUploading || !formData.firstName || !formData.lastName || !isProfileImageUploaded}
            >
              {loading || imageUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {imageUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                "Save details"
              )}
            </Button>
          </div>
          
          {/* Save Button Warning */}
          {!isProfileImageUploaded && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">
                ❌ Please upload your profile image to enable save button
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DATE PICKER MODAL */}
      {showDatePickerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Date of Birth</h3>
              <p className="text-sm text-gray-600 mb-4">
                You must be at least 18 years old
              </p>
              
              <div className="mb-6">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleDateChange}
                  max={calculateMaxDate()}
                  min={calculateMinDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                  disabled={loading || imageUploading}
                />
                
                {formData.dateOfBirth && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-700">
                      Selected: <span className="font-medium">{formatDateForDisplay(formData.dateOfBirth)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Age: <span className="font-medium">{calculateAge(formData.dateOfBirth)} years</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDatePickerModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={loading || imageUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.dateOfBirth) {
                      const age = calculateAge(formData.dateOfBirth);
                      if (age < 18) {
                        toast.error("You must be at least 18 years old");
                      } else {
                        setShowDatePickerModal(false);
                      }
                    } else {
                      toast.error("Please select a date");
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  disabled={loading || imageUploading}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA PREVIEW MODAL */}
      {showCameraPreview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={stopCameraStream}
              className="bg-white p-2 rounded-full hover:bg-gray-100 transition"
              disabled={loading || imageUploading}
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
                disabled={loading || imageUploading}
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
    </div>
  );
};

export default BasicDetails;