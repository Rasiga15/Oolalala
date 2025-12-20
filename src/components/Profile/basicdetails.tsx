import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { FiChevronLeft } from "react-icons/fi";

// Custom components
import { Button } from "../common/Button";
import ProfileApiService, { BasicProfileData } from "../../services/profileApi";
import { useAuth } from "../../contexts/AuthContext";

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
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

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

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setFetching(true);
      console.log("Fetching profile data...");
      
      const result = await ProfileApiService.getBasicProfile();
      
      if (result.success && result.data) {
        console.log("Profile data loaded:", result.data);
        
        // Set form data from API response
        setFormData({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          gender: result.data.gender || "male",
          dateOfBirth: result.data.dateOfBirth || "",
          location: result.data.location || "",
          publishRide: result.data.publishRide || false,
          partnerType: result.data.partnerType || "",
          businessName: result.data.businessName || "",
          professionalType: result.data.professionalType || "",
          multiVehicle: result.data.multiVehicle || false,
        });
        
        toast.success("Profile loaded successfully");
      } else {
        console.error("Failed to load profile:", result.error);
        toast.error(result.error || "Failed to load profile data");
        
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
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("An error occurred while loading profile");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check age requirement for date of birth
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast.error("You must be at least 18 years old");
        return;
      }
    }

    // Validation for commercial partner type
    if (formData.publishRide && formData.partnerType === "commercial" && !formData.businessName) {
      toast.error("Business name is required for commercial partner");
      return;
    }

    // Validation for partner type when publishRide is true
    if (formData.publishRide && !formData.partnerType) {
      toast.error("Please select a partner type when publishing rides");
      return;
    }

    // Validation for professional type when individual partner
    if (formData.publishRide && formData.partnerType === "individual" && !formData.professionalType) {
      toast.error("Professional type is required for individual partner");
      return;
    }

    try {
      setLoading(true);
      console.log("Saving profile data:", formData);
      
      // Create FormData object for the update using the service method
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
      
      console.log("FormData keys:", Array.from(formDataObj.keys()));
      
      // Update profile
      const result = await ProfileApiService.updateBasicProfile(formDataObj);
      
      if (result.success) {
        toast.success(result.message || "Your details have been saved successfully!");
        
        // Update user in auth context
        const userUpdateData: any = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
        };
        
        updateUser(userUpdateData);
        
        // Navigate back after successful save
        setTimeout(() => navigate(-1), 1000);
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
      professionalType: checked ? formData.professionalType : "",
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
      professionalType: type === "individual" ? formData.professionalType : "",
    });
  };

  // Handle multiVehicle toggle
  const handleMultiVehicleToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      multiVehicle: checked,
    });
  };

  // Handle professional type change (now as input field)
  const handleProfessionalTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      professionalType: e.target.value,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-center bg-white px-4 py-4 relative shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <FiChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Basic details</h1>
      </div>

      {/* Subtitle */}
      <p className="text-center text-sm text-gray-600 mt-2 mb-6">
        Make sure your personal information is accurate.
      </p>

      {/* Form Card */}
      <div className="px-4 md:px-8 lg:px-16">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="h-12"
                  disabled={loading}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-12"
                  disabled={loading}
                />
              </div>

              {/* Date of Birth and Location in same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Date of birth
                  </Label>
                  <div className="relative">
                    <div
                      onClick={handleDatePicker}
                      className={`w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer flex items-center justify-between h-12 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                {/* Location (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    placeholder="Enter your location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-12"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Gender */}
              <div className="space-y-3">
                <Label>Gender</Label>
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
                      disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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

                  {/* Professional Type Input Field (Only for Individual partners) - CHANGED FROM SELECT TO INPUT */}
                  {formData.partnerType === "individual" && (
                    <div className="space-y-2">
                      <Label htmlFor="professionalType">
                        Professional Type <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="professionalType"
                        type="text"
                        placeholder="e.g., Software Engineer, Doctor, Teacher, etc."
                        value={formData.professionalType}
                        onChange={handleProfessionalTypeChange}
                        className="h-12"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500">
                        Enter your profession (e.g., Software Engineer, Doctor, Teacher)
                      </p>
                    </div>
                  )}

                  {/* Business Name Field (Only for Commercial partners) */}
                  {formData.partnerType === "commercial" && (
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
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500">
                        Required for commercial partners
                      </p>
                    </div>
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
              disabled={loading || !formData.firstName || !formData.lastName}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save details"
              )}
            </Button>
          </div>
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
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicDetails;