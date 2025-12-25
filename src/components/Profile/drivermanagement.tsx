// // components/DriverManagement.tsx
// import React, { useState, useRef, useEffect } from 'react';
// import { FiChevronLeft, FiCamera, FiArrowRight, FiMapPin, FiMail, FiCalendar } from 'react-icons/fi';
// import { Link, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import { Input } from '@/components/ui/input';
// import { driverManagementAPI } from '@/services/drivermanagementapi';
// import { useAuth } from '@/contexts/AuthContext';

// interface OtpLog {
//   id?: number;
//   mobile?: string;
//   email?: string;
//   verified: boolean;
//   type: 'mobile' | 'email';
// }

// interface ValidationErrors {
//   firstName?: string;
//   lastName?: string;
//   email?: string;
//   mobile?: string;
//   license?: string;
//   aadhar?: string;
//   dateOfBirth?: string;
//   [key: string]: string | undefined;
// }

// const DriverManagement: React.FC = () => {
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
  
//   // ================= FORM STATE =================
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [gender, setGender] = useState('');
//   const [dob, setDob] = useState('');
//   const [mobile, setMobile] = useState('');
//   const [location, setLocation] = useState('');
//   const [license, setLicense] = useState('');
//   const [aadhar, setAadhar] = useState('');

//   // ================= VALIDATION ERRORS =================
//   const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

//   // ================= DATE PICKER STATE =================
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<string>('');

//   // ================= MOBILE OTP =================
//   const [showMobileOtp, setShowMobileOtp] = useState(false);
//   const [mobileOtp, setMobileOtp] = useState(['', '', '', '', '', '']);
//   const [isMobileVerified, setIsMobileVerified] = useState(false);
//   const [mobileOtpLog, setMobileOtpLog] = useState<OtpLog | null>(null);
//   const [isRequestingMobileOtp, setIsRequestingMobileOtp] = useState(false);
//   const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);

//   // ================= EMAIL OTP =================
//   const [showEmailOtp, setShowEmailOtp] = useState(false);
//   const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
//   const [isEmailVerified, setIsEmailVerified] = useState(false);
//   const [emailOtpLog, setEmailOtpLog] = useState<OtpLog | null>(null);
//   const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
//   const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

//   // ================= CAMERA =================
//   const [photo, setPhoto] = useState<string | null>(null);
//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [cameraLoading, setCameraLoading] = useState(false);
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);

//   // ================= FILE UPLOADS =================
//   const [dlFrontFile, setDlFrontFile] = useState<File | null>(null);
//   const [dlBackFile, setDlBackFile] = useState<File | null>(null);
//   const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);

//   const mobileOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

//   // ================= HELPER FUNCTIONS =================
//   const removeAllSpaces = (value: string): string => {
//     return value.replace(/\s+/g, '');
//   };

//   // ================= VALIDATION FUNCTIONS =================
//   const validateDrivingLicense = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return 'Driving license is required';
//     }
    
//     // Remove ALL whitespace before validation
//     const cleanedValue = removeAllSpaces(value).toUpperCase();
    
//     // Check length exactly 15 (without spaces)
//     if (cleanedValue.length !== 15) {
//       return 'Must be exactly 15 characters';
//     }
    
//     // Check format: first 2 letters, then 13 numbers
//     if (!/^[A-Z]{2}[0-9]{13}$/.test(cleanedValue)) {
//       return 'Format: First 2 letters, then 13 numbers (e.g., TN9912345678901)';
//     }
    
//     return null;
//   };

//   const validateVehicleNumber = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return null; // Not required, so return null if empty
//     }
    
//     // Remove ALL whitespace before validation
//     const cleanedValue = removeAllSpaces(value).toUpperCase();
    
//     // Check length (9 or 10 characters without spaces)
//     if (cleanedValue.length !== 9 && cleanedValue.length !== 10) {
//       return 'Must be 9 or 10 characters';
//     }
    
//     // Check format (without spaces)
//     if (!/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(cleanedValue)) {
//       if (cleanedValue.length === 10) {
//         return 'Format: XX99AB1234 (10 characters)';
//       } else if (cleanedValue.length === 9) {
//         return 'Format: XX99A1234 (9 characters)';
//       }
//     }
    
//     return null;
//   };

//   const validateAadhar = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return null; // Not required, so return null if empty
//     }
    
//     // Remove ALL whitespace before validation
//     const cleanedValue = removeAllSpaces(value);
    
//     // Check length exactly 12 (without spaces)
//     if (cleanedValue.length !== 12) {
//       return 'Must be exactly 12 digits';
//     }
    
//     // Check only digits (after removing spaces)
//     if (!/^[0-9]{12}$/.test(cleanedValue)) {
//       return 'Only numbers 0-9 are allowed';
//     }
    
//     return null;
//   };

//   const formatAadhar = (value: string): string => {
//     const cleaned = removeAllSpaces(value);
//     if (cleaned.length > 12) {
//       return cleaned.substring(0, 12);
//     }
    
//     if (cleaned.length === 0) return value;
    
//     // Format as groups of 4 digits
//     const chunks = [];
//     for (let i = 0; i < cleaned.length; i += 4) {
//       const end = i + 4 < cleaned.length ? i + 4 : cleaned.length;
//       chunks.push(cleaned.substring(i, end));
//     }
    
//     return chunks.join(' ');
//   };

//   const formatDrivingLicense = (value: string): string => {
//     const cleaned = removeAllSpaces(value).toUpperCase();
//     if (cleaned.length > 15) {
//       return cleaned.substring(0, 15);
//     }
    
//     if (cleaned.length === 0) return value;
    
//     // Format as XX99 9999 9999999
//     if (cleaned.length === 15) {
//       return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}`;
//     }
    
//     // For partial input, format what we have
//     const chunks = [];
//     for (let i = 0; i < cleaned.length; i += 4) {
//       const end = i + 4 < cleaned.length ? i + 4 : cleaned.length;
//       chunks.push(cleaned.substring(i, end));
//     }
    
//     return chunks.join(' ');
//   };

//   const formatVehicleNumber = (value: string): string => {
//     const cleaned = removeAllSpaces(value).toUpperCase();
    
//     if (cleaned.length > 10) {
//       return cleaned.substring(0, 10);
//     }
    
//     if (cleaned.length === 0) return value;
    
//     if (cleaned.length >= 10) {
//       // Format: TN01AB1234 → TN 01 AB 1234
//       return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6)}`;
//     } else if (cleaned.length >= 9) {
//       // Format: TN01A1234 → TN 01 A 1234
//       return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 5)} ${cleaned.substring(5)}`;
//     }
    
//     return value;
//   };

//   const getRawValue = (value: string): string => {
//     return removeAllSpaces(value);
//   };

//   const validateMobile = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return 'Mobile number is required';
//     }
    
//     const cleanedValue = removeAllSpaces(value);
    
//     if (!/^[0-9]{10}$/.test(cleanedValue)) {
//       return 'Enter valid 10-digit mobile number';
//     }
    
//     return null;
//   };

//   const validateEmail = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return null; // Not required
//     }
    
//     if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
//       return 'Enter valid email address';
//     }
    
//     return null;
//   };

//   const validateName = (value: string, fieldName: string): string | null => {
//     if (!value || value.trim() === '') {
//       return `${fieldName} is required`;
//     }
    
