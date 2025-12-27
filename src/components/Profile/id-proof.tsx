import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Shield, FileText, Check, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserDocuments, uploadDocuments, Document } from '@/services/documentApi';
import { useAuth } from '@/contexts/AuthContext';
// Import ProfileApiService
import ProfileApiService from '@/services/profileApi';
// Import the useProfile hook
import { useProfile } from '../../pages/Profile';

interface DocumentType {
  id: string;
  apiKey: 'aadhaar' | 'driving_license';
  icon: React.ReactNode;
  title: string;
  description: string;
  required: boolean;
}

const IDProof: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Use the central profile data
  const { profileData: centralProfileData } = useProfile();
  const [selectedDocument, setSelectedDocument] = useState<string>('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [publishRide, setPublishRide] = useState<boolean>(false);
  const [hasVerifiedAadhaar, setHasVerifiedAadhaar] = useState<boolean>(false);
  
  useEffect(() => {
    loadProfileAndDocuments();
  }, [user?.token, centralProfileData]);

  const loadProfileAndDocuments = useCallback(async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      
      // Use central profile data to check publishRide status
      if (centralProfileData) {
        console.log('Using central profile data:', centralProfileData);
        setPublishRide(centralProfileData.publishRide || false);
      } else {
        // Fallback to API call if central data not available
        const basicInfoResponse = await ProfileApiService.getBasicProfile();
        if (basicInfoResponse.success && basicInfoResponse.data) {
          setPublishRide(basicInfoResponse.data.publishRide || false);
        }
      }
      
      // Load existing documents
      const docs = await getUserDocuments(user.token);
      console.log('Loaded documents:', docs);
      setExistingDocuments(docs);
      
      // Check if user has verified Aadhaar
      const hasVerified = docs.some(doc => 
        doc.documentType === 'aadhaar' && doc.verificationStatus === 'verified'
      );
      setHasVerifiedAadhaar(hasVerified);
      
      // If user has verified Aadhaar, automatically select Driving License (if publishRide is true)
      if (hasVerified && publishRide) {
        setSelectedDocument('driving');
        const dlDoc = docs.find(doc => doc.documentType === 'driving_license');
        if (dlDoc) {
          setDocumentNumber(dlDoc.documentNumber);
        }
      }
      
    } catch (error: any) {
      console.error('Failed to load data:', error);
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.token, centralProfileData, logout, navigate, publishRide]);

  // Define document types based on publishRide value
  const getDocumentTypes = (): DocumentType[] => {
    const baseDocuments: DocumentType[] = [
      {
        id: 'aadhaar',
        apiKey: 'aadhaar',
        icon: <Shield size={18} className="text-primary" />,
        title: 'Aadhaar Card',
        description: 'UIDAI Verified',
        required: true, // Aadhaar is always required
      },
    ];

    // If publishRide is true, add Driving License
    if (publishRide) {
      baseDocuments.push({
        id: 'driving',
        apiKey: 'driving_license',
        icon: <FileText size={18} className="text-muted-foreground" />,
        title: 'Driving License',
        description: 'RTO Verified',
        required: true, // Required when publishRide is true
      });
    }

    return baseDocuments;
  };

  const documentTypes = getDocumentTypes();

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    const parts = limited.match(/.{1,4}/g);
    return parts ? parts.join(' ') : limited;
  };

  const formatDrivingLicense = (value: string) => {
    let cleaned = value.replace(/\s/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned.toUpperCase();
    }
    
    const firstTwo = cleaned.slice(0, 2).toUpperCase();
    const rest = cleaned.slice(2);
    const restCleaned = rest.replace(/[^A-Za-z0-9]/g, '').slice(0, 13);
    
    return firstTwo + restCleaned;
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (selectedDocument === 'aadhaar') {
      setDocumentNumber(formatAadhar(value));
    } else if (selectedDocument === 'driving') {
      setDocumentNumber(formatDrivingLicense(value));
    }
    
    if (serverError) setServerError(null);
  };

  const validateAadhaar = (value: string): boolean => {
    const cleanValue = value.replace(/\s/g, '');
    return /^\d{12}$/.test(cleanValue);
  };

  const validateDrivingLicense = (value: string): boolean => {
    const cleanValue = value.replace(/\s/g, '');
    
    if (cleanValue.length !== 15) {
      return false;
    }
    
    const firstTwo = cleanValue.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(firstTwo)) {
      return false;
    }
    
    const rest = cleanValue.slice(2);
    if (!/^[A-Z0-9]{13}$/.test(rest)) {
      return false;
    }
    
    return true;
  };

  const handleSaveAndContinue = async () => {
    if (!user?.token) {
      toast.error('Please login first');
      return;
    }

    if (!documentNumber) {
      toast.error('Please enter your document number');
      return;
    }

    const cleanNumber = documentNumber.replace(/\s/g, '');
    const selectedDoc = documentTypes.find(doc => doc.id === selectedDocument);
    
    if (!selectedDoc) {
      toast.error('Invalid document type');
      return;
    }

    // Validation with specific error messages
    if (selectedDocument === 'aadhaar') {
      if (!validateAadhaar(documentNumber)) {
        toast.error('Please enter a valid 12-digit Aadhaar number (digits only)');
        return;
      }
      
      // Check if Aadhaar is already verified
      if (hasVerifiedAadhaar) {
        toast.error('Your Aadhaar is already verified and cannot be changed');
        return;
      }
    } else if (selectedDocument === 'driving') {
      if (!validateDrivingLicense(documentNumber)) {
        toast.error('Please enter a valid driving license number (e.g., TN01AB655312345) - 2 letters followed by 13 alphanumeric characters');
        return;
      }
    }

    setIsUploading(true);
    setServerError(null);
    
    try {
      const uploadData: any = {};

      if (selectedDocument === 'aadhaar') {
        uploadData.aadhaarNumber = cleanNumber;
      } else if (selectedDocument === 'driving') {
        uploadData.drivingLicenceNumber = cleanNumber;
      }

      console.log('Attempting to upload document:', {
        type: selectedDoc.apiKey,
        number: cleanNumber,
        uploadData: uploadData,
      });
      
      const result = await uploadDocuments(user.token, uploadData);

      console.log('Upload result:', result);
      
      if (result.success) {
        toast.success(result.message || 'Document saved successfully!');
        
        // Refresh documents
        await loadProfileAndDocuments();
        
        // Navigate based on publishRide status and document type
        setTimeout(() => {
          if (selectedDocument === 'aadhaar' && publishRide) {
            // If user uploaded Aadhaar and publishRide is true, stay on page for DL upload
            setSelectedDocument('driving');
            setDocumentNumber('');
            toast.info('Now please enter your Driving License details');
          } else {
            // Otherwise navigate appropriately
            if (publishRide) {
              navigate('/vehicle-management'); // Go to Vehicle Management if publishRide is true
            } else {
              navigate('/profile'); // Go to Profile if publishRide is false
            }
          }
        }, 1500);
      } else {
        console.error('Upload failed with result:', result);
        toast.error(result.message || result.error || 'Failed to save document');
        setServerError(result.message || result.error || 'Server error occurred');
      }
    } catch (error: any) {
      console.error('Upload error in component:', error);
      const errorMessage = error.message || 'An error occurred. Please try again.';
      toast.error(errorMessage);
      setServerError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        return '1234 5678 9012';
      case 'driving':
        return 'TN01AB655312345';
      default:
        return '';
    }
  };

  const getLabel = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        return 'Aadhaar number';
      case 'driving':
        return 'Driving License number';
      default:
        return 'Document number';
    }
  };

  const getValidationMessage = () => {
    switch (selectedDocument) {
      case 'aadhaar':
        const aadhaarDigits = documentNumber.replace(/\s/g, '').length;
        return `Enter 12-digit Aadhaar number (${aadhaarDigits}/12 digits)`;
      case 'driving':
        const dlChars = documentNumber.replace(/\s/g, '').length;
        const firstTwo = documentNumber.replace(/\s/g, '').slice(0, 2);
        const isValidFirstTwo = /^[A-Z]{0,2}$/.test(firstTwo);
        
        let message = `Enter driving license number (${dlChars}/15 characters)`;
        
        if (dlChars >= 2 && !isValidFirstTwo) {
          message += ' - First 2 characters should be state code (e.g., TN, DL, MH)';
        } else if (dlChars > 2 && dlChars < 15) {
          const rest = documentNumber.replace(/\s/g, '').slice(2);
          const isValidRest = /^[A-Z0-9]*$/.test(rest);
          if (!isValidRest) {
            message += ' - Should contain only letters and numbers';
          }
        }
        
        return message;
      default:
        return '';
    }
  };

  const getExistingDocument = (docType: string) => {
    return existingDocuments.find(doc => doc.documentType === docType);
  };

  const isInputValid = () => {
    if (!documentNumber) return false;
    
    if (selectedDocument === 'aadhaar') {
      return validateAadhaar(documentNumber);
    } else if (selectedDocument === 'driving') {
      return validateDrivingLicense(documentNumber);
    }
    
    return false;
  };

  // Reset document number when switching between documents
  useEffect(() => {
    const existingDoc = getExistingDocument(
      selectedDocument === 'aadhaar' ? 'aadhaar' : 'driving_license'
    );
    
    if (existingDoc) {
      setDocumentNumber(existingDoc.documentNumber);
    } else {
      setDocumentNumber('');
    }
  }, [selectedDocument, existingDocuments]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
    

      {/* Content */}
      <main className="pt-20 pb-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
         
          <p className="text-center text-muted-foreground mb-8">
            {publishRide 
              ? hasVerifiedAadhaar 
                ? 'Your Aadhaar is already verified. Please submit your Driving License for verification.'
                : 'As a partner, you need to submit both Aadhaar and Driving License for verification.'
              : 'Please submit your Aadhaar Card for identity verification.'}
          </p>

          {/* Warning for already verified Aadhaar */}
          {hasVerifiedAadhaar && selectedDocument === 'aadhaar' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="text-yellow-500" size={18} />
              <p className="text-yellow-700 text-sm">
                Your Aadhaar is already verified and cannot be changed. {publishRide && 'Please select Driving License to continue.'}
              </p>
            </div>
          )}

          {/* Server Error Message */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-red-600 text-sm">{serverError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section - Document Selection */}
            <div className="space-y-6">
              {/* Document Type Selection */}
              <div className="space-y-3">
                {documentTypes.map((doc) => {
                  const existingDoc = getExistingDocument(doc.apiKey);
                  const isSelected = selectedDocument === doc.id;
                  const isDisabled = doc.id === 'aadhaar' && hasVerifiedAadhaar;
                  
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        if (isDisabled) {
                          toast.info('Your Aadhaar is already verified. Please upload Driving License.');
                          return;
                        }
                        setSelectedDocument(doc.id);
                        setServerError(null);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : 'border-border bg-card hover:border-muted-foreground/30'
                      }`}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary/10' : 'bg-secondary'
                        }`}>
                          {doc.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                          {existingDoc && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${
                              existingDoc.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              <Check size={10} /> 
                              {existingDoc.verificationStatus === 'verified' ? 'Already verified' : 'Pending verification'}
                            </p>
                          )}
                          {doc.required && !existingDoc && (
                            <p className="text-xs text-red-600 mt-1">
                              Required
                            </p>
                          )}
                          {isDisabled && (
                            <p className="text-xs text-gray-500 mt-1">
                              Already verified
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Show Existing Documents Info */}
              {existingDocuments.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-foreground mb-2">Your Saved Documents</h3>
                  {existingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm p-2 hover:bg-secondary/50 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          doc.verificationStatus === 'verified' ? 'bg-green-100' : 
                          doc.verificationStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Check size={12} className={
                            doc.verificationStatus === 'verified' ? 'text-green-600' : 
                            doc.verificationStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          } />
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            {doc.documentType === 'aadhaar' ? 'Aadhaar' : 'Driving License'}:
                          </span>
                          <p className="font-medium">{doc.documentNumber}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.verificationStatus === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : doc.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.verificationStatus === 'verified' 
                          ? 'Verified' 
                          : doc.verificationStatus === 'pending'
                          ? 'Pending'
                          : 'Rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Section - Document Details Form */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {selectedDocument === 'aadhaar' ? 'Aadhaar Details' : 'Driving License Details'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDocument === 'aadhaar' && hasVerifiedAadhaar 
                    ? 'Your Aadhaar is already verified. Please select Driving License to continue.'
                    : 'Enter your document information below'}
                </p>
              </div>

              {/* Document Number Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{getLabel()}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={documentNumber}
                    onChange={handleDocumentNumberChange}
                    className={`w-full h-12 px-4 bg-background border border-border rounded-lg text-base pr-12 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 ${
                      selectedDocument === 'aadhaar' && hasVerifiedAadhaar ? 'cursor-not-allowed' : ''
                    }`}
                    disabled={isUploading || (selectedDocument === 'aadhaar' && hasVerifiedAadhaar)}
                    autoFocus={!(selectedDocument === 'aadhaar' && hasVerifiedAadhaar)}
                    maxLength={selectedDocument === 'aadhaar' ? 14 : 17}
                  />
                  {isInputValid() && !serverError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-xs ${
                  isInputValid() ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {getValidationMessage()}
                </p>
              </div>

              {/* Example Format */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Format:</p>
                {selectedDocument === 'aadhaar' ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• Exactly 12 digits</p>
                    <p className="text-xs text-muted-foreground">• Only numbers allowed</p>
                    <p className="text-xs text-muted-foreground">• Example: 1234 5678 9012</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• First 2 characters: State code (e.g., TN, DL, MH)</p>
                    <p className="text-xs text-muted-foreground">• Next 13 characters: Alphanumeric</p>
                    <p className="text-xs text-muted-foreground">• Total: 15 characters</p>
                    <p className="text-xs text-muted-foreground">• Example: TN01AB655312345</p>
                  </div>
                )}
              </div>

              {/* Save & Continue Button */}
              <button
                onClick={handleSaveAndContinue}
                disabled={isUploading || !isInputValid() || (selectedDocument === 'aadhaar' && hasVerifiedAadhaar)}
                className="w-full h-12 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Saving Document...</span>
                  </div>
                ) : selectedDocument === 'aadhaar' && hasVerifiedAadhaar ? (
                  'Aadhaar Already Verified'
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IDProof;
