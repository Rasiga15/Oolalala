import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiCamera, FiCheck, FiMail, FiCalendar, FiUpload, FiSmartphone } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { driverManagementAPI } from '@/services/drivermanagementapi';
import { useAuth } from '@/contexts/AuthContext';

interface OtpLog {
  id?: number;
  mobile?: string;
  email?: string;
  verified: boolean;
  type: 'mobile' | 'email';
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  license?: string;
  dateOfBirth?: string;
  profileImage?: string;
  gender?: string;
  [key: string]: string | undefined;
}

const DriverManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // ================= FORM STATE =================
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [license, setLicense] = useState('');

  // ================= VALIDATION ERRORS =================
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // ================= DATE PICKER STATE =================
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // ================= MOBILE OTP =================
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '', '', '']);
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [mobileOtpLog, setMobileOtpLog] = useState<OtpLog | null>(null);
  const [isRequestingMobileOtp, setIsRequestingMobileOtp] = useState(false);
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  // ================= EMAIL OTP =================
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtpLog, setEmailOtpLog] = useState<OtpLog | null>(null);
  const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // ================= CAMERA =================
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mobileOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ================= HELPER FUNCTIONS =================
  const removeAllSpaces = (value: string): string => {
    return value.replace(/\s+/g, '');
  };

  // ================= VALIDATION FUNCTIONS =================
  const validateDrivingLicense = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Driving license is required';
    }
    
    const cleanedValue = removeAllSpaces(value).toUpperCase();
    
    if (cleanedValue.length !== 15) {
      return 'Must be exactly 15 characters';
    }
    
    if (!/^[A-Z]{2}[0-9]{13}$/.test(cleanedValue)) {
      return 'Format: First 2 letters, then 13 numbers (e.g., TN9912345678901)';
    }
    
    return null;
  };

  const formatDrivingLicense = (value: string): string => {
    const cleaned = removeAllSpaces(value).toUpperCase();
    if (cleaned.length > 15) {
      return cleaned.substring(0, 15);
    }
    
    if (cleaned.length === 0) return value;
    
    if (cleaned.length === 15) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}`;
    }
    
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      const end = i + 4 < cleaned.length ? i + 4 : cleaned.length;
      chunks.push(cleaned.substring(i, end));
    }
    
    return chunks.join(' ');
  };

  const getRawValue = (value: string): string => {
    return removeAllSpaces(value);
  };

  const validateMobile = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Mobile number is required';
    }
    
    const cleanedValue = removeAllSpaces(value);
    
    if (!/^[0-9]{10}$/.test(cleanedValue)) {
      return 'Enter valid 10-digit mobile number';
    }
    
    return null;
  };

  const validateEmail = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return null;
    }
    
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
      return 'Enter valid email address';
    }
    
    return null;
  };

  const validateName = (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`;
    }
    
    if (value.trim().length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return `${fieldName} can only contain letters and spaces`;
    }
    
    return null;
  };

  const validateDate = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Date of birth is required';
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'Format: YYYY-MM-DD';
    }
    
    const birthDate = new Date(value);
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    
    if (birthDate > eighteenYearsAgo) {
      return 'Driver must be at least 18 years old';
    }
    
    return null;
  };

  const validateProfileImage = (value: string | null): string | null => {
    if (!value) {
      return 'Profile image is required';
    }
    return null;
  };

  const validateGender = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Gender is required';
    }
    return null;
  };

  // ================= VALIDATION HANDLERS =================
  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'firstName':
        return validateName(value, 'First name');
      case 'lastName':
        return validateName(value, 'Last name');
      case 'email':
        return validateEmail(value);
      case 'mobile':
        return validateMobile(value);
      case 'license':
        return validateDrivingLicense(value);
      case 'dateOfBirth':
        return validateDate(value);
      case 'profileImage':
        return validateProfileImage(photo);
      case 'gender':
        return validateGender(value);
      default:
        return null;
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'email':
        setEmail(value);
        if (isEmailVerified) {
          setIsEmailVerified(false);
          setEmailOtpLog(null);
          setShowEmailOtp(false);
          setEmailOtpSent(false);
        }
        break;
      case 'mobile':
        if (/^\d*$/.test(value) && value.length <= 10) {
          setMobile(value);
          if (isMobileVerified) {
            setIsMobileVerified(false);
            setMobileOtpLog(null);
            setShowMobileOtp(false);
            setMobileOtpSent(false);
          }
        }
        break;
      case 'license':
        const formattedLicense = formatDrivingLicense(value);
        setLicense(formattedLicense);
        break;
      case 'dateOfBirth':
        setDob(value);
        break;
      case 'gender':
        setGender(value);
        break;
    }

    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: ValidationErrors = {};
    
    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateName(lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    
    const mobileError = validateMobile(mobile);
    if (mobileError) errors.mobile = mobileError;
    
    const licenseError = validateDrivingLicense(license);
    if (licenseError) errors.license = licenseError;
    
    const dateError = validateDate(dob);
    if (dateError) errors.dateOfBirth = dateError;
    
    const profileImageError = validateProfileImage(photo);
    if (profileImageError) errors.profileImage = profileImageError;
    
    const genderError = validateGender(gender);
    if (genderError) errors.gender = genderError;
    
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= DATE PICKER FUNCTIONS =================
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

  const selectDate = () => {
    setShowDatePicker(true);
  };

 const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.value;
  if (!selected) return;

  const selectedDateObj = new Date(selected);
  const now = new Date();
  const eighteenYearsAgo = new Date(
    now.getFullYear() - 18,
    now.getMonth(),
    now.getDate()
  );

  if (selectedDateObj > eighteenYearsAgo) {
    toast.error('Driver must be at least 18 years old');
    return;
  }

  setDob(selected);
  setSelectedDate(selected);
};

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

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

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (!isAuthenticated || !authToken) {
        toast.error('Please login as a partner first');
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate, user]);

  // ================= MOBILE OTP HANDLERS =================
  const sendMobileOtp = async () => {
    const mobileError = validateMobile(mobile);
    if (mobileError) {
      setValidationErrors(prev => ({ ...prev, mobile: mobileError }));
      toast.error(mobileError);
      return;
    }

    setIsRequestingMobileOtp(true);
    try {
      const result = await driverManagementAPI.requestOtp(mobile, 'register');
      
      if (result.success) {
        setShowMobileOtp(true);
        setMobileOtpSent(true);
        toast.success('OTP sent successfully to ' + mobile);
        // Focus on first OTP input
        setTimeout(() => {
          mobileOtpRefs.current[0]?.focus();
        }, 100);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Error sending OTP');
    } finally {
      setIsRequestingMobileOtp(false);
    }
  };

  const verifyMobileOtp = async () => {
    const otpCode = mobileOtp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsVerifyingMobileOtp(true);
    try {
      const result = await driverManagementAPI.verifyMobileOtp(
        mobile, 
        otpCode, 
        'register'
      );
      
      if (result.success && result.data) {
        setIsMobileVerified(true);
        setShowMobileOtp(false);
        setMobileOtpLog({
          id: result.data.otp_log_id,
          mobile: mobile,
          verified: true,
          type: 'mobile'
        });
        toast.success('Mobile number verified successfully');
      } else {
        toast.error(result.error || result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your internet connection.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error verifying OTP. Please try again.');
      }
    } finally {
      setIsVerifyingMobileOtp(false);
    }
  };

  // ================= EMAIL OTP HANDLERS =================
  const sendEmailOtp = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationErrors(prev => ({ ...prev, email: emailError }));
      toast.error(emailError);
      return;
    }

    setIsRequestingEmailOtp(true);
    try {
      const result = await driverManagementAPI.requestEmailOtp(email, 'register');
      
      if (result.success) {
        setShowEmailOtp(true);
        setEmailOtpSent(true);
        toast.success('OTP sent successfully to ' + email);
        // Focus on first OTP input
        setTimeout(() => {
          emailOtpRefs.current[0]?.focus();
        }, 100);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Error sending OTP');
    } finally {
      setIsRequestingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const otpCode = emailOtp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const result = await driverManagementAPI.verifyEmailOtp(
        email, 
        otpCode, 
        'register'
      );
      
      if (result.success && result.data) {
        setIsEmailVerified(true);
        setShowEmailOtp(false);
        setEmailOtpLog({
          id: result.data.otp_log_id,
          email: email,
          verified: true,
          type: 'email'
        });
        toast.success('Email verified successfully');
      } else {
        toast.error(result.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Error verifying OTP');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  // ================= OTP INPUT HANDLERS =================
  const handleMobileOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const newOtp = [...mobileOtp];
    newOtp[i] = v;
    setMobileOtp(newOtp);
    if (v && i < 5) mobileOtpRefs.current[i + 1]?.focus();
  };

  const handleEmailOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const newOtp = [...emailOtp];
    newOtp[i] = v;
    setEmailOtp(newOtp);
    if (v && i < 5) emailOtpRefs.current[i + 1]?.focus();
  };

  // ================= CAMERA HANDLERS =================
  const openCamera = async () => {
    try {
      setCameraLoading(true);
      setPhoto(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device/browser');
        setCameraLoading(false);
        return;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      setCameraOpen(true);
      setCameraLoading(false);
      
      setTimeout(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.srcObject = stream;
          
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              closeCamera();
            });
          }
        }
      }, 100);
      
    } catch (error: any) {
      setCameraLoading(false);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application.');
      } else {
        toast.error(`Unable to access camera: ${error.message}`);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Failed to get canvas context');
        return;
      }
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        toast.error('Camera not ready yet. Please wait a moment.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(photoDataUrl);
      
      if (validationErrors.profileImage) {
        setValidationErrors(prev => ({
          ...prev,
          profileImage: undefined
        }));
      }
      
      toast.success('Photo captured successfully!');
      closeCamera();
      
    } catch (error) {
      toast.error('Failed to capture photo');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraOpen(false);
    setCameraLoading(false);
  };

  // ================= FILE UPLOAD HANDLER =================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setPhoto(result);
        
        if (validationErrors.profileImage) {
          setValidationErrors(prev => ({
            ...prev,
            profileImage: undefined
          }));
        }
        
        toast.success('Photo uploaded successfully');
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, []);

  // ================= SAVE DRIVER =================
  const saveDriver = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Please login as a partner first');
      navigate('/login');
      return;
    }

    const isValid = validateAllFields();
    if (!isValid) {
      const errorMessages = Object.values(validationErrors).filter(msg => msg);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      } else {
        toast.error('Please fill all required fields correctly');
      }
      return;
    }
    
    if (!isMobileVerified || !mobileOtpLog?.id) {
      toast.error('Please verify mobile number first');
      return;
    }
    
    const age = calculateAge(dob);
    if (age < 18) {
      toast.error('Driver must be at least 18 years old');
      return;
    }

    if (email.trim() && !isEmailVerified) {
      toast.error('Please verify email address or remove it');
      return;
    }

    let profileImageFile: File | null = null;
    if (photo) {
      try {
        const base64Response = await fetch(photo);
        const blob = await base64Response.blob();
        
        if (blob.size > 2 * 1024 * 1024) {
          toast.error('Profile image must be less than 2MB');
          return;
        }
        
        profileImageFile = new File([blob], 'profile.jpg', { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
      } catch (error) {
        toast.error('Error processing profile photo');
        return;
      }
    } else {
      toast.error('Profile image is required');
      return;
    }

    const formData: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile_number: getRawValue(mobile),
      mobile_otp_log_id: mobileOtpLog.id,
      date_of_birth: dob,
      driving_licence_number: getRawValue(license),
      gender: gender,
      profile_image: profileImageFile,
    };

    if (email.trim() && emailOtpLog?.id) {
      formData.email_address = email.trim();
      formData.email_otp_log_id = emailOtpLog.id;
    }

    try {
      const result = await driverManagementAPI.createDriver(formData);
      
      if (result.success) {
        toast.success('Driver added successfully!');
        resetForm();
        navigate('/drivers');
      } else {
        toast.error(result.error || 'Failed to add driver');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Error saving driver. Please check your connection and try again.');
      }
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender('');
    setDob('');
    setMobile('');
    setLicense('');
    setPhoto(null);
    setMobileOtp(['', '', '', '', '', '']);
    setEmailOtp(['', '', '', '', '', '']);
    setIsMobileVerified(false);
    setIsEmailVerified(false);
    setMobileOtpLog(null);
    setEmailOtpLog(null);
    setShowMobileOtp(false);
    setShowEmailOtp(false);
    setMobileOtpSent(false);
    setEmailOtpSent(false);
    setSelectedDate('');
    setShowDatePicker(false);
    setValidationErrors({});
  };

  // ================= RESEND OTP HANDLERS =================
  const resendMobileOtp = async () => {
    if (isRequestingMobileOtp) return;
    await sendMobileOtp();
  };

  const resendEmailOtp = async () => {
    if (isRequestingEmailOtp) return;
    await sendEmailOtp();
  };

  // ================= CANCEL OTP HANDLERS =================
  const cancelMobileOtp = () => {
    setShowMobileOtp(false);
    setMobileOtp(['', '', '', '', '', '']);
    setMobileOtpSent(false);
  };

  const cancelEmailOtp = () => {
    setShowEmailOtp(false);
    setEmailOtp(['', '', '', '', '', '']);
    setEmailOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* AUTH STATUS INFO */}
        {user && (
          <div className="mb-3 sm:mb-4 lg:mb-5 p-3 sm:p-4 bg-blue-50 text-blue-700 rounded-lg text-sm sm:text-base">
            Logged in as: {user.first_name} {user.last_name} ({user.role})
          </div>
        )}

        {/* PROFILE PHOTO SECTION */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 lg:mb-10">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
              {photo ? (
                <img 
                  src={photo} 
                  className="w-full h-full object-cover" 
                  alt="Driver" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="%239CA3AF" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                    setPhoto(null);
                  }}
                />
              ) : (
                <span className="text-2xl sm:text-3xl lg:text-4xl text-gray-400">👤</span>
              )}
            </div>
            
            {/* Camera and Upload Buttons */}
            <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 lg:-bottom-3 lg:-right-3 flex gap-1 sm:gap-1.5">
              {/* Camera Button */}
              <button
                onClick={openCamera}
                disabled={cameraLoading}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-[#21409A] rounded-full flex items-center justify-center hover:bg-[#1a357d] transition-colors disabled:opacity-50"
                title="Take photo"
              >
                {cameraLoading ? (
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiCamera className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                )}
              </button>
              
              {/* Upload Button */}
              <label className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FiUpload className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              </label>
            </div>
          </div>
          
          {/* Profile Image Validation Error */}
          {validationErrors.profileImage && (
            <div className="mt-1.5 sm:mt-2 lg:mt-3 text-center">
              <p className="text-xs sm:text-sm text-red-500">{validationErrors.profileImage}</p>
            </div>
          )}
          
          <p className="mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm lg:text-base text-gray-500 text-center px-2">
            Click camera to take photo or upload image (Max 2MB)
          </p>
        </div>

        {/* FORM GRID - RESPONSIVE COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 lg:mb-8">
          {/* ROW 1 */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">First Name *</label>
            <Input 
              placeholder="Enter first name" 
              value={firstName} 
              onChange={e => handleFieldChange('firstName', e.target.value)}
              className="h-10 sm:h-11 lg:h-12 text-sm sm:text-base"
            />
            {validationErrors.firstName && (
              <p className="text-xs text-red-500">{validationErrors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Last Name *</label>
            <Input 
              placeholder="Enter last name" 
              value={lastName} 
              onChange={e => handleFieldChange('lastName', e.target.value)}
              className="h-10 sm:h-11 lg:h-12 text-sm sm:text-base"
            />
            {validationErrors.lastName && (
              <p className="text-xs text-red-500">{validationErrors.lastName}</p>
            )}
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Email </label>
            <div className="flex gap-1.5 sm:gap-2">
              <Input 
                type="email"
                placeholder="Enter email address" 
                value={email} 
                onChange={e => handleFieldChange('email', e.target.value)}
                disabled={isEmailVerified}
                className="h-10 sm:h-11 lg:h-12 text-sm sm:text-base flex-1"
              />
              {email && !isEmailVerified && !showEmailOtp && (
                <button 
                  onClick={sendEmailOtp}
                  disabled={isRequestingEmailOtp || !email.includes('@')}
                  className="px-3 sm:px-4 h-10 sm:h-11 lg:h-12 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {isRequestingEmailOtp ? 'Sending...' : 'Send OTP'}
                </button>
              )}
              {isEmailVerified && (
                <div className="flex items-center justify-center px-3 sm:px-4 h-10 sm:h-11 lg:h-12 bg-green-100 text-green-700 rounded-lg font-medium text-xs sm:text-sm">
                  <FiCheck className="mr-1.5" /> Verified
                </div>
              )}
            </div>
            {validationErrors.email && (
              <p className="text-xs text-red-500">{validationErrors.email}</p>
            )}

            {/* Email OTP Input Section - Below Email Field */}
            {showEmailOtp && !isEmailVerified && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <FiMail className="mr-2" />
                    Enter OTP sent to {email}
                  </h4>
                  <button 
                    onClick={cancelEmailOtp}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  {emailOtp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => {
                        if (el) emailOtpRefs.current[index] = el;
                      }}
                      value={digit}
                      onChange={e => handleEmailOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          emailOtpRefs.current[index - 1]?.focus();
                        }
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
                      maxLength={1}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={isVerifyingEmailOtp}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={verifyEmailOtp}
                    disabled={isVerifyingEmailOtp || emailOtp.join('').length !== 6}
                    className="flex-1 h-10 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isVerifyingEmailOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button 
                    onClick={resendEmailOtp}
                    disabled={isRequestingEmailOtp}
                    className="px-4 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    {isRequestingEmailOtp ? '...' : 'Resend'}
                  </button>
                </div>
                
                {emailOtpSent && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ OTP sent successfully. Check your email.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ROW 2 */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Gender *</label>
            <select
              value={gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="h-10 sm:h-11 lg:h-12 w-full border border-gray-300 rounded-lg px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {validationErrors.gender && (
              <p className="text-xs text-red-500">{validationErrors.gender}</p>
            )}
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Date of Birth *</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-2.5 sm:top-3 lg:top-3.5 text-gray-400 w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <Input 
                type="date"
                placeholder="Select date of birth"
                value={dob}
                onChange={e => {
                  handleDateChange(e);
                  handleFieldChange('dateOfBirth', e.target.value);
                }}
                max={calculateMaxDate()}
                min={calculateMinDate()}
                className="pl-9 sm:pl-10 h-10 sm:h-11 lg:h-12 text-sm sm:text-base"
                onFocus={() => setShowDatePicker(true)}
              />
              {dob && (
                <div className="mt-0.5 sm:mt-1 text-xs text-gray-500">
                  Age: {calculateAge(dob)} years
                  {calculateAge(dob) < 18 && (
                    <span className="text-red-500 ml-1">(Must be 18+)</span>
                  )}
                </div>
              )}
            </div>
            {validationErrors.dateOfBirth && (
              <p className="text-xs text-red-500">{validationErrors.dateOfBirth}</p>
            )}
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Mobile Number *</label>
            <div className="flex gap-1.5 sm:gap-2">
              <Input
                placeholder="Enter mobile number"
                value={mobile}
                onChange={e => handleFieldChange('mobile', e.target.value)}
                disabled={isMobileVerified}
                className="h-10 sm:h-11 lg:h-12 text-sm sm:text-base flex-1"
              />
              {!isMobileVerified && !showMobileOtp ? (
                <button 
                  onClick={sendMobileOtp}
                  disabled={isRequestingMobileOtp || mobile.length !== 10}
                  className="px-3 sm:px-4 h-10 sm:h-11 lg:h-12 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {isRequestingMobileOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : isMobileVerified ? (
                <div className="flex items-center justify-center px-3 sm:px-4 h-10 sm:h-11 lg:h-12 bg-green-100 text-green-700 rounded-lg font-medium text-xs sm:text-sm">
                  <FiCheck className="mr-1.5" /> Verified
                </div>
              ) : null}
            </div>
            {validationErrors.mobile && (
              <p className="text-xs text-red-500">{validationErrors.mobile}</p>
            )}

            {/* Mobile OTP Input Section - Below Mobile Field */}
            {showMobileOtp && !isMobileVerified && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <FiSmartphone className="mr-2" />
                    Enter OTP sent to {mobile}
                  </h4>
                  <button 
                    onClick={cancelMobileOtp}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  {mobileOtp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => {
                        if (el) mobileOtpRefs.current[index] = el;
                      }}
                      value={digit}
                      onChange={e => handleMobileOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          mobileOtpRefs.current[index - 1]?.focus();
                        }
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
                      maxLength={1}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={isVerifyingMobileOtp}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={verifyMobileOtp}
                    disabled={isVerifyingMobileOtp || mobileOtp.join('').length !== 6}
                    className="flex-1 h-10 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isVerifyingMobileOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button 
                    onClick={resendMobileOtp}
                    disabled={isRequestingMobileOtp}
                    className="px-4 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    {isRequestingMobileOtp ? '...' : 'Resend'}
                  </button>
                </div>
                
                {mobileOtpSent && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ OTP sent successfully. Check your SMS.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ROW 3 */}
          <div className="space-y-1.5 sm:space-y-2 col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <label className="text-xs sm:text-sm lg:text-base font-medium text-gray-700">Driving License Number *</label>
            <Input 
              placeholder="XX99 9999 9999999" 
              value={license} 
              onChange={e => handleFieldChange('license', e.target.value)}
              className="h-10 sm:h-11 lg:h-12 text-sm sm:text-base"
            />
            <div className="text-xs text-gray-500">
              Format: First 2 letters, then 13 numbers (15 total)
            </div>
            {validationErrors.license && (
              <p className="text-xs text-red-500">{validationErrors.license}</p>
            )}
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="flex items-center justify-between mt-6 sm:mt-8 lg:mt-10 pt-4 sm:pt-5 lg:pt-6 border-t">
          <button
            onClick={() => navigate('/drivers')}
            className="px-6 py-2.5 sm:px-7 sm:py-3 lg:px-8 lg:py-3.5  border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base lg:text-lg"
          >
            Cancel
          </button>
          
          <button
            onClick={saveDriver}
            className="px-6 py-2.5 sm:px-7 sm:py-3 lg:px-8 lg:py-3.5  bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg"
            disabled={!photo || !isMobileVerified}
          >
            Save Driver
          </button>
        </div>
      </div>

      {/* DATE PICKER MODAL */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl max-w-sm sm:max-w-md w-full">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">Select Date of Birth</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Driver must be at least 18 years old</p>
            <input
              type="date"
              value={dob}
              onChange={handleDateChange}
              max={calculateMaxDate()}
              min={calculateMinDate()}
              className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg mb-3 sm:mb-4 text-sm sm:text-base"
              autoFocus
            />
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setShowDatePicker(false)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Cancel
              </button>
             <button 
  onClick={() => {
    if (dob) {
      setShowDatePicker(false); // ✅ correct place
      toast.success(`Date of birth set to: ${formatDateForDisplay(dob)}`);
    } else {
      toast.error('Please select a date');
    }
  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors text-xs sm:text-sm"

>
  Confirm
</button>

            </div>
          </div>
        </div>
      )}

      {/* CAMERA MODAL */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header with close button */}
          <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
            <button 
              onClick={closeCamera}
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <span className="text-white font-medium text-sm sm:text-base lg:text-lg">Take Profile Photo</span>
            <div className="w-8 sm:w-9 lg:w-10"></div>
          </div>
          
          {/* Video preview */}
          <div className="flex-1 relative overflow-hidden">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {}}
              onError={(e) => {
                toast.error('Camera error. Please try again.');
                closeCamera();
              }}
            />
            
            {/* Camera overlay with face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80">
                {/* Face guide circle */}
                <div className="absolute inset-0 border-2 border-white/60 rounded-full"></div>
                {/* Guide dots */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white/60"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white/60"></div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white/60"></div>
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white/60"></div>
              </div>
            </div>
          </div>
          
          {/* Camera controls at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <p className="text-white/80 text-xs sm:text-sm text-center">
                Position your face within the circle
              </p>
              
              <div className="flex items-center gap-4 sm:gap-5 lg:gap-6">
                {/* Close camera button */}
                <button 
                  onClick={closeCamera}
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                
                {/* Capture button */}
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white rounded-full border-3 sm:border-4 border-gray-200 hover:border-gray-300 transition-all active:scale-95"
                  title="Capture photo"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-full mx-auto"></div>
                </button>
                
                {/* Switch camera button (optional) */}
                <button 
                  onClick={() => {
                    toast.info('Camera switch feature coming soon');
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors opacity-50"
                  disabled
                >
                  <FiCamera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Loading overlay */}
          {cameraLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                <p className="text-white font-medium text-sm sm:text-base">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DriverManagement;