//     if (value.trim().length < 2) {
//       return `${fieldName} must be at least 2 characters`;
//     }
    
//     if (!/^[a-zA-Z\s]+$/.test(value)) {
//       return `${fieldName} can only contain letters and spaces`;
//     }
    
//     return null;
//   };

//   const validateDate = (value: string): string | null => {
//     if (!value || value.trim() === '') {
//       return 'Date of birth is required';
//     }
    
//     if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//       return 'Format: YYYY-MM-DD';
//     }
    
//     // Check if at least 18 years old
//     const birthDate = new Date(value);
//     const today = new Date();
//     const eighteenYearsAgo = new Date(
//       today.getFullYear() - 18,
//       today.getMonth(),
//       today.getDate()
//     );
    
//     if (birthDate > eighteenYearsAgo) {
//       return 'Driver must be at least 18 years old';
//     }
    
//     return null;
//   };

//   // ================= VALIDATION HANDLERS =================
//   const validateField = (fieldName: string, value: string): string | null => {
//     switch (fieldName) {
//       case 'firstName':
//         return validateName(value, 'First name');
//       case 'lastName':
//         return validateName(value, 'Last name');
//       case 'email':
//         return validateEmail(value);
//       case 'mobile':
//         return validateMobile(value);
//       case 'license':
//         return validateDrivingLicense(value);
//       case 'aadhar':
//         return validateAadhar(value);
//       case 'dateOfBirth':
//         return validateDate(value);
//       default:
//         return null;
//     }
//   };

//   const handleFieldChange = (fieldName: string, value: string) => {
//     // Update the state
//     switch (fieldName) {
//       case 'firstName':
//         setFirstName(value);
//         break;
//       case 'lastName':
//         setLastName(value);
//         break;
//       case 'email':
//         setEmail(value);
//         if (isEmailVerified) {
//           setIsEmailVerified(false);
//           setEmailOtpLog(null);
//         }
//         break;
//       case 'mobile':
//         if (/^\d*$/.test(value) && value.length <= 10) {
//           setMobile(value);
//           if (isMobileVerified) {
//             setIsMobileVerified(false);
//             setMobileOtpLog(null);
//           }
//         }
//         break;
//       case 'license':
//         // Auto-format license as user types
//         const formattedLicense = formatDrivingLicense(value);
//         setLicense(formattedLicense);
//         break;
//       case 'aadhar':
//         // Auto-format Aadhar as user types
//         if (/^\d*$/.test(removeAllSpaces(value))) {
//           const formattedAadhar = formatAadhar(value);
//           setAadhar(formattedAadhar);
//         }
//         break;
//       case 'dateOfBirth':
//         setDob(value);
//         break;
//       case 'location':
//         setLocation(value);
//         break;
//       case 'gender':
//         setGender(value);
//         break;
//     }

//     // Clear validation error for this field
//     if (validationErrors[fieldName]) {
//       setValidationErrors(prev => ({
//         ...prev,
//         [fieldName]: undefined
//       }));
//     }
//   };

//   const validateAllFields = (): boolean => {
//     const errors: ValidationErrors = {};
    
//     // Validate required fields
//     const firstNameError = validateName(firstName, 'First name');
//     if (firstNameError) errors.firstName = firstNameError;
    
//     const lastNameError = validateName(lastName, 'Last name');
//     if (lastNameError) errors.lastName = lastNameError;
    
//     const mobileError = validateMobile(mobile);
//     if (mobileError) errors.mobile = mobileError;
    
//     const licenseError = validateDrivingLicense(license);
//     if (licenseError) errors.license = licenseError;
    
//     const dateError = validateDate(dob);
//     if (dateError) errors.dateOfBirth = dateError;
    
//     // Validate optional fields
//     if (email) {
//       const emailError = validateEmail(email);
//       if (emailError) errors.email = emailError;
//     }
    
//     if (aadhar) {
//       const aadharError = validateAadhar(aadhar);
//       if (aadharError) errors.aadhar = aadharError;
//     }
    
//     setValidationErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // ================= DATE PICKER FUNCTIONS =================
//   const calculateMaxDate = (): string => {
//     const now = new Date();
//     const eighteenYearsAgo = new Date(
//       now.getFullYear() - 18,
//       now.getMonth(),
//       now.getDate()
//     );
//     return eighteenYearsAgo.toISOString().split('T')[0];
//   };

//   const calculateMinDate = (): string => {
//     const now = new Date();
//     const hundredYearsAgo = new Date(
//       now.getFullYear() - 100,
//       now.getMonth(),
//       now.getDate()
//     );
//     return hundredYearsAgo.toISOString().split('T')[0];
//   };

//   const selectDate = () => {
//     setShowDatePicker(true);
//   };

//   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selected = e.target.value;
    
//     // Check if selected date is valid (at least 18 years old)
//     const selectedDateObj = new Date(selected);
//     const now = new Date();
//     const eighteenYearsAgo = new Date(
//       now.getFullYear() - 18,
//       now.getMonth(),
//       now.getDate()
//     );
    
//     if (selectedDateObj > eighteenYearsAgo) {
//       toast.error('Driver must be at least 18 years old');
//       return;
//     }
    
//     setDob(selected);
//     setSelectedDate(selected);
//     setShowDatePicker(false);
    
//     // Format date for display
//     const formattedDate = formatDateForDisplay(selected);
//     toast.success(`Date of birth set to: ${formattedDate}`);
//   };

//   const formatDateForDisplay = (dateString: string): string => {
//     if (!dateString) return '';
    
//     const date = new Date(dateString);
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
    
//     return `${day}/${month}/${year}`;
//   };

//   const calculateAge = (birthDate: string): number => {
//     if (!birthDate) return 0;
    
//     const birth = new Date(birthDate);
//     const today = new Date();
    
//     let age = today.getFullYear() - birth.getFullYear();
//     const monthDiff = today.getMonth() - birth.getMonth();
    
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
//       age--;
//     }
    
//     return age;
//   };

//   // Check authentication on component mount
//   useEffect(() => {
//     const checkAuth = () => {
//       const authToken = localStorage.getItem('authToken');
//       const userData = localStorage.getItem('userData');
      
//       console.log('Auth check in DriverManagement:');
//       console.log('authToken exists:', !!authToken);
//       console.log('userData exists:', !!userData);
//       console.log('isAuthenticated from context:', isAuthenticated);
//       console.log('User from context:', user);
      
//       if (!isAuthenticated || !authToken) {
//         toast.error('Please login as a partner first');
//         navigate('/login');
//       }
//     };
    
//     checkAuth();
//   }, [isAuthenticated, navigate, user]);

//   // ================= MOBILE OTP HANDLERS =================
//   const sendMobileOtp = async () => {
//     const mobileError = validateMobile(mobile);
//     if (mobileError) {
//       setValidationErrors(prev => ({ ...prev, mobile: mobileError }));
//       toast.error(mobileError);
//       return;
//     }

//     setIsRequestingMobileOtp(true);
//     try {
//       const result = await driverManagementAPI.requestOtp(mobile, 'register');
      
//       if (result.success) {
//         setShowMobileOtp(true);
//         toast.success('OTP sent successfully to ' + mobile);
//       } else {
//         toast.error(result.error || 'Failed to send OTP');
//       }
//     } catch (error) {
//       toast.error('Error sending OTP');
//     } finally {
//       setIsRequestingMobileOtp(false);
//     }
//   };

//   const verifyMobileOtp = async () => {
//     const otpCode = mobileOtp.join('');
//     if (otpCode.length !== 6) {
//       toast.error('Please enter all 6 digits');
//       return;
//     }

//     setIsVerifyingMobileOtp(true);
//     try {
//       console.log('Starting OTP verification for mobile:', mobile);
//       console.log('OTP code:', otpCode);
      
//       const result = await driverManagementAPI.verifyMobileOtp(
//         mobile, 
//         otpCode, 
//         'register'
//       );
      
//       console.log('OTP Verification Result:', result);
      
//       if (result.success && result.data) {
//         setIsMobileVerified(true);
//         setShowMobileOtp(false);
//         setMobileOtpLog({
//           id: result.data.otp_log_id,
//           mobile: mobile,
//           verified: true,
//           type: 'mobile'
//         });
//         toast.success('Mobile number verified successfully');
        
//         console.log('OTP Log ID received:', result.data.otp_log_id);
//         console.log('Mobile OTP Log set:', {
//           id: result.data.otp_log_id,
//           mobile: mobile,
//           verified: true,
//           type: 'mobile'
//         });
//       } else {
//         console.error('OTP verification failed:', result);
//         toast.error(result.error || result.message || 'Invalid OTP. Please try again.');
//       }
//     } catch (error: any) {
//       console.error('Error in verifyMobileOtp:', error);
//       console.error('Error details:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
      
//       if (error.code === 'ERR_NETWORK') {
//         toast.error('Network error. Please check your internet connection.');
//       } else if (error.response?.data?.message) {
//         toast.error(error.response.data.message);
//       } else {
//         toast.error('Error verifying OTP. Please try again.');
//       }
//     } finally {
//       setIsVerifyingMobileOtp(false);
//     }
//   };

//   // ================= EMAIL OTP HANDLERS =================
//   const sendEmailOtp = async () => {
//     if (!email) {
//       toast.error('Email address is required');
//       return;
//     }
    
//     const emailError = validateEmail(email);
//     if (emailError) {
//       setValidationErrors(prev => ({ ...prev, email: emailError }));
//       toast.error(emailError);
//       return;
//     }

//     setIsRequestingEmailOtp(true);
//     try {
//       const result = await driverManagementAPI.requestEmailOtp(email, 'register');
      
//       if (result.success) {
//         setShowEmailOtp(true);
//         toast.success('OTP sent successfully to ' + email);
//       } else {
//         toast.error(result.error || 'Failed to send OTP');
//       }
//     } catch (error) {
//       toast.error('Error sending OTP');
//     } finally {
//       setIsRequestingEmailOtp(false);
//     }
//   };

//   const verifyEmailOtp = async () => {
//     const otpCode = emailOtp.join('');
//     if (otpCode.length !== 6) {
//       toast.error('Please enter all 6 digits');
//       return;
//     }

//     setIsVerifyingEmailOtp(true);
//     try {
//       const result = await driverManagementAPI.verifyEmailOtp(
//         email, 
//         otpCode, 
//         'register'
//       );
      
//       if (result.success && result.data) {
//         setIsEmailVerified(true);
//         setShowEmailOtp(false);
//         setEmailOtpLog({
//           id: result.data.otp_log_id,
//           email: email,
//           verified: true,
//           type: 'email'
//         });
//         toast.success('Email verified successfully');
//       } else {
//         toast.error(result.error || 'Invalid OTP');
//       }
//     } catch (error) {
//       toast.error('Error verifying OTP');
//     } finally {
//       setIsVerifyingEmailOtp(false);
//     }
//   };

//   // ================= OTP INPUT HANDLERS =================
//   const handleMobileOtpChange = (i: number, v: string) => {
//     if (!/^\d?$/.test(v)) return;
//     const newOtp = [...mobileOtp];
//     newOtp[i] = v;
//     setMobileOtp(newOtp);
//     if (v && i < 5) mobileOtpRefs.current[i + 1]?.focus();
//   };

//   const handleEmailOtpChange = (i: number, v: string) => {
//     if (!/^\d?$/.test(v)) return;
//     const newOtp = [...emailOtp];
//     newOtp[i] = v;
//     setEmailOtp(newOtp);
//     if (v && i < 5) emailOtpRefs.current[i + 1]?.focus();
//   };

//   // ================= CAMERA HANDLERS =================
//   const openCamera = async () => {
//     try {
//       setCameraLoading(true);
      
//       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         toast.error('Camera not supported on this device/browser');
//         setCameraLoading(false);
//         return;
//       }
      
//       // Request camera permission
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         video: { 
//           facingMode: 'environment',
//           width: { ideal: 640 },
//           height: { ideal: 480 }
//         }
//       });
      
//       streamRef.current = stream;
//       setCameraOpen(true);
      
//       // Give time for video element to mount
//       setTimeout(() => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current.play().catch(err => {
//             console.error('Error playing video:', err);
//             toast.error('Failed to start camera preview');
//             closeCamera();
//           });
//         }
//       }, 100);
      
//       toast.success('Camera started');
//     } catch (error: any) {
//       console.error('Error opening camera:', error);
      
//       if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
//         toast.error('Camera permission denied. Please allow camera access in browser settings.');
//       } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
//         toast.error('No camera found on this device.');
//       } else {
//         toast.error('Unable to access camera. Please try again.');
//       }
//     } finally {
//       setCameraLoading(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (!videoRef.current || !canvasRef.current) {
//       toast.error('Camera not ready');
//       return;
//     }
    
//     try {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
      
//       if (!ctx) {
//         toast.error('Failed to capture photo');
//         return;
//       }
      
//       // Set canvas dimensions to match video
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
      
//       // Draw current video frame to canvas
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       // Convert to data URL and set as photo
//       const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
//       setPhoto(photoDataUrl);
      
//       toast.success('Photo captured successfully');
//     } catch (error) {
//       console.error('Error capturing photo:', error);
//       toast.error('Failed to capture photo');
//     } finally {
//       closeCamera();
//     }
//   };

//   const closeCamera = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => {
//         track.stop();
//       });
//       streamRef.current = null;
//     }
//     setCameraOpen(false);
//   };

//   // Clean up camera stream on unmount
//   useEffect(() => {
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => {
//           track.stop();
//         });
//       }
//     };
//   }, []);

//   // ================= FILE UPLOAD HANDLERS =================
//   const handleDlFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       // Check file size (max 2MB)
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error('File size must be less than 2MB');
//         return;
//       }
//       setDlFrontFile(file);
//       toast.success('Driving License Front uploaded');
//     }
//   };

//   const handleDlBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       // Check file size (max 2MB)
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error('File size must be less than 2MB');
//         return;
//       }
//       setDlBackFile(file);
//       toast.success('Driving License Back uploaded');
//     }
//   };

//   const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       // Check file size (max 2MB)
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error('File size must be less than 2MB');
//         return;
//       }
//       setAadhaarFrontFile(file);
//       toast.success('Aadhaar Front uploaded');
//     }
//   };

//   // ================= SAVE DRIVER =================
//   const saveDriver = async () => {
//     // Check authentication first
//     const authToken = localStorage.getItem('authToken');
//     if (!authToken) {
//       toast.error('Please login as a partner first');
//       navigate('/login');
//       return;
//     }

//     // Validate all fields
//     if (!validateAllFields()) {
//       toast.error('Please fix validation errors');
//       return;
//     }
    
//     if (!isMobileVerified || !mobileOtpLog?.id) {
//       toast.error('Please verify mobile number first');
//       return;
//     }
    
//     // Check age requirement
//     const age = calculateAge(dob);
//     if (age < 18) {
//       toast.error('Driver must be at least 18 years old');
//       return;
//     }
    
//     if (!dlFrontFile) {
//       toast.error('Driving License Front image is required');
//       return;
//     }

//     // Check if email is provided but not verified
//     if (email.trim() && !isEmailVerified) {
//       toast.error('Please verify email address or remove it');
//       return;
//     }

//     // Check if aadhaar is provided but no front image
//     if (aadhar.trim() && !aadhaarFrontFile) {
//       toast.error('Aadhaar Front image is required when Aadhaar number is provided');
//       return;
//     }

//     // Check profile image size
//     if (photo) {
//       try {
//         // Convert photo to blob to check size
//         const blob = await fetch(photo).then(r => r.blob());
//         if (blob.size > 2 * 1024 * 1024) {
//           toast.error('Profile image must be less than 2MB');
//           return;
//         }
//       } catch (error) {
//         console.error('Error checking photo size:', error);
//         toast.error('Error processing profile photo');
//         return;
//       }
//     }

//     // Convert photo to File if exists
//     let profileImageFile: File | null = null;
//     if (photo) {
//       try {
//         profileImageFile = driverManagementAPI.dataUrlToFile(photo, 'profile.jpg');
//         if (!profileImageFile) {
//           toast.error('Error processing profile photo');
//           return;
//         }
//       } catch (error) {
//         console.error('Error converting photo to file:', error);
//         toast.error('Error processing profile photo');
//         return;
//       }
//     }

//     // Prepare form data - using raw values (without spaces)
//     const formData: any = {
//       first_name: firstName.trim(),
//       last_name: lastName.trim(),
//       mobile_number: getRawValue(mobile),
//       mobile_otp_log_id: mobileOtpLog.id,
//       date_of_birth: dob,
//       driving_licence_number: getRawValue(license),
//       driving_licence_front: dlFrontFile,
//     };

//     // Add profile image if exists
//     if (profileImageFile) {
//       formData.profile_image = profileImageFile;
//     }

//     // Add optional fields
//     if (email.trim() && emailOtpLog?.id) {
//       formData.email_address = email.trim();
//       formData.email_otp_log_id = emailOtpLog.id;
//     }
    
//     if (gender) {
//       formData.gender = gender;
//     }
    
//     if (location.trim()) {
//       formData.location = location.trim();
//     }
    
//     if (dlBackFile) {
//       formData.driving_licence_back = dlBackFile;
//     }
    
//     if (aadhar.trim() && aadhaarFrontFile) {
//       formData.aadhaar_number = getRawValue(aadhar);
//       formData.aadhaar_front = aadhaarFrontFile;
//     }

//     try {
//       console.log('Saving driver with form data:', {
//         firstName,
//         lastName,
//         mobile: getRawValue(mobile),
//         mobileOtpLogId: mobileOtpLog.id,
//         license: getRawValue(license),
//         dateOfBirth: dob,
//         age,
//         hasProfileImage: !!profileImageFile,
//         hasDLFront: !!dlFrontFile,
//         authToken: authToken ? 'Exists' : 'Missing'
//       });
      
//       const result = await driverManagementAPI.createDriver(formData);
      
//       if (result.success) {
//         toast.success('Driver added successfully!');
//         resetForm();
//         navigate('/drivers');
//       } else {
//         toast.error(result.error || 'Failed to add driver');
//       }
//     } catch (error) {
//       console.error('Error in saveDriver:', error);
//       toast.error('Error saving driver. Please check your connection and try again.');
//     }
//   };

//   const resetForm = () => {
//     setFirstName('');
//     setLastName('');
//     setEmail('');
//     setGender('');
//     setDob('');
//     setMobile('');
//     setLocation('');
//     setLicense('');
//     setAadhar('');
//     setPhoto(null);
//     setMobileOtp(['', '', '', '', '', '']);
//     setEmailOtp(['', '', '', '', '', '']);
//     setIsMobileVerified(false);
//     setIsEmailVerified(false);
//     setMobileOtpLog(null);
//     setEmailOtpLog(null);
//     setShowMobileOtp(false);
//     setShowEmailOtp(false);
//     setDlFrontFile(null);
//     setDlBackFile(null);
//     setAadhaarFrontFile(null);
//     setSelectedDate('');
//     setShowDatePicker(false);
//     setValidationErrors({});
//   };

//   // ================= RESEND OTP HANDLERS =================
//   const resendMobileOtp = async () => {
//     if (isRequestingMobileOtp) return;
//     await sendMobileOtp();
//   };

//   const resendEmailOtp = async () => {
//     if (isRequestingEmailOtp) return;
//     await sendEmailOtp();
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* HEADER */}
//       <div className="flex items-center border-b px-4 py-4">
//         <Link to="/drivers">
//           <FiChevronLeft size={22} className="text-gray-600" />
//         </Link>
//         <h1 className="flex-1 text-center text-lg font-semibold">Add Driver</h1>
//       </div>

//       <div className="max-w-6xl mx-auto px-4 py-6">
//         {/* AUTH STATUS INFO */}
//         {user && (
//           <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
//             Logged in as: {user.first_name} {user.last_name} ({user.role})
//           </div>
//         )}

//         {/* PROFILE PHOTO */}
//         <div className="flex justify-center mb-8">
//           <div className="relative">
//             <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
//               {photo ? (
//                 <img 
//                   src={photo} 
//                   className="w-full h-full object-cover" 
//                   alt="Driver" 
//                   onError={(e) => {
//                     console.error('Error loading photo');
//                     (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="%239CA3AF" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
//                   }}
//                 />
//               ) : (
//                 <span className="text-4xl text-gray-400">👤</span>
//               )}
//             </div>
//             <button
//               onClick={openCamera}
//               disabled={cameraLoading}
//               className="absolute bottom-0 right-0 w-8 h-8 bg-[#21409A] rounded-full flex items-center justify-center hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {cameraLoading ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//               ) : (
//                 <FiCamera className="text-white" size={14} />
//               )}
//             </button>
//           </div>
//         </div>

//         {/* FORM GRID - 3 COLUMNS */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//           {/* ROW 1 */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">First Name *</label>
//             <Input 
//               placeholder="Enter first name" 
//               value={firstName} 
//               onChange={e => handleFieldChange('firstName', e.target.value)}
//               className="h-11"
//             />
//             {validationErrors.firstName && (
//               <p className="text-xs text-red-500">{validationErrors.firstName}</p>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Last Name *</label>
//             <Input 
//               placeholder="Enter last name" 
//               value={lastName} 
//               onChange={e => handleFieldChange('lastName', e.target.value)}
//               className="h-11"
//             />
//             {validationErrors.lastName && (
//               <p className="text-xs text-red-500">{validationErrors.lastName}</p>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Email (optional)</label>
//             <div className="flex gap-2">
//               <Input 
//                 type="email"
//                 placeholder="Enter email address" 
//                 value={email} 
//                 onChange={e => handleFieldChange('email', e.target.value)}
//                 disabled={isEmailVerified}
//                 className="h-11 flex-1"
//               />
//               {email && !isEmailVerified && (
//                 <button 
//                   onClick={sendEmailOtp}
//                   disabled={isRequestingEmailOtp || !email.includes('@')}
//                   className="px-4 h-11 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isRequestingEmailOtp ? 'Sending...' : 'Verify'}
//                 </button>
//               )}
//               {isEmailVerified && (
//                 <div className="flex items-center justify-center px-4 h-11 bg-green-100 text-green-700 rounded-lg font-medium">
//                   ✓ Verified
//                 </div>
//               )}
//             </div>
//             {validationErrors.email && (
//               <p className="text-xs text-red-500">{validationErrors.email}</p>
//             )}
//           </div>

//           {/* ROW 2 */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Gender</label>
//             <select
//               value={gender}
//               onChange={(e) => handleFieldChange('gender', e.target.value)}
//               className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
//             >
//               <option value="">Select</option>
//               <option value="male">Male</option>
//               <option value="female">Female</option>
//               <option value="other">Other</option>
//             </select>
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Date of Birth *</label>
//             <div className="relative">
//               <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />
//               <Input 
//                 type="date"
//                 placeholder="Select date of birth"
//                 value={dob}
//                 onChange={e => {
//                   handleDateChange(e);
//                   handleFieldChange('dateOfBirth', e.target.value);
//                 }}
//                 max={calculateMaxDate()}
//                 min={calculateMinDate()}
//                 className="pl-9 h-11"
//                 onFocus={() => setShowDatePicker(true)}
//               />
//               {dob && (
//                 <div className="mt-1 text-xs text-gray-500">
//                   Age: {calculateAge(dob)} years
//                   {calculateAge(dob) < 18 && (
//                     <span className="text-red-500 ml-1">(Must be 18+)</span>
//                   )}
//                 </div>
//               )}
//             </div>
//             {validationErrors.dateOfBirth && (
//               <p className="text-xs text-red-500">{validationErrors.dateOfBirth}</p>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Current Location</label>
//             <div className="relative">
//               <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
//               <Input 
//                 className="pl-9 h-11" 
//                 placeholder="Enter city or area" 
//                 value={location} 
//                 onChange={e => handleFieldChange('location', e.target.value)}
//               />
//             </div>
//           </div>

//           {/* ROW 3 */}
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Mobile Number *</label>
//             <div className="flex gap-2">
//               <Input
//                 placeholder="Enter mobile number"
//                 value={mobile}
//                 onChange={e => handleFieldChange('mobile', e.target.value)}
//                 disabled={isMobileVerified}
//                 className="h-11 flex-1"
//               />
//               {!isMobileVerified ? (
//                 <button 
//                   onClick={sendMobileOtp}
//                   disabled={isRequestingMobileOtp || mobile.length !== 10}
//                   className="px-4 h-11 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isRequestingMobileOtp ? 'Sending...' : 'Verify'}
//                 </button>
//               ) : (
//                 <div className="flex items-center justify-center px-4 h-11 bg-green-100 text-green-700 rounded-lg font-medium">
//                   ✓ Verified
//                 </div>
//               )}
//             </div>
//             {validationErrors.mobile && (
//               <p className="text-xs text-red-500">{validationErrors.mobile}</p>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Driving License Number *</label>
//             <Input 
//               placeholder="XX99 9999 9999999" 
//               value={license} 
//               onChange={e => handleFieldChange('license', e.target.value)}
//               className="h-11"
//             />
//             <div className="text-xs text-gray-500">
//               Format: First 2 letters, then 13 numbers (15 total)
//             </div>
//             {validationErrors.license && (
//               <p className="text-xs text-red-500">{validationErrors.license}</p>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-medium text-gray-700">Aadhar Number (optional)</label>
//             <Input 
//               placeholder="1234 5678 9012" 
//               value={aadhar} 
//               onChange={e => handleFieldChange('aadhar', e.target.value)}
//               className="h-11"
//             />
//             <div className="text-xs text-gray-500">
//               12 digits only, spaces auto-added
//             </div>
//             {validationErrors.aadhar && (
//               <p className="text-xs text-red-500">{validationErrors.aadhar}</p>
//             )}
//           </div>
//         </div>

//         {/* FILE UPLOADS SECTION */}
//         <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
//           <h3 className="text-sm font-medium text-gray-700 mb-4">Document Uploads</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-700">Driving License Front *</label>
//               <Input 
//                 type="file"
//                 accept="image/*"
//                 onChange={handleDlFrontChange}
//                 className="h-11"
//               />
//               {dlFrontFile && (
//                 <p className="text-xs text-green-600">✓ {dlFrontFile.name}</p>
//               )}
//               <p className="text-xs text-gray-500">Max size: 2MB</p>
//             </div>
            
//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-700">Driving License Back</label>
//               <Input 
//                 type="file"
//                 accept="image/*"
//                 onChange={handleDlBackChange}
//                 className="h-11"
//               />
//               {dlBackFile && (
//                 <p className="text-xs text-green-600">✓ {dlBackFile.name}</p>
//               )}
//               <p className="text-xs text-gray-500">Max size: 2MB</p>
//             </div>
            
//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-700">Aadhaar Front</label>
//               <Input 
//                 type="file"
//                 accept="image/*"
//                 onChange={handleAadhaarFrontChange}
//                 disabled={!aadhar.trim()}
//                 className="h-11"
//               />
//               {aadhaarFrontFile && (
//                 <p className="text-xs text-green-600">✓ {aadhaarFrontFile.name}</p>
//               )}
//               {aadhar.trim() && !aadhaarFrontFile && (
//                 <p className="text-xs text-amber-600">Required since Aadhaar number is provided</p>
//               )}
//               <p className="text-xs text-gray-500">Max size: 2MB</p>
//             </div>
//           </div>
//         </div>

//         {/* MOBILE OTP SECTION */}
//         {showMobileOtp && !isMobileVerified && (
//           <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
//             <h3 className="text-sm font-medium text-gray-700 mb-4">
//               Enter OTP sent to {mobile}
//             </h3>
//             <div className="flex items-center gap-4">
//               <div className="flex gap-3 flex-1">
//                 {mobileOtp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={el => {
//                       if (el) mobileOtpRefs.current[index] = el;
//                     }}
//                     value={digit}
//                     onChange={e => handleMobileOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Backspace' && !digit && index > 0) {
//                         mobileOtpRefs.current[index - 1]?.focus();
//                       }
//                     }}
//                     className="w-14 h-14 border border-gray-300 rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
//                     maxLength={1}
//                     type="text"
//                     inputMode="numeric"
//                     pattern="[0-9]*"
//                     disabled={isVerifyingMobileOtp}
//                   />
//                 ))}
//               </div>
              
//               <button
//                 onClick={verifyMobileOtp}
//                 disabled={isVerifyingMobileOtp || mobileOtp.join('').length !== 6}
//                 className="w-14 h-14 rounded-full bg-[#21409A] flex items-center justify-center hover:bg-[#1a357d] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isVerifyingMobileOtp ? (
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                 ) : (
//                   <FiArrowRight className="text-white" size={24} />
//                 )}
//               </button>
//             </div>
            
//             <div className="mt-4 text-center">
//               <button 
//                 onClick={resendMobileOtp}
//                 disabled={isRequestingMobileOtp}
//                 className="text-sm text-[#21409A] font-medium hover:underline disabled:opacity-50"
//               >
//                 {isRequestingMobileOtp ? 'Resending...' : 'Resend OTP'}
//               </button>
//             </div>
//           </div>
//         )}

//         {/* EMAIL OTP SECTION */}
//         {showEmailOtp && !isEmailVerified && (
//           <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
//             <h3 className="text-sm font-medium text-gray-700 mb-4">
//               Enter OTP sent to {email}
//             </h3>
//             <div className="flex items-center gap-4">
//               <div className="flex gap-3 flex-1">
//                 {emailOtp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={el => {
//                       if (el) emailOtpRefs.current[index] = el;
//                     }}
//                     value={digit}
//                     onChange={e => handleEmailOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Backspace' && !digit && index > 0) {
//                         emailOtpRefs.current[index - 1]?.focus();
//                       }
//                     }}
//                     className="w-14 h-14 border border-gray-300 rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
//                     maxLength={1}
//                     type="text"
//                     inputMode="numeric"
//                     pattern="[0-9]*"
//                     disabled={isVerifyingEmailOtp}
//                   />
//                 ))}
//               </div>
              
//               <button
//                 onClick={verifyEmailOtp}
//                 disabled={isVerifyingEmailOtp || emailOtp.join('').length !== 6}
//                 className="w-14 h-14 rounded-full bg-[#21409A] flex items-center justify-center hover:bg-[#1a357d] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isVerifyingEmailOtp ? (
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                 ) : (
//                   <FiArrowRight className="text-white" size={24} />
//                 )}
//               </button>
//             </div>
            
//             <div className="mt-4 text-center">
//               <button 
//                 onClick={resendEmailOtp}
//                 disabled={isRequestingEmailOtp}
//                 className="text-sm text-[#21409A] font-medium hover:underline disabled:opacity-50"
//               >
//                 {isRequestingEmailOtp ? 'Resending...' : 'Resend OTP'}
//               </button>
//             </div>
//           </div>
//         )}

//         {/* BOTTOM ACTIONS */}
//         <div className="flex items-center justify-end mt-8 pt-6 border-t">
//           <button
//             onClick={saveDriver}
//             disabled={!isMobileVerified || !dlFrontFile || !dob}
//             className="px-8 py-3 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Save Driver
//           </button>
//         </div>
//       </div>

//       {/* DATE PICKER MODAL */}
//       {showDatePicker && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-6 rounded-xl max-w-md w-full">
//             <h3 className="text-lg font-semibold mb-4">Select Date of Birth</h3>
//             <p className="text-sm text-gray-600 mb-4">Driver must be at least 18 years old</p>
//             <input
//               type="date"
//               value={dob}
//               onChange={handleDateChange}
//               max={calculateMaxDate()}
//               min={calculateMinDate()}
//               className="w-full p-3 border border-gray-300 rounded-lg mb-4"
//               autoFocus
//             />
//             <div className="flex gap-4 justify-center">
//               <button 
//                 onClick={() => setShowDatePicker(false)}
//                 className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={() => {
//                   if (dob) {
//                     setShowDatePicker(false);
//                   } else {
//                     toast.error('Please select a date');
//                   }
//                 }}
//                 className="px-6 py-2.5 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* CAMERA MODAL */}
//       {cameraOpen && (
//         <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
//           <div className="relative w-full h-full flex flex-col">
//             {/* Close button at top */}
//             <button 
//               onClick={closeCamera}
//               className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
//             >
//               <FiChevronLeft size={24} className="text-white" />
//             </button>
            
//             {/* Video preview */}
//             <div className="flex-1 relative">
//               <video 
//                 ref={videoRef} 
//                 className="w-full h-full object-cover"
//                 autoPlay
//                 playsInline
//                 muted
//               />
              
//               {/* Capture area overlay */}
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <div className="w-64 h-64 border-2 border-white rounded-full opacity-50"></div>
//               </div>
              
//               {/* Capture button at bottom */}
//               <div className="absolute bottom-8 left-0 right-0 flex justify-center">
//                 <button 
//                   onClick={capturePhoto}
//                   className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
//                 >
//                   <div className="w-12 h-12 bg-white rounded-full"></div>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <canvas ref={canvasRef} className="hidden" />
//     </div>
//   );
// };

// export default DriverManagement;


// components/DriverManagement.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiCamera, FiArrowRight, FiMapPin, FiMail, FiCalendar } from 'react-icons/fi';
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
  aadhar?: string;
  dateOfBirth?: string;
  profileImage?: string;
  gender?: string;
  location?: string;
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
  const [location, setLocation] = useState('');
  const [license, setLicense] = useState('');
  const [aadhar, setAadhar] = useState('');

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

  // ================= EMAIL OTP =================
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtpLog, setEmailOtpLog] = useState<OtpLog | null>(null);
  const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

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
    
    // Remove ALL whitespace before validation
    const cleanedValue = removeAllSpaces(value).toUpperCase();
    
    // Check length exactly 15 (without spaces)
    if (cleanedValue.length !== 15) {
      return 'Must be exactly 15 characters';
    }
    
    // Check format: first 2 letters, then 13 numbers
    if (!/^[A-Z]{2}[0-9]{13}$/.test(cleanedValue)) {
      return 'Format: First 2 letters, then 13 numbers (e.g., TN9912345678901)';
    }
    
    return null;
  };

  const validateAadhar = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return null; // Not required, so return null if empty
    }
    
    // Remove ALL whitespace before validation
    const cleanedValue = removeAllSpaces(value);
    
    // Check length exactly 12 (without spaces)
    if (cleanedValue.length !== 12) {
      return 'Must be exactly 12 digits';
    }
    
    // Check only digits (after removing spaces)
    if (!/^[0-9]{12}$/.test(cleanedValue)) {
      return 'Only numbers 0-9 are allowed';
    }
    
    return null;
  };

  const formatAadhar = (value: string): string => {
    const cleaned = removeAllSpaces(value);
    if (cleaned.length > 12) {
      return cleaned.substring(0, 12);
    }
    
    if (cleaned.length === 0) return value;
    
    // Format as groups of 4 digits
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      const end = i + 4 < cleaned.length ? i + 4 : cleaned.length;
      chunks.push(cleaned.substring(i, end));
    }
    
    return chunks.join(' ');
  };

  const formatDrivingLicense = (value: string): string => {
    const cleaned = removeAllSpaces(value).toUpperCase();
    if (cleaned.length > 15) {
      return cleaned.substring(0, 15);
    }
    
    if (cleaned.length === 0) return value;
    
    // Format as XX99 9999 9999999
    if (cleaned.length === 15) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}`;
    }
    
    // For partial input, format what we have
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
      return null; // Not required
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
    
    // Check if at least 18 years old
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

  const validateLocation = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Location is required';
    }
    
    if (value.trim().length < 2) {
      return 'Location must be at least 2 characters';
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
      case 'aadhar':
        return validateAadhar(value);
      case 'dateOfBirth':
        return validateDate(value);
      case 'profileImage':
        return validateProfileImage(photo);
      case 'gender':
        return validateGender(value);
      case 'location':
        return validateLocation(value);
      default:
        return null;
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    // Update the state
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
        }
        break;
      case 'mobile':
        if (/^\d*$/.test(value) && value.length <= 10) {
          setMobile(value);
          if (isMobileVerified) {
            setIsMobileVerified(false);
            setMobileOtpLog(null);
          }
        }
        break;
      case 'license':
        // Auto-format license as user types
        const formattedLicense = formatDrivingLicense(value);
        setLicense(formattedLicense);
        break;
      case 'aadhar':
        // Auto-format Aadhar as user types
        if (/^\d*$/.test(removeAllSpaces(value))) {
          const formattedAadhar = formatAadhar(value);
          setAadhar(formattedAadhar);
        }
        break;
      case 'dateOfBirth':
        setDob(value);
        break;
      case 'location':
        setLocation(value);
        break;
      case 'gender':
        setGender(value);
        break;
    }

    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate required fields
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
    
    // Validate profile image
    const profileImageError = validateProfileImage(photo);
    if (profileImageError) errors.profileImage = profileImageError;
    
    // Validate gender
    const genderError = validateGender(gender);
    if (genderError) errors.gender = genderError;
    
    // Validate location
    const locationError = validateLocation(location);
    if (locationError) errors.location = locationError;
    
    // Validate optional fields
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
    }
    
    if (aadhar) {
      const aadharError = validateAadhar(aadhar);
      if (aadharError) errors.aadhar = aadharError;
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
    
    // Check if selected date is valid (at least 18 years old)
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
    setShowDatePicker(false);
    
    // Format date for display
    const formattedDate = formatDateForDisplay(selected);
    toast.success(`Date of birth set to: ${formattedDate}`);
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
      
      console.log('Auth check in DriverManagement:');
      console.log('authToken exists:', !!authToken);
      console.log('userData exists:', !!userData);
      console.log('isAuthenticated from context:', isAuthenticated);
      console.log('User from context:', user);
      
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
        toast.success('OTP sent successfully to ' + mobile);
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
      console.log('Starting OTP verification for mobile:', mobile);
      console.log('OTP code:', otpCode);
      
      const result = await driverManagementAPI.verifyMobileOtp(
        mobile, 
        otpCode, 
        'register'
      );
      
      console.log('OTP Verification Result:', result);
      
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
        
        console.log('OTP Log ID received:', result.data.otp_log_id);
        console.log('Mobile OTP Log set:', {
          id: result.data.otp_log_id,
          mobile: mobile,
          verified: true,
          type: 'mobile'
        });
      } else {
        console.error('OTP verification failed:', result);
        toast.error(result.error || result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in verifyMobileOtp:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
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
        toast.success('OTP sent successfully to ' + email);
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
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device/browser');
        setCameraLoading(false);
        return;
      }
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      setCameraOpen(true);
      
      // Give time for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            toast.error('Failed to start camera preview');
            closeCamera();
          });
        }
      }, 100);
      
      toast.success('Camera started');
    } catch (error: any) {
      console.error('Error opening camera:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Unable to access camera. Please try again.');
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Failed to capture photo');
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL and set as photo
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(photoDataUrl);
      
      // Clear any profile image validation error
      if (validationErrors.profileImage) {
        setValidationErrors(prev => ({
          ...prev,
          profileImage: undefined
        }));
      }
      
      toast.success('Photo captured successfully');
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo');
    } finally {
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // ================= SAVE DRIVER =================
  const saveDriver = async () => {
    // Check authentication first
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Please login as a partner first');
      navigate('/login');
      return;
    }

    // Validate all fields (including profile image)
    const isValid = validateAllFields();
    if (!isValid) {
      // Show specific error messages
      const errorMessages = Object.values(validationErrors).filter(msg => msg);
      if (errorMessages.length > 0) {
        errorMessages.forEach(error => {
          toast.error(error);
        });
      } else {
        toast.error('Please fill all required fields correctly');
      }
      return;
    }
    
    if (!isMobileVerified || !mobileOtpLog?.id) {
      toast.error('Please verify mobile number first');
      return;
    }
    
    // Check age requirement
    const age = calculateAge(dob);
    if (age < 18) {
      toast.error('Driver must be at least 18 years old');
      return;
    }

    // Check if email is provided but not verified
    if (email.trim() && !isEmailVerified) {
      toast.error('Please verify email address or remove it');
      return;
    }

    // Check profile image size and convert to File
    let profileImageFile: File | null = null;
    if (photo) {
      try {
        // Convert photo to blob to check size
        const blob = await fetch(photo).then(r => r.blob());
        if (blob.size > 2 * 1024 * 1024) {
          toast.error('Profile image must be less than 2MB');
          return;
        }
        
        // Convert to File object
        profileImageFile = driverManagementAPI.dataUrlToFile(photo, 'profile.jpg');
        if (!profileImageFile) {
          toast.error('Error processing profile photo');
          return;
        }
      } catch (error) {
        console.error('Error checking photo size:', error);
        toast.error('Error processing profile photo');
        return;
      }
    } else {
      toast.error('Profile image is required');
      return;
    }

    // Prepare form data - using raw values (without spaces)
    const formData: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile_number: getRawValue(mobile),
      mobile_otp_log_id: mobileOtpLog.id,
      date_of_birth: dob,
      driving_licence_number: getRawValue(license),
      gender: gender,
      location: location.trim(),
      // Add profile image (required)
      profile_image: profileImageFile,
    };

    // Add optional fields
    if (email.trim() && emailOtpLog?.id) {
      formData.email_address = email.trim();
      formData.email_otp_log_id = emailOtpLog.id;
    }
    
    if (aadhar.trim()) {
      formData.aadhaar_number = getRawValue(aadhar);
    }

    try {
      console.log('Saving driver with form data:', {
        firstName,
        lastName,
        mobile: getRawValue(mobile),
        mobileOtpLogId: mobileOtpLog.id,
        license: getRawValue(license),
        dateOfBirth: dob,
        gender,
        location,
        age,
        hasProfileImage: !!profileImageFile,
        authToken: authToken ? 'Exists' : 'Missing'
      });
      
      const result = await driverManagementAPI.createDriver(formData);
      
      if (result.success) {
        toast.success('Driver added successfully!');
        resetForm();
        navigate('/drivers');
      } else {
        toast.error(result.error || 'Failed to add driver');
      }
    } catch (error: any) {
      console.error('Error in saveDriver:', error);
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
    setLocation('');
    setLicense('');
    setAadhar('');
    setPhoto(null);
    setMobileOtp(['', '', '', '', '', '']);
    setEmailOtp(['', '', '', '', '', '']);
    setIsMobileVerified(false);
    setIsEmailVerified(false);
    setMobileOtpLog(null);
    setEmailOtpLog(null);
    setShowMobileOtp(false);
    setShowEmailOtp(false);
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

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <div className="flex items-center border-b px-4 py-4">
        <Link to="/drivers">
          <FiChevronLeft size={22} className="text-gray-600" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold">Add Driver</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* AUTH STATUS INFO */}
        {user && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            Logged in as: {user.first_name} {user.last_name} ({user.role})
          </div>
        )}

        {/* PROFILE PHOTO - NOW REQUIRED */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
              {photo ? (
                <img 
                  src={photo} 
                  className="w-full h-full object-cover" 
                  alt="Driver" 
                  onError={(e) => {
                    console.error('Error loading photo');
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="%239CA3AF" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                  }}
                />
              ) : (
                <span className="text-4xl text-gray-400">👤</span>
              )}
            </div>
            <button
              onClick={openCamera}
              disabled={cameraLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#21409A] rounded-full flex items-center justify-center hover:bg-[#1a357d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cameraLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiCamera className="text-white" size={14} />
              )}
            </button>
          </div>
        </div>
        
        {/* PROFILE IMAGE VALIDATION ERROR */}
        {validationErrors.profileImage && (
          <div className="text-center mb-6">
            <p className="text-sm text-red-500">{validationErrors.profileImage}</p>
          </div>
        )}

        {/* FORM GRID - 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* ROW 1 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">First Name *</label>
            <Input 
              placeholder="Enter first name" 
              value={firstName} 
              onChange={e => handleFieldChange('firstName', e.target.value)}
              className="h-11"
            />
            {validationErrors.firstName && (
              <p className="text-xs text-red-500">{validationErrors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Last Name *</label>
            <Input 
              placeholder="Enter last name" 
              value={lastName} 
              onChange={e => handleFieldChange('lastName', e.target.value)}
              className="h-11"
            />
            {validationErrors.lastName && (
              <p className="text-xs text-red-500">{validationErrors.lastName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email </label>
            <div className="flex gap-2">
              <Input 
                type="email"
                placeholder="Enter email address" 
                value={email} 
                onChange={e => handleFieldChange('email', e.target.value)}
                disabled={isEmailVerified}
                className="h-11 flex-1"
              />
              {email && !isEmailVerified && (
                <button 
                  onClick={sendEmailOtp}
                  disabled={isRequestingEmailOtp || !email.includes('@')}
                  className="px-4 h-11 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingEmailOtp ? 'Sending...' : 'Verify'}
                </button>
              )}
              {isEmailVerified && (
                <div className="flex items-center justify-center px-4 h-11 bg-green-100 text-green-700 rounded-lg font-medium">
                  ✓ Verified
                </div>
              )}
            </div>
            {validationErrors.email && (
              <p className="text-xs text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* ROW 2 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gender *</label>
            <select
              value={gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date of Birth *</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />
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
                className="pl-9 h-11"
                onFocus={() => setShowDatePicker(true)}
              />
              {dob && (
                <div className="mt-1 text-xs text-gray-500">
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Location *</label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
              <Input 
                className="pl-9 h-11" 
                placeholder="Enter city or area" 
                value={location} 
                onChange={e => handleFieldChange('location', e.target.value)}
              />
            </div>
            {validationErrors.location && (
              <p className="text-xs text-red-500">{validationErrors.location}</p>
            )}
          </div>

          {/* ROW 3 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mobile Number *</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter mobile number"
                value={mobile}
                onChange={e => handleFieldChange('mobile', e.target.value)}
                disabled={isMobileVerified}
                className="h-11 flex-1"
              />
              {!isMobileVerified ? (
                <button 
                  onClick={sendMobileOtp}
                  disabled={isRequestingMobileOtp || mobile.length !== 10}
                  className="px-4 h-11 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingMobileOtp ? 'Sending...' : 'Verify'}
                </button>
              ) : (
                <div className="flex items-center justify-center px-4 h-11 bg-green-100 text-green-700 rounded-lg font-medium">
                  ✓ Verified
                </div>
              )}
            </div>
            {validationErrors.mobile && (
              <p className="text-xs text-red-500">{validationErrors.mobile}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Driving License Number *</label>
            <Input 
              placeholder="XX99 9999 9999999" 
              value={license} 
              onChange={e => handleFieldChange('license', e.target.value)}
              className="h-11"
            />
            <div className="text-xs text-gray-500">
              Format: First 2 letters, then 13 numbers (15 total)
            </div>
            {validationErrors.license && (
              <p className="text-xs text-red-500">{validationErrors.license}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aadhar Number </label>
            <Input 
              placeholder="1234 5678 9012" 
              value={aadhar} 
              onChange={e => handleFieldChange('aadhar', e.target.value)}
              className="h-11"
            />
            <div className="text-xs text-gray-500">
              12 digits only, spaces auto-added
            </div>
            {validationErrors.aadhar && (
              <p className="text-xs text-red-500">{validationErrors.aadhar}</p>
            )}
          </div>
        </div>

        {/* MOBILE OTP SECTION */}
        {showMobileOtp && !isMobileVerified && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Enter OTP sent to {mobile}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-3 flex-1">
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
                    className="w-14 h-14 border border-gray-300 rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={isVerifyingMobileOtp}
                  />
                ))}
              </div>
              
              <button
                onClick={verifyMobileOtp}
                disabled={isVerifyingMobileOtp || mobileOtp.join('').length !== 6}
                className="w-14 h-14 rounded-full bg-[#21409A] flex items-center justify-center hover:bg-[#1a357d] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingMobileOtp ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiArrowRight className="text-white" size={24} />
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={resendMobileOtp}
                disabled={isRequestingMobileOtp}
                className="text-sm text-[#21409A] font-medium hover:underline disabled:opacity-50"
              >
                {isRequestingMobileOtp ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* EMAIL OTP SECTION */}
        {showEmailOtp && !isEmailVerified && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Enter OTP sent to {email}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-3 flex-1">
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
                    className="w-14 h-14 border border-gray-300 rounded-lg text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#21409A] focus:border-transparent"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={isVerifyingEmailOtp}
                  />
                ))}
              </div>
              
              <button
                onClick={verifyEmailOtp}
                disabled={isVerifyingEmailOtp || emailOtp.join('').length !== 6}
                className="w-14 h-14 rounded-full bg-[#21409A] flex items-center justify-center hover:bg-[#1a357d] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingEmailOtp ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiArrowRight className="text-white" size={24} />
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={resendEmailOtp}
                disabled={isRequestingEmailOtp}
                className="text-sm text-[#21409A] font-medium hover:underline disabled:opacity-50"
              >
                {isRequestingEmailOtp ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM ACTIONS */}
        <div className="flex items-center justify-end mt-8 pt-6 border-t">
          <button
            onClick={saveDriver}
            className="px-8 py-3 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors"
          >
            Save Driver
          </button>
        </div>
      </div>

      {/* DATE PICKER MODAL */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Select Date of Birth</h3>
            <p className="text-sm text-gray-600 mb-4">Driver must be at least 18 years old</p>
            <input
              type="date"
              value={dob}
              onChange={handleDateChange}
              max={calculateMaxDate()}
              min={calculateMinDate()}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowDatePicker(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (dob) {
                    setShowDatePicker(false);
                  } else {
                    toast.error('Please select a date');
                  }
                }}
                className="px-6 py-2.5 bg-[#21409A] text-white rounded-lg font-medium hover:bg-[#1a357d] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA MODAL */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col">
            {/* Close button at top */}
            <button 
              onClick={closeCamera}
              className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FiChevronLeft size={24} className="text-white" />
            </button>
            
            {/* Video preview */}
            <div className="flex-1 relative">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Capture area overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-full opacity-50"></div>
              </div>
              
              {/* Capture button at bottom */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                >
                  <div className="w-12 h-12 bg-white rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DriverManagement